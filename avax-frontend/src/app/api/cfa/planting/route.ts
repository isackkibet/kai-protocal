import { NextResponse } from 'next/server';
import { MiningTier } from '@prisma/client';
import { awardXp } from '@/lib/mining/engine';
import { buildPlantingData, createConservationRecord, PLANTING_SCHEMA } from '@/lib/mrv/records';
import { withMember } from '@/lib/nursery/db';
import { nurseryRead, nurseryWrite, toDate } from '@/lib/nursery/route';
import { count, day, id, text } from '@/lib/nursery/validate';

/** Kai Bar points credited for planting a batch — change here (KAI Nuvari PRD §3). */
const PLANTING_POINTS = 20;

/**
 * /api/cfa/planting — plant seedlings from a nursery batch.
 *
 * POST { inventoryId, plantingDate, quantity? }. Planting the whole batch
 * marks it `planted`; planting part of it splits the batch so the counts
 * always add up (the rest stays in_inventory). Each planting also:
 *   - logs a `planting` nursery activity,
 *   - becomes a hashed, versioned MRV conservation record (planting/v1),
 *   - credits the member's Kai Bar once.
 * GET lists planted batches with their public /verify record.
 */
export async function GET() {
  return nurseryRead('cfa/planting', async ({ prisma, cfa }) => {
    const planted = await prisma.seedlingBatch.findMany({
      where: { cfaId: cfa.id, status: 'planted' },
      orderBy: { plantingDate: 'desc' },
      take: 50,
      include: { species: { select: { commonName: true } }, location: { select: { name: true } } },
    });
    const records = await prisma.conservationRecord.findMany({
      where: { sourceTable: 'seedling_inventory', sourceId: { in: planted.map((b) => b.id) } },
      select: { id: true, sourceId: true },
    });
    const verifyId = new Map(records.map((r) => [r.sourceId, r.id]));
    return NextResponse.json({ planted: planted.map((b) => ({ ...b, verifyId: verifyId.get(b.id) ?? null })) });
  }, { planted: [] });
}

export async function POST(req: Request) {
  return nurseryWrite(req, 'cfa/planting', async ({ prisma, cfa, member, privyUserId, body }) => {
    const inventoryId = id(body, 'inventoryId', { required: true })!;
    const plantingDate = day(body, 'plantingDate', { required: true })!;
    const requested = count(body, 'quantity', { min: 1 });
    const note = text(body, 'notes', { max: 2000 });

    const result = await withMember(prisma, member.id, async (tx) => {
      // Lock the batch so two members can't plant the same seedlings at once.
      await tx.$queryRaw`SELECT id FROM seedling_inventory WHERE id = ${inventoryId}::uuid FOR UPDATE`;
      const batch = await tx.seedlingBatch.findUnique({ where: { id: inventoryId }, include: { species: true } });
      if (!batch || batch.cfaId !== cfa.id) return { error: 'Unknown batch.', status: 404 } as const;
      if (batch.status !== 'in_inventory') return { error: `This batch is already ${batch.status.replace('_', ' ')}.`, status: 409 } as const;

      const quantity = requested ?? batch.quantity;
      if (quantity > batch.quantity) {
        return { error: `Only ${batch.quantity} seedlings are left in this batch.`, status: 400 } as const;
      }

      let planted;
      if (quantity === batch.quantity) {
        planted = await tx.seedlingBatch.update({
          where: { id: batch.id },
          data: { status: 'planted', plantingDate: toDate(plantingDate), updatedBy: member.id },
        });
      } else {
        await tx.seedlingBatch.update({
          where: { id: batch.id },
          data: { quantity: batch.quantity - quantity, updatedBy: member.id },
        });
        planted = await tx.seedlingBatch.create({
          data: {
            cfaId: batch.cfaId,
            speciesId: batch.speciesId,
            locationId: batch.locationId,
            quantity,
            status: 'planted',
            dateReceived: batch.dateReceived,
            plantingDate: toDate(plantingDate),
            source: batch.source,
            notes: note ?? batch.notes,
            metadata: { ...(batch.metadata as object), split_from: batch.id },
            createdBy: member.id,
            updatedBy: member.id,
          },
        });
      }

      await tx.nurseryActivity.create({
        data: {
          cfaId: batch.cfaId,
          locationId: batch.locationId,
          inventoryId: planted.id,
          activityType: 'planting',
          activityDate: toDate(plantingDate)!,
          quantityAffected: quantity,
          description: note,
          performedBy: member.id,
        },
      });
      return { planted, species: batch.species, quantity } as const;
    });

    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });
    const { planted, species, quantity } = result;

    // MRV integrity layer: the planting as a canonical, SHA-256-fingerprinted,
    // versioned conservation record, linked to the planted batch so it is
    // never recorded twice. Best-effort — the planting is already saved.
    let mrvRecord: { id: string; dataHash: string; verificationStatus: string } | null = null;
    try {
      const created = await createConservationRecord(prisma, {
        forestId: cfa.id,
        recordType: 'PLANTING',
        schemaVersion: PLANTING_SCHEMA,
        data: buildPlantingData({
          forest: { id: cfa.id, name: cfa.name, locationRegion: cfa.location },
          species: { id: species.id, name: `${species.commonName} (${species.scientificName})` },
          quantity,
          plantedAt: planted.plantingDate!,
          activity: note,
          memberId: member.id,
          submitterName: member.name,
        }),
        sourceTable: 'seedling_inventory',
        sourceId: planted.id,
        memberId: member.id,
      });
      mrvRecord = { id: created.id, dataHash: created.dataHash, verificationStatus: created.verificationStatus };
    } catch (e) {
      console.error('[cfa/planting] conservation record not created', e);
    }

    // Kai Bar points, once per planted batch (the ledger reference is the batch).
    let pointsEarned = 0;
    try {
      const kaiUser = await prisma.kaiUser.findUnique({ where: { privyUserId } });
      if (kaiUser) {
        const already = await prisma.kaiBarLedger.findFirst({ where: { userId: kaiUser.id, referenceId: planted.id } });
        if (!already) {
          await prisma.kaiBarLedger.create({
            data: {
              userId: kaiUser.id,
              type: 'COMMUNITY_ACTIVITY',
              amount: PLANTING_POINTS,
              description: `Planted ${quantity} ${species.commonName} seedling(s)`,
              referenceId: planted.id,
            },
          });
          pointsEarned = PLANTING_POINTS;
        }
        // Nuvari v4 §3.2 — verified ecological work maps to TIER_2 XP (idempotent).
        await awardXp({ prisma, userId: kaiUser.id, tier: MiningTier.TIER_2, source: 'PLANTING', referenceId: planted.id }).catch((e) =>
          console.error('[cfa/planting] awardXp failed', e),
        );
      }
    } catch (e) {
      console.error('[cfa/planting] points not credited', e); // points are best-effort
    }

    return NextResponse.json({ ok: true, batch: planted, pointsEarned, mrvRecord });
  });
}

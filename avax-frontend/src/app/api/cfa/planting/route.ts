import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { verifyPrivyUserId } from '@/lib/privy-server';
import { getOrCreateDefaultForest } from '@/lib/cfa';
import { MiningTier } from '@prisma/client';
import { awardXp } from '@/lib/mining-engine';
import { buildPlantingData, createConservationRecord, PLANTING_SCHEMA } from '@/lib/mrv/records';
import { requireRateLimit } from '@/lib/security/route-guard';
import { readJsonBody, assertNoPrivilegeEscalation, InputError } from '@/lib/security/input';

/** Kai Bar points credited for a verified planting submission — change here (KAI Nuvari PRD §3). */
const PLANTING_POINTS = 20;

/**
 * /api/cfa/planting  —  GET / POST
 *
 * A planting event (KAI Nuvari PRD §5 "Planting"): species, number planted,
 * date, CFA, and who submitted it. If the submitter is a signed-in Kai Bar
 * member, this also credits Kai Bar points once the record is created — the
 * "conservation activity becomes points" handoff from PRD §7.
 */
export async function GET() {
  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ records: [], db: false });

  const forest = await getOrCreateDefaultForest();
  if (!forest) return NextResponse.json({ records: [], db: false });

  try {
    const records = await prisma.plantingRecord.findMany({
      where: { forestId: forest.id },
      orderBy: { plantedAt: 'desc' },
      take: 50,
      include: { species: { select: { name: true } }, submittedBy: { select: { name: true } } },
    });

    return NextResponse.json({ records });
  } catch (e) {
    console.error('[cfa/planting] database unavailable', e);
    return NextResponse.json({ records: [], db: false });
  }
}

export async function POST(req: Request) {
  // Writes create both a planting row AND a fingerprinted MRV record, and the
  // Kai Bar path runs a transaction with row locks. Unbounded, that is a cheap
  // way to bloat the table and hammer the database.
  const limited = await requireRateLimit(req, [
    { scope: 'ip', limit: 30, windowMs: 60_000 },
  ]);
  if (!limited.ok) return limited.response;

  let body: Record<string, unknown> = {};
  try {
    // Sanitised parse: rejects injection payloads and strips prototype-pollution
    // keys, rather than trusting a raw JSON.parse of user input.
    body = (await readJsonBody(req)) as Record<string, unknown>;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof InputError ? err.message : 'Invalid JSON body' },
      { status: 400 },
    );
  }

  // Conservation records are meant to be tamper-evident, so a client must never
  // be able to assert a trust-level field when creating one.
  try {
    assertNoPrivilegeEscalation(body);
  } catch (err) {
    if (err instanceof InputError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  const speciesId = String(body.speciesId ?? '').trim();
  const numberPlanted = Math.max(0, Number(body.numberPlanted) || 0);
  const activity = body.activity ? String(body.activity).trim() : null;
  const submittedName = body.submittedName ? String(body.submittedName).trim() : null;
  const plantedAt = body.plantedAt ? new Date(String(body.plantedAt)) : new Date();

  if (!speciesId || numberPlanted <= 0) {
    return NextResponse.json({ error: 'speciesId and a positive numberPlanted are required' }, { status: 400 });
  }

  // Upper bound: a plausible nursery/field planting. Without a ceiling, one
  // request could claim 10^15 trees and poison any downstream total.
  if (numberPlanted > 1_000_000) {
    return NextResponse.json({ error: 'numberPlanted exceeds the maximum plausible value' }, { status: 400 });
  }

  // Reject an unparseable date rather than silently storing Invalid Date,
  // which would break the MRV record's canonical hash determinism.
  if (Number.isNaN(plantedAt.getTime())) {
    return NextResponse.json({ error: 'plantedAt is not a valid date' }, { status: 400 });
  }
  // And not in the future.
  if (plantedAt.getTime() > Date.now() + 60_000) {
    return NextResponse.json({ error: 'plantedAt cannot be in the future' }, { status: 400 });
  }

  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });

  const forest = await getOrCreateDefaultForest();
  if (!forest) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });

  const species = await prisma.treeSpecies.findUnique({ where: { id: speciesId } });
  if (!species || species.forestId !== forest.id) {
    return NextResponse.json({ error: 'Unknown species' }, { status: 404 });
  }

  // Identity is verified server-side (never trusted from the body) so a
  // submitter can only earn points for themselves (PRD 1 §12 pattern).
  const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
  const kaiUser = privyUserId ? await prisma.kaiUser.findUnique({ where: { privyUserId } }) : null;
  const member = kaiUser ? await prisma.forestMember.findUnique({ where: { kaiUserId: kaiUser.id } }) : null;

  try {
    const record = await prisma.plantingRecord.create({
      data: {
        forestId: forest.id,
        speciesId,
        numberPlanted,
        plantedAt,
        activity,
        submittedById: member?.id ?? null,
        submittedName: member ? null : submittedName,
        pointsAwarded: false,
      },
    });

    // MRV integrity layer (Canuvari PRD §4): the same event as a canonical,
    // SHA-256-fingerprinted, versioned conservation record. Linked to this
    // planting row so it can never be recorded twice. Best-effort: if it
    // fails, the planting is still saved and the response says so.
    let mrvRecord: { id: string; dataHash: string; verificationStatus: string } | null = null;
    try {
      const created = await createConservationRecord(prisma, {
        forestId: forest.id,
        recordType: 'PLANTING',
        schemaVersion: PLANTING_SCHEMA,
        data: buildPlantingData({
          forest,
          species,
          quantity: numberPlanted,
          plantedAt,
          activity,
          memberId: member?.id ?? null,
          submitterName: member ? member.name : submittedName,
        }),
        sourceTable: 'planting_records',
        sourceId: record.id,
        memberId: member?.id ?? null,
      });
      mrvRecord = { id: created.id, dataHash: created.dataHash, verificationStatus: created.verificationStatus };
    } catch (e) {
      console.error('[cfa/planting] conservation record not created', e);
    }

    await prisma.treeSpecies.update({
      where: { id: speciesId },
      data: { quantityPlanted: { increment: numberPlanted }, quantityAvailable: { decrement: Math.min(numberPlanted, species.quantityAvailable) } },
    });

    let pointsEarned = 0;
    if (member) {
      await prisma.$transaction([
        prisma.kaiBarLedger.create({
          data: {
            userId: member.kaiUserId!,
            type: 'COMMUNITY_ACTIVITY',
            amount: PLANTING_POINTS,
            description: `Planted ${numberPlanted} ${species.name} seedling(s)`,
            referenceId: record.id,
          },
        }),
        prisma.plantingRecord.update({ where: { id: record.id }, data: { pointsAwarded: true } }),
      ]);
      pointsEarned = PLANTING_POINTS;

      // Nuvari v4 §3.2 — verified ecological work maps to TIER_2 XP.
      // Idempotent by (user, tier, source, referenceId=record.id).
      try {
        await awardXp({ prisma, userId: member.kaiUserId!, tier: MiningTier.TIER_2, source: 'PLANTING', referenceId: record.id });
      } catch (e) {
        console.error('[cfa/planting] awardXp failed', e); // XP is best-effort
      }
    }

    return NextResponse.json({ ok: true, record, pointsEarned, mrvRecord });
  } catch (e: unknown) {
    console.error('[cfa/planting] failed', e);
    return NextResponse.json({ error: 'Failed to record planting' }, { status: 500 });
  }
}

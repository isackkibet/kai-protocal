import { NextResponse } from 'next/server';
import { MiningTier } from '@prisma/client';
import { awardXp } from '@/lib/mining/engine';
import { recordForSource } from '@/lib/mrv/sources';
import { withMember } from '@/lib/nursery/db';
import { nurseryRead, nurseryWrite, toDate } from '@/lib/nursery/route';
import { day, id, survivalCounts, text } from '@/lib/nursery/validate';

/** Kai Bar points credited for a survival check — change here (KAI Nuvari PRD §3). */
const SURVIVAL_POINTS = 15;

/**
 * /api/cfa/survival — periodic survival checks on a batch
 * (Kanuvari nursery DB: `survival_observations`). The member enters the
 * initial, alive and dead counts; the DATABASE computes survival_rate
 * (alive / initial × 100) and rejects alive + dead > initial. Separate rows
 * per check, so survival can be tracked over time. Each check also becomes a
 * hashed, versioned MRV record (survival/v1) that a verifier can review.
 */
export async function GET() {
  return nurseryRead('cfa/survival', async ({ prisma, cfa }) => {
    const observations = await prisma.survivalObservation.findMany({
      where: { batch: { cfaId: cfa.id } },
      orderBy: [{ observationDate: 'desc' }, { createdAt: 'desc' }],
      take: 50,
      include: { batch: { select: { species: { select: { commonName: true } }, quantity: true } } },
    });
    return NextResponse.json({ observations });
  }, { observations: [] });
}

export async function POST(req: Request) {
  return nurseryWrite(req, 'cfa/survival', async ({ prisma, cfa, member, privyUserId, body }) => {
    const inventoryId = id(body, 'inventoryId', { required: true })!;
    const observationDate = day(body, 'observationDate') ?? new Date().toISOString().slice(0, 10);
    const { initialQuantity, aliveQuantity, deadQuantity } = survivalCounts(body);
    const notes = text(body, 'notes', { max: 2000 });

    const batch = await prisma.seedlingBatch.findUnique({ where: { id: inventoryId }, include: { species: true } });
    if (!batch || batch.cfaId !== cfa.id) return NextResponse.json({ error: 'Unknown batch.' }, { status: 404 });

    const observation = await withMember(prisma, member.id, (tx) =>
      tx.survivalObservation.create({
        data: {
          inventoryId,
          observationDate: toDate(observationDate)!,
          initialQuantity,
          aliveQuantity,
          deadQuantity,
          observedBy: member.id,
          notes,
        },
      }),
    );

    // MRV record (best-effort — the observation is already saved; a member
    // can still submit it later from the verification desk).
    let mrvRecord: { id: string; dataHash: string; verificationStatus: string } | null = null;
    try {
      const created = await recordForSource(prisma, cfa, 'survival_observations', observation.id);
      mrvRecord = { id: created.id, dataHash: created.dataHash, verificationStatus: created.verificationStatus };
    } catch (e) {
      console.error('[cfa/survival] conservation record not created', e);
    }

    // Kai Bar points, once per observation.
    let pointsEarned = 0;
    try {
      const kaiUser = await prisma.kaiUser.findUnique({ where: { privyUserId } });
      if (kaiUser) {
        await prisma.kaiBarLedger.create({
          data: {
            userId: kaiUser.id,
            type: 'COMMUNITY_ACTIVITY',
            amount: SURVIVAL_POINTS,
            description: `Survival check for ${batch.species.commonName} (${observation.survivalRate ?? 0}%)`,
            referenceId: observation.id,
          },
        });
        pointsEarned = SURVIVAL_POINTS;
        await awardXp({ prisma, userId: kaiUser.id, tier: MiningTier.TIER_2, source: 'SURVIVAL', referenceId: observation.id }).catch((e) =>
          console.error('[cfa/survival] awardXp failed', e),
        );
      }
    } catch (e) {
      console.error('[cfa/survival] points not credited', e);
    }

    return NextResponse.json({ ok: true, observation, pointsEarned, mrvRecord });
  });
}

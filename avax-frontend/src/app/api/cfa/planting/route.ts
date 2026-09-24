import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { verifyPrivyUserId } from '@/lib/privy-server';
import { getOrCreateDefaultForest } from '@/lib/cfa';
import { MiningTier } from '@prisma/client';
import { awardXp } from '@/lib/mining-engine';

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
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const speciesId = String(body.speciesId ?? '').trim();
  const numberPlanted = Math.max(0, Number(body.numberPlanted) || 0);
  const activity = body.activity ? String(body.activity).trim() : null;
  const submittedName = body.submittedName ? String(body.submittedName).trim() : null;
  const plantedAt = body.plantedAt ? new Date(String(body.plantedAt)) : new Date();

  if (!speciesId || numberPlanted <= 0) {
    return NextResponse.json({ error: 'speciesId and a positive numberPlanted are required' }, { status: 400 });
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

    return NextResponse.json({ ok: true, record, pointsEarned });
  } catch (e: unknown) {
    console.error('[cfa/planting] failed', e);
    return NextResponse.json({ error: 'Failed to record planting' }, { status: 500 });
  }
}

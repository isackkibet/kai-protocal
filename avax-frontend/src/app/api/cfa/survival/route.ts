import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { verifyPrivyUserId } from '@/lib/privy-server';
import { getOrCreateDefaultForest } from '@/lib/cfa';

/** Kai Bar points credited for a verified survival check-in — change here (KAI Nuvari PRD §3). */
const SURVIVAL_POINTS = 15;

/**
 * /api/cfa/survival  —  GET / POST
 *
 * A survival follow-up (KAI Nuvari PRD §5 "Survival"): number planted vs
 * number surviving, survival rate, observation date.
 */
export async function GET() {
  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ records: [], db: false });

  const forest = await getOrCreateDefaultForest();
  if (!forest) return NextResponse.json({ records: [], db: false });

  const records = await prisma.survivalRecord.findMany({
    where: { forestId: forest.id },
    orderBy: { observedAt: 'desc' },
    take: 50,
    include: { species: { select: { name: true } } },
  });

  return NextResponse.json({ records });
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
  const numberSurviving = Math.max(0, Number(body.numberSurviving) || 0);
  const observedAt = body.observedAt ? new Date(String(body.observedAt)) : new Date();

  if (!speciesId || numberPlanted <= 0) {
    return NextResponse.json({ error: 'speciesId and a positive numberPlanted are required' }, { status: 400 });
  }
  if (numberSurviving > numberPlanted) {
    return NextResponse.json({ error: 'numberSurviving cannot exceed numberPlanted' }, { status: 400 });
  }

  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });

  const forest = await getOrCreateDefaultForest();
  if (!forest) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });

  const species = await prisma.treeSpecies.findUnique({ where: { id: speciesId } });
  if (!species || species.forestId !== forest.id) {
    return NextResponse.json({ error: 'Unknown species' }, { status: 404 });
  }

  const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
  const kaiUser = privyUserId ? await prisma.kaiUser.findUnique({ where: { privyUserId } }) : null;
  const member = kaiUser ? await prisma.forestMember.findUnique({ where: { kaiUserId: kaiUser.id } }) : null;

  try {
    const survivalRate = numberPlanted > 0 ? (numberSurviving / numberPlanted) * 100 : 0;

    const record = await prisma.survivalRecord.create({
      data: {
        forestId: forest.id,
        speciesId,
        numberPlanted,
        numberSurviving,
        survivalRate,
        observedAt,
        submittedById: member?.id ?? null,
        pointsAwarded: false,
      },
    });

    let pointsEarned = 0;
    if (member) {
      await prisma.$transaction([
        prisma.kaiBarLedger.create({
          data: {
            userId: member.kaiUserId!,
            type: 'COMMUNITY_ACTIVITY',
            amount: SURVIVAL_POINTS,
            description: `Survival check for ${species.name} (${survivalRate.toFixed(0)}%)`,
            referenceId: record.id,
          },
        }),
        prisma.survivalRecord.update({ where: { id: record.id }, data: { pointsAwarded: true } }),
      ]);
      pointsEarned = SURVIVAL_POINTS;
    }

    return NextResponse.json({ ok: true, record, pointsEarned });
  } catch (e: unknown) {
    console.error('[cfa/survival] failed', e);
    return NextResponse.json({ error: 'Failed to record survival check' }, { status: 500 });
  }
}

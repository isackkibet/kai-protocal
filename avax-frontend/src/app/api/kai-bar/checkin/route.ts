import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { verifyPrivyUserId } from '@/lib/privy-server';

/** Fallback daily-sign-in reward if no active DAILY_CHECKIN RewardTask row exists. */
const DEFAULT_DAILY_POINTS = 10;

function isSameCalendarDay(a: Date, b: Date) {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
}

/**
 * /api/kai-bar/checkin  —  GET / POST
 *
 * Daily sign-in reward (KAI Nuvari PRD §3). Unlike the generic
 * /api/kai-bar/tasks/complete flow (whose TaskCompletion row is a permanent,
 * one-time guard), this is gated by `KaiUser.lastCheckInAt` so it resets
 * every calendar day instead of being claimable only once ever.
 */
export async function GET(req: Request) {
  const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
  const prisma = await getPrisma();
  if (!prisma || !privyUserId) return NextResponse.json({ claimedToday: false, points: DEFAULT_DAILY_POINTS });

  const user = await prisma.kaiUser.findUnique({ where: { privyUserId }, select: { lastCheckInAt: true } });
  const task = await prisma.rewardTask.findFirst({ where: { taskType: 'DAILY_CHECKIN', active: true } });

  const claimedToday = !!(user?.lastCheckInAt && isSameCalendarDay(user.lastCheckInAt, new Date()));
  return NextResponse.json({ claimedToday, points: task?.rewardAmount ?? DEFAULT_DAILY_POINTS });
}

export async function POST(req: Request) {
  const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
  if (!privyUserId) {
    return NextResponse.json({ error: 'Could not verify your session. Please sign in again.' }, { status: 401 });
  }

  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });

  try {
    const user = await prisma.kaiUser.findUnique({ where: { privyUserId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (user.status === 'BLOCKED') {
      return NextResponse.json({ error: 'Account blocked' }, { status: 403 });
    }

    const now = new Date();
    if (user.lastCheckInAt && isSameCalendarDay(user.lastCheckInAt, now)) {
      return NextResponse.json({ error: "Today's reward already claimed", already: true }, { status: 409 });
    }

    const task = await prisma.rewardTask.findFirst({ where: { taskType: 'DAILY_CHECKIN', active: true } });
    const points = task?.rewardAmount ?? DEFAULT_DAILY_POINTS;

    const [, ledger] = await prisma.$transaction([
      prisma.kaiUser.update({ where: { id: user.id }, data: { lastCheckInAt: now } }),
      prisma.kaiBarLedger.create({
        data: { userId: user.id, type: 'TASK', amount: points, description: 'Daily sign-in', referenceId: `checkin:${now.toISOString().slice(0, 10)}` },
      }),
    ]);

    return NextResponse.json({ ok: true, earned: points, entry: ledger.id });
  } catch (e: unknown) {
    console.error('[kai-bar/checkin] failed', e);
    return NextResponse.json({ error: 'Failed to claim daily reward' }, { status: 500 });
  }
}

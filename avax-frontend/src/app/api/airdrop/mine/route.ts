import { NextResponse } from 'next/server';
import { resolveAirdropUser } from '@/lib/airdrop-auth';
import { getPrisma } from '@/lib/db';

/** Auto-Miner accrual rate (AIRDROP_SPEC.md §AC-5). */
const POINTS_PER_SECOND = 0.05;
/**
 * The page flushes every 30s while it is open and visible. Anything older than
 * this window is time the page was not mining (tab closed or hidden), so it
 * does not accrue.
 */
const MAX_WINDOW_MS = 60_000;
const REF_PREFIX = 'autominer_';

/**
 * POST /api/airdrop/mine
 * Auto-Miner flush endpoint: the page calls it every 30 seconds while open.
 *
 * Body: { accumulatedPoints: number }
 *
 * The server measures the time itself instead of trusting the client's
 * number: it credits at most POINTS_PER_SECOND for the time since the last
 * credited batch (capped to MAX_WINDOW_MS), and never more than the client
 * says it mined. The un-credited fraction carries over through the watermark
 * stored in the ledger entry's referenceId, so floor() does not eat 1/3 of
 * every batch.
 *
 * Mock mode (no DATABASE_URL): silently acknowledges the request.
 */
export async function POST(req: Request) {
  try {
    const auth = await resolveAirdropUser(req);
    if (auth.error) return auth.error;
    const { userId } = auth;

    const body = await req.json().catch(() => ({}));
    const reported = Number(body?.accumulatedPoints ?? 0);
    if (!Number.isFinite(reported) || reported <= 0) {
      return NextResponse.json({ ok: true, flushed: 0, msg: 'Nothing to flush' });
    }

    const prisma = await getPrisma();
    if (!prisma) {
      return NextResponse.json({ ok: true, flushed: Math.floor(reported), mode: 'mock' });
    }

    const user = await prisma.kaiUser.findFirst({
      where: { OR: [{ id: userId }, { privyUserId: userId }] },
      select: { id: true, status: true },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Finish signing up to start mining.' }, { status: 404 });
    }
    if (user.status === 'BLOCKED') {
      return NextResponse.json({ ok: false, error: 'Account restricted' }, { status: 403 });
    }

    const flushed = await prisma.$transaction(async (tx) => {
      // Serialise flushes per user so two tabs cannot both credit the same window.
      await tx.$queryRaw`SELECT id FROM kai_users WHERE id = ${user.id} FOR UPDATE`;

      const last = await tx.kaiBarLedger.findFirst({
        where: { userId: user.id, referenceId: { startsWith: REF_PREFIX } },
        orderBy: { createdAt: 'desc' },
        select: { referenceId: true, createdAt: true },
      });
      const now = Date.now();
      const lastMark = Number(last?.referenceId?.slice(REF_PREFIX.length)) || last?.createdAt.getTime() || 0;
      const start = Math.max(lastMark, now - MAX_WINDOW_MS);

      const earned = Math.floor(((now - start) / 1000) * POINTS_PER_SECOND);
      const points = Math.min(earned, Math.ceil(reported));
      if (points <= 0) return 0;

      // Advance the watermark only by the time these whole points represent.
      const mark = Math.round(start + (points / POINTS_PER_SECOND) * 1000);
      await tx.kaiBarLedger.create({
        data: {
          userId: user.id,
          type: 'CAMPAIGN',
          amount: points,
          description: `Auto-Miner batch (+${points} pts @ ${POINTS_PER_SECOND} pts/s)`,
          referenceId: `${REF_PREFIX}${mark}`,
        },
      });
      await tx.userMiningStat.upsert({
        where: { userId: user.id },
        update: { lifetimeXP: { increment: points }, lastActiveAt: new Date(now) },
        create: { userId: user.id, hashPower: 0, lifetimeXP: points, lastActiveAt: new Date(now) },
      });
      return points;
    });

    return NextResponse.json({ ok: true, flushed, mode: 'live' });
  } catch (error: unknown) {
    console.error('[/api/airdrop/mine] error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to flush miner batch' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { verifyPrivyUserId } from '@/lib/privy-server';

/**
 * /api/whitelist  —  GET / POST
 *
 * Waitlist whitelist membership for the signed-in member.
 *
 * GET  — returns the caller's own status ({ whitelisted, joinedBy, joinedAt })
 *        plus public totals ({ joinedCount, whitelistedCount }).
 * POST — self-service claim: any authenticated, non-blocked member puts
 *        themselves on the whitelist. Idempotent; existing membership wins.
 *
 * Identical to /kai-bar/*: the bearer token is verified server-side, never
 * trusted from the body.
 */
export async function GET(req: Request) {
  const prisma = await getPrisma();
  if (!prisma) {
    return NextResponse.json({ whitelisted: false, joinedCount: 0, whitelistedCount: 0 });
  }

  const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
  let mine: { joinedBy: string; joinedAt: Date } | null = null;
  if (privyUserId) {
    const user = await prisma.kaiUser.findUnique({
      where: { privyUserId },
      select: { whitelistEntry: { select: { joinedBy: true, joinedAt: true } } },
    });
    mine = user?.whitelistEntry ?? null;
  }

  const [joinedCount, whitelistedCount] = await Promise.all([
    prisma.kaiUser.count(),
    prisma.whitelistEntry.count(),
  ]);

  return NextResponse.json({
    whitelisted: !!mine,
    joinedBy: mine?.joinedBy ?? null,
    joinedAt: mine?.joinedAt?.toISOString() ?? null,
    joinedCount,
    whitelistedCount,
  });
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

    const entry = await prisma.whitelistEntry.upsert({
      where: { userId: user.id },
      create: { userId: user.id, joinedBy: 'SELF' },
      update: {}, // already whitelisted — keep the original joinedBy/joinedAt
    });

    return NextResponse.json({ ok: true, whitelisted: true, joinedBy: entry.joinedBy, joinedAt: entry.joinedAt.toISOString() });
  } catch (e: unknown) {
    console.error('[whitelist] self-join failed', e);
    return NextResponse.json({ error: 'Could not join the whitelist' }, { status: 500 });
  }
}
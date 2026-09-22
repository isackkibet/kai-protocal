import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { isAuthorizedAdmin } from '@/lib/admin-auth';

/**
 * /api/whitelist/members  —  GET / POST  (admin only)
 *
 * GET  — every signed-up member with their whitelist status, so ops can see
 *        who joined and who is already whitelisted (and whether they claimed
 *        it themselves — `joinedBy: SELF` — or were granted it by an admin).
 * POST — whitelist or remove a member: { userId, action: 'whitelist'|'remove' }.
 *
 * Both are protected by the ADMIN_API_KEY header gate (lib/admin-auth.ts) —
 * the same gate as M-Pesa B2C payouts. Fails closed when unconfigured.
 */
export async function GET(req: Request) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });

  const users = await prisma.kaiUser.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      referralCode: true,
      createdAt: true,
      wallets: { select: { address: true, chain: true } },
      whitelistEntry: { select: { joinedBy: true, joinedAt: true } },
    },
    orderBy: [{ createdAt: 'desc' }],
  });

  const members = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    status: u.status,
    referralCode: u.referralCode,
    walletAddress: u.wallets.find((w) => w.chain === 'AVALANCHE')?.address ?? null,
    joinedAt: u.createdAt.toISOString(),
    whitelisted: !!u.whitelistEntry,
    whitelistedAt: u.whitelistEntry?.joinedAt.toISOString() ?? null,
    joinedBy: u.whitelistEntry?.joinedBy ?? null,
  }));

  return NextResponse.json({ members });
}

export async function POST(req: Request) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { userId?: string; action?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { userId, action } = body;
  if (!userId || (action !== 'whitelist' && action !== 'remove')) {
    return NextResponse.json({ error: 'userId and action ("whitelist" | "remove") required' }, { status: 400 });
  }

  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });

  try {
    if (action === 'whitelist') {
      const exists = await prisma.kaiUser.findUnique({ where: { id: userId } });
      if (!exists) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      await prisma.whitelistEntry.upsert({
        where: { userId },
        create: { userId, joinedBy: 'ADMIN' },
        update: {}, // already whitelisted — keep original joinedBy/joinedAt
      });
    } else {
      await prisma.whitelistEntry.deleteMany({ where: { userId } });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error('[whitelist/members] failed', e);
    return NextResponse.json({ error: 'Could not update whitelist' }, { status: 500 });
  }
}
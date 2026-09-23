import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { isAuthorizedAdmin } from '@/lib/admin-auth';

/**
 * GET /api/admin/members
 *
 * Read-only member list for the Chairperson/Admin dashboard — who has
 * actually joined KAI Nuvari, how (EMAIL vs GOOGLE), and whether their
 * wallet has attached yet. Gated by the same admin key used elsewhere
 * (x-admin-key header); fails closed if ADMIN_API_KEY isn't configured.
 */
export async function GET(req: Request) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });

  const users = await prisma.kaiUser.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      authProvider: true,
      status: true,
      referralCode: true,
      createdAt: true,
      wallets: { select: { chain: true, address: true } },
    },
  });

  const total = users.length;
  const byProvider = users.reduce<Record<string, number>>((acc, u) => {
    const key = u.authProvider ?? 'UNKNOWN';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const withWallet = users.filter(u => u.wallets.length > 0).length;

  return NextResponse.json({
    summary: { total, byProvider, withWallet, withoutWallet: total - withWallet },
    members: users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      authProvider: u.authProvider ?? 'UNKNOWN',
      status: u.status,
      referralCode: u.referralCode,
      joinedAt: u.createdAt,
      walletAddress: u.wallets[0]?.address ?? null,
    })),
  });
}

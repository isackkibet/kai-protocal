import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/db';
import { isAuthorizedAdmin } from '@/lib/auth/admin-auth';

/**
 * GET /api/admin/members
 *
 * Read-only member list for the Chairperson/Admin dashboard — who has
 * actually joined KAI Nuvari, how (EMAIL vs GOOGLE, or a browser wallet
 * alone), and whether their wallet has attached yet. Gated by the same admin key used elsewhere
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

  // People who joined with a browser wallet only (no email/Google account).
  // A wallet that later attached to a member is counted once, as that member.
  const memberAddresses = new Set(
    users.flatMap(u => u.wallets.map(w => w.address.toLowerCase())),
  );
  let walletOnly: { address: string; connector: string | null; firstSeenAt: Date; lastSeenAt: Date; visits: number }[] = [];
  let walletOnlyError: string | null = null;
  try {
    const rows = await prisma.walletMember.findMany({
      orderBy: { firstSeenAt: 'desc' },
      select: { address: true, connector: true, firstSeenAt: true, lastSeenAt: true, visits: true },
    });
    walletOnly = rows.filter(r => !memberAddresses.has(r.address.toLowerCase()));
  } catch (e) {
    // Table not created yet — keep the member list working regardless.
    console.error('[admin/members] wallet_members unavailable', e);
    walletOnlyError = 'wallet_members table unavailable';
  }

  return NextResponse.json({
    summary: {
      total: total + walletOnly.length,
      accounts: total,
      walletOnly: walletOnly.length,
      byProvider,
      withWallet,
      withoutWallet: total - withWallet,
    },
    walletOnlyMembers: walletOnly,
    walletOnlyError,
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

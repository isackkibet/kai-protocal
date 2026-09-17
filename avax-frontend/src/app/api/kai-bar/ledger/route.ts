import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { verifyPrivyUserId } from '@/lib/privy-server';

/**
 * /api/kai-bar/ledger  —  GET
 *
 * Returns a user's Kai Bar balance (computed from the append-only ledger,
 * PRD 2 §4) plus the recent ledger history.
 *
 * Security: identity comes from the verified bearer token, never a caller-
 * supplied query param — otherwise anyone could read anyone else's balance
 * and full transaction history by guessing/knowing their privyUserId.
 */
export async function GET(req: Request) {
  const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
  if (!privyUserId) {
    return NextResponse.json({ error: 'Could not verify your session. Please sign in again.' }, { status: 401 });
  }

  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ kaiBar: 0, entries: [], db: false });

  try {
    const user = await prisma.kaiUser.findUnique({
      where: { privyUserId },
      select: { id: true, status: true },
    });
    if (!user) return NextResponse.json({ kaiBar: 0, entries: [], exists: false });

    const entries = await prisma.kaiBarLedger.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const kaiBar = entries.reduce((sum, e) => sum + e.amount, 0);

    return NextResponse.json({
      userId: user.id,
      status: user.status,
      kaiBar,
      entries: entries.map((e) => ({
        id: e.id,
        type: e.type,
        amount: e.amount,
        description: e.description,
        referenceId: e.referenceId,
        createdAt: e.createdAt.toISOString(),
      })),
    });
  } catch (e: any) {
    console.error('[kai-bar/ledger] failed', e);
    return NextResponse.json({ error: 'Failed to load ledger' }, { status: 500 });
  }
}

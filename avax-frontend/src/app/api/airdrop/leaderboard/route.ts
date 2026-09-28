import { NextResponse } from 'next/server';
import { verifyPrivyUserId } from '@/lib/privy-server';
import { getPowerLeaderboard } from '@/lib/airdrop-engine';

/** Public: anyone can see the top 10. A signed-in viewer also gets their own row flagged. */
export async function GET(req: Request) {
  try {
    const viewer = await verifyPrivyUserId(req.headers.get('authorization'));
    const leaderboard = await getPowerLeaderboard(viewer ?? undefined);
    return NextResponse.json({ ok: true, data: leaderboard });
  } catch (error: unknown) {
    console.error('[/api/airdrop/leaderboard] error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}

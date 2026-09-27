import { NextResponse } from 'next/server';
import { getPowerLeaderboard } from '@/lib/airdrop-engine';

export async function GET() {
  try {
    const leaderboard = await getPowerLeaderboard();
    return NextResponse.json({ ok: true, data: leaderboard });
  } catch (error: any) {
    console.error('[/api/airdrop/leaderboard] error:', error);
    return NextResponse.json({ ok: false, error: error.message || 'Failed to fetch leaderboard' }, { status: 500 });
  }
}

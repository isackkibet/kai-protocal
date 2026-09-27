import { NextResponse } from 'next/server';
import { verifyPrivyUserId } from '@/lib/privy-server';
import { claimDailyDropRitual } from '@/lib/airdrop-engine';

export async function POST(req: Request) {
  try {
    const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
    const userId = privyUserId || 'did:privy:demo_user_austin';
    const result = await claimDailyDropRitual(userId);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error || 'Failed to claim daily drop' }, { status: 400 });
    }
    return NextResponse.json({ ok: true, data: result });
  } catch (error: any) {
    console.error('[/api/airdrop/claim] error:', error);
    return NextResponse.json({ ok: false, error: error.message || 'Server error claiming daily drop' }, { status: 500 });
  }
}

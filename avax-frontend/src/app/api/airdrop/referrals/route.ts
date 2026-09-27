import { NextResponse } from 'next/server';
import { verifyPrivyUserId } from '@/lib/privy-server';
import { getUserReferrals } from '@/lib/airdrop-engine';

export async function GET(req: Request) {
  try {
    const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
    const userId = privyUserId || 'did:privy:demo_user_austin';
    const referrals = await getUserReferrals(userId);
    return NextResponse.json({ ok: true, data: referrals });
  } catch (error: any) {
    console.error('[/api/airdrop/referrals] error:', error);
    return NextResponse.json({ ok: false, error: error.message || 'Failed to fetch referrals' }, { status: 500 });
  }
}

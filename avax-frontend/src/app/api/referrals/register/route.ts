import { NextResponse } from 'next/server';
import { verifyPrivyUserId } from '@/lib/privy-server';
import { registerReferralCode } from '@/lib/airdrop-engine';

export async function POST(req: Request) {
  try {
    const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
    const userId = privyUserId || 'did:privy:demo_user_austin';
    const body = await req.json();
    const { referralCode } = body;

    if (!referralCode) {
      return NextResponse.json({ ok: false, error: 'Referral code is required' }, { status: 400 });
    }

    const result = await registerReferralCode(userId, referralCode);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error || 'Failed to register referral' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, data: result });
  } catch (error: any) {
    console.error('[/api/referrals/register] error:', error);
    return NextResponse.json({ ok: false, error: error.message || 'Server error registering referral' }, { status: 500 });
  }
}

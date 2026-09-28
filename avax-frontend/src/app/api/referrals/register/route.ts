import { NextResponse } from 'next/server';
import { resolveAirdropUser } from '@/lib/airdrop-auth';
import { registerReferralCode } from '@/lib/airdrop-engine';

export async function POST(req: Request) {
  try {
    const auth = await resolveAirdropUser(req);
    if (auth.error) return auth.error;
    const { userId } = auth;
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
  } catch (error: unknown) {
    console.error('[/api/referrals/register] error:', error);
    return NextResponse.json({ ok: false, error: 'Server error registering referral' }, { status: 500 });
  }
}

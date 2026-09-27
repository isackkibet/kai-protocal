import { NextResponse } from 'next/server';
import { verifyPrivyUserId } from '@/lib/privy-server';
import { getAirdropSummary } from '@/lib/airdrop-engine';

export async function GET(req: Request) {
  try {
    const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
    const userId = privyUserId || 'did:privy:demo_user_austin';
    const summary = await getAirdropSummary(userId);
    return NextResponse.json({
      ok: true,
      data: {
        code: summary.referralCode,
        link: summary.referralLink,
        totalReferrals: summary.totalReferrals,
        activeReferrals: summary.activeReferrals,
        referralPower: summary.referralPower,
      },
    });
  } catch (error: any) {
    console.error('[/api/airdrop/referral] error:', error);
    return NextResponse.json({ ok: false, error: error.message || 'Failed to fetch referral link' }, { status: 500 });
  }
}

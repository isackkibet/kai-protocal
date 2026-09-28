import { NextResponse } from 'next/server';
import { resolveAirdropUser } from '@/lib/airdrop-auth';
import { getUserReferrals } from '@/lib/airdrop-engine';

export async function GET(req: Request) {
  try {
    const auth = await resolveAirdropUser(req);
    if (auth.error) return auth.error;
    const { userId } = auth;
    const referrals = await getUserReferrals(userId);
    return NextResponse.json({ ok: true, data: referrals });
  } catch (error: unknown) {
    console.error('[/api/airdrop/referrals] error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch referrals' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { resolveAirdropUser } from '@/lib/airdrop-auth';
import { getActivityLedger } from '@/lib/airdrop-engine';

export async function GET(req: Request) {
  try {
    const auth = await resolveAirdropUser(req);
    if (auth.error) return auth.error;
    const { userId } = auth;
    const ledger = await getActivityLedger(userId);
    return NextResponse.json({ ok: true, data: ledger });
  } catch (error: unknown) {
    console.error('[/api/airdrop/activity] error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch reward ledger' }, { status: 500 });
  }
}

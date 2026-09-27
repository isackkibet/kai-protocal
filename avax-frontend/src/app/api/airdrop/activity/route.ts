import { NextResponse } from 'next/server';
import { verifyPrivyUserId } from '@/lib/privy-server';
import { getActivityLedger } from '@/lib/airdrop-engine';

export async function GET(req: Request) {
  try {
    const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
    const userId = privyUserId || 'did:privy:demo_user_austin';
    const ledger = await getActivityLedger(userId);
    return NextResponse.json({ ok: true, data: ledger });
  } catch (error: any) {
    console.error('[/api/airdrop/activity] error:', error);
    return NextResponse.json({ ok: false, error: error.message || 'Failed to fetch reward ledger' }, { status: 500 });
  }
}

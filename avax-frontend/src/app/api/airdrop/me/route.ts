import { NextResponse } from 'next/server';
import { verifyPrivyUserId } from '@/lib/privy-server';
import { getAirdropSummary } from '@/lib/airdrop-engine';

export async function GET(req: Request) {
  try {
    const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
    const userId = privyUserId || 'did:privy:demo_user_austin';
    const summary = await getAirdropSummary(userId);
    return NextResponse.json({ ok: true, data: summary });
  } catch (error: any) {
    console.error('[/api/airdrop/me] error:', error);
    return NextResponse.json({ ok: false, error: error.message || 'Failed to fetch airdrop profile' }, { status: 500 });
  }
}

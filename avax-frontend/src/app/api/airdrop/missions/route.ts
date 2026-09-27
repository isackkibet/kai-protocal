import { NextResponse } from 'next/server';
import { verifyPrivyUserId } from '@/lib/privy-server';
import { getMissions } from '@/lib/airdrop-engine';

export async function GET(req: Request) {
  try {
    const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
    const userId = privyUserId || 'did:privy:demo_user_austin';
    const missions = await getMissions(userId);
    return NextResponse.json({ ok: true, data: missions });
  } catch (error: any) {
    console.error('[/api/airdrop/missions] error:', error);
    return NextResponse.json({ ok: false, error: error.message || 'Failed to fetch missions' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { verifyPrivyUserId } from '@/lib/privy-server';
import { linkUserWallet } from '@/lib/airdrop-engine';

export async function POST(req: Request) {
  try {
    const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
    const userId = privyUserId || 'did:privy:demo_user_austin';
    const body = await req.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json({ ok: false, error: 'Wallet address is required' }, { status: 400 });
    }

    const result = await linkUserWallet(userId, walletAddress);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error || 'Failed to link wallet' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, data: result });
  } catch (error: any) {
    console.error('[/api/airdrop/link-wallet] error:', error);
    return NextResponse.json({ ok: false, error: error.message || 'Server error linking wallet' }, { status: 500 });
  }
}

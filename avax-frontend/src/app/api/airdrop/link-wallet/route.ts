import { NextResponse } from 'next/server';
import { resolveAirdropUser } from '@/lib/auth/airdrop-auth';
import { linkUserWallet } from '@/lib/airdrop/engine';

export async function POST(req: Request) {
  try {
    const auth = await resolveAirdropUser(req);
    if (auth.error) return auth.error;
    const { userId } = auth;
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
  } catch (error: unknown) {
    console.error('[/api/airdrop/link-wallet] error:', error);
    return NextResponse.json({ ok: false, error: 'Server error linking wallet' }, { status: 500 });
  }
}

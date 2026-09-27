import { NextResponse } from 'next/server';
import { verifyPrivyUserId } from '@/lib/privy-server';
import { claimMissionReward } from '@/lib/airdrop-engine';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
    const userId = privyUserId || 'did:privy:demo_user_austin';
    const result = await claimMissionReward(userId, id);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error || 'Failed to claim mission reward' }, { status: 400 });
    }
    return NextResponse.json({ ok: true, data: result });
  } catch (error: any) {
    console.error('[/api/airdrop/missions/[id]/claim] error:', error);
    return NextResponse.json({ ok: false, error: error.message || 'Server error claiming mission' }, { status: 500 });
  }
}

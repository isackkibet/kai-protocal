import { NextResponse } from 'next/server';
import { resolveAirdropUser } from '@/lib/airdrop-auth';
import { claimMissionReward } from '@/lib/airdrop-engine';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await resolveAirdropUser(req);
    if (auth.error) return auth.error;
    const { userId } = auth;
    const result = await claimMissionReward(userId, id);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error || 'Failed to claim mission reward' }, { status: 400 });
    }
    return NextResponse.json({ ok: true, data: result });
  } catch (error: unknown) {
    console.error('[/api/airdrop/missions/[id]/claim] error:', error);
    return NextResponse.json({ ok: false, error: 'Server error claiming mission' }, { status: 500 });
  }
}

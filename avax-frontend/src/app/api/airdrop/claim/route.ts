import { NextResponse } from 'next/server';
import { resolveAirdropUser } from '@/lib/airdrop-auth';
import { claimDailyDropRitual } from '@/lib/airdrop-engine';

export async function POST(req: Request) {
  try {
    const auth = await resolveAirdropUser(req);
    if (auth.error) return auth.error;
    const { userId } = auth;
    const result = await claimDailyDropRitual(userId);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error || 'Failed to claim daily drop', cooldown: !!result.cooldown, remainingSeconds: result.remainingSeconds ?? 0 },
        { status: result.cooldown ? 409 : 400 },
      );
    }
    return NextResponse.json({ ok: true, data: result });
  } catch (error: unknown) {
    console.error('[/api/airdrop/claim] error:', error);
    return NextResponse.json({ ok: false, error: 'Server error claiming daily drop' }, { status: 500 });
  }
}

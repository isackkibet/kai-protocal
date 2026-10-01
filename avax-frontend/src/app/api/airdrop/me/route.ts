import { NextResponse } from 'next/server';
import { resolveAirdropUser } from '@/lib/auth/airdrop-auth';
import { getAirdropSummary, AirdropUserNotFoundError } from '@/lib/airdrop/engine';

export async function GET(req: Request) {
  try {
    const auth = await resolveAirdropUser(req);
    if (auth.error) return auth.error;
    const { userId } = auth;
    const summary = await getAirdropSummary(userId);
    return NextResponse.json({ ok: true, data: summary });
  } catch (error: unknown) {
    if (error instanceof AirdropUserNotFoundError) {
      return NextResponse.json({ ok: false, error: error.message, needsOnboarding: true }, { status: 404 });
    }
    console.error('[/api/airdrop/me] error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch airdrop profile' }, { status: 500 });
  }
}

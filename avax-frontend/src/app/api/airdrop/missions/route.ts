import { NextResponse } from 'next/server';
import { resolveAirdropUser } from '@/lib/auth/airdrop-auth';
import { getMissions } from '@/lib/airdrop/engine';

export async function GET(req: Request) {
  try {
    const auth = await resolveAirdropUser(req);
    if (auth.error) return auth.error;
    const { userId } = auth;
    const missions = await getMissions(userId);
    return NextResponse.json({ ok: true, data: missions });
  } catch (error: unknown) {
    console.error('[/api/airdrop/missions] error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch missions' }, { status: 500 });
  }
}

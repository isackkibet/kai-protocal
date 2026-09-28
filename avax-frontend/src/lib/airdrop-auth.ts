import { NextResponse } from 'next/server';
import { verifyPrivyUserId } from '@/lib/privy-server';

/** Demo identity for local exploration when no DATABASE_URL is configured. */
export const DEMO_AIRDROP_USER = 'did:privy:demo_user_austin';

/**
 * Resolve who is calling an /api/airdrop route.
 *
 * With a real database, the caller must hold a verified Privy session. The
 * demo identity is only used in mock mode (no DATABASE_URL); falling back to
 * it in production let anonymous visitors claim drops and write rows.
 */
export async function resolveAirdropUser(
  req: Request,
): Promise<{ userId: string; error?: undefined } | { userId?: undefined; error: NextResponse }> {
  const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
  if (privyUserId) return { userId: privyUserId };
  if (!process.env.DATABASE_URL) return { userId: DEMO_AIRDROP_USER };
  return {
    error: NextResponse.json({ ok: false, error: 'Please sign in to use the airdrop.' }, { status: 401 }),
  };
}

import { NextResponse, type NextRequest } from 'next/server';
import {
  SESSION_COOKIE,
  createSessionCookieValue,
  sessionCookieOptions,
  upsertSignedInUser,
} from '@/lib/guardian/session';
import { verifyPrivyIdentity } from '@/lib/guardian/privy';

/**
 * Exchanges a verified Privy identity token for a Guardian session cookie.
 * The browser posts the token from `useIdentityToken()` as a bearer token;
 * the identity (email, name) is read from the verified token, never from the
 * request body.
 */
export async function POST(request: NextRequest) {
  const identity = await verifyPrivyIdentity(request.headers.get('authorization'));
  if (!identity) {
    return NextResponse.json({ error: 'not_verified' }, { status: 401 });
  }
  try {
    const userId = await upsertSignedInUser(identity);
    const res = NextResponse.json({ success: true, userId });
    res.cookies.set(SESSION_COOKIE, createSessionCookieValue(userId), sessionCookieOptions());
    return res;
  } catch (error) {
    console.error('[guardian] privy sign-in failed:', error);
    return NextResponse.json({ error: 'sign_in_failed' }, { status: 500 });
  }
}

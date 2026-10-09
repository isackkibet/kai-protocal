import { NextResponse, type NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { OAUTH_COOKIE, authConfigured, randomToken, safeReturnTo, signPayload, siteOrigin } from '@/lib/guardian/session';

/** Starts Google sign-in (OpenID Connect, authorization code + PKCE). */
export async function GET(request: NextRequest) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !authConfigured().ok) {
    return NextResponse.redirect(new URL('/portal?auth_error=not_configured', request.url));
  }

  const state = randomToken();
  const nonce = randomToken();
  const verifier = randomToken(48);
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get('returnTo'));

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${siteOrigin(request)}/api/guardian/auth/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  });

  const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  res.cookies.set(OAUTH_COOKIE, signPayload({ state, nonce, verifier, returnTo, exp: Math.floor(Date.now() / 1000) + 600 }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/guardian/auth',
    maxAge: 600,
  });
  return res;
}

import { NextResponse, type NextRequest } from 'next/server';
import {
  OAUTH_COOKIE, SESSION_COOKIE, createSessionCookieValue, sessionCookieOptions,
  siteOrigin, upsertSignedInUser, verifyPayload,
} from '@/lib/guardian/session';

const GOOGLE_ISSUERS = new Set(['https://accounts.google.com', 'accounts.google.com']);

function fail(request: NextRequest, reason: string) {
  const res = NextResponse.redirect(new URL(`/portal?auth_error=${reason}`, request.url));
  res.cookies.set(OAUTH_COOKIE, '', { path: '/api/guardian/auth', maxAge: 0 });
  return res;
}

/** Google redirects here after sign-in. Exchanges the code and starts a session. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const pending = verifyPayload<{ state: string; nonce: string; verifier: string; returnTo: string; exp: number }>(
    request.cookies.get(OAUTH_COOKIE)?.value,
  );
  if (params.get('error')) return fail(request, 'cancelled');
  if (!pending || !params.get('code') || params.get('state') !== pending.state) return fail(request, 'invalid_state');

  let idToken: string | undefined;
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: params.get('code')!,
        client_id: process.env.GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        redirect_uri: `${siteOrigin(request)}/api/guardian/auth/callback`,
        grant_type: 'authorization_code',
        code_verifier: pending.verifier,
      }),
    });
    idToken = (await tokenRes.json())?.id_token;
  } catch (err) {
    console.error('[guardian] Google token exchange failed:', err);
  }
  if (!idToken) return fail(request, 'token_exchange');

  // The ID token came straight from Google's token endpoint over TLS, so its
  // claims can be trusted without a separate signature check (OIDC Core
  // 3.1.3.7). We still check issuer, audience, expiry and our nonce.
  let claims: Record<string, unknown>;
  try {
    claims = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64url').toString('utf8'));
  } catch {
    return fail(request, 'bad_token');
  }
  const now = Math.floor(Date.now() / 1000);
  if (
    !GOOGLE_ISSUERS.has(String(claims.iss)) ||
    claims.aud !== process.env.GOOGLE_CLIENT_ID ||
    typeof claims.exp !== 'number' || claims.exp < now ||
    claims.nonce !== pending.nonce ||
    typeof claims.sub !== 'string' ||
    typeof claims.email !== 'string' ||
    claims.email_verified !== true
  ) {
    return fail(request, 'bad_token');
  }

  const userId = await upsertSignedInUser({
    sub: claims.sub,
    email: claims.email,
    name: typeof claims.name === 'string' ? claims.name : claims.email,
  });

  const res = NextResponse.redirect(new URL(pending.returnTo, request.url));
  res.cookies.set(SESSION_COOKIE, createSessionCookieValue(userId), sessionCookieOptions());
  res.cookies.set(OAUTH_COOKIE, '', { path: '/api/guardian/auth', maxAge: 0 });
  return res;
}

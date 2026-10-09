import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, createSessionCookieValue, devLoginEnabled, sessionCookieOptions, upsertSignedInUser } from '@/lib/guardian/session';

/**
 * Local-testing sign-in without Google. Exists only when NODE_ENV is
 * development AND GUARDIAN_DEV_LOGIN=true; a production build always 404s.
 */
export async function POST(request: NextRequest) {
  if (!devLoginEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'email required' }, { status: 400 });
  const name = typeof body?.name === 'string' && body.name.trim() ? body.name.trim() : email;
  const userId = await upsertSignedInUser({ sub: `dev:${email}`, email, name });
  const res = NextResponse.json({ success: true, userId });
  res.cookies.set(SESSION_COOKIE, createSessionCookieValue(userId), sessionCookieOptions());
  return res;
}

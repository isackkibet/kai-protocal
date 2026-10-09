import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, createGuestUser, createSessionCookieValue, openRecordingEnabled, sessionCookieOptions } from '@/lib/guardian/session';

const NAME_RE = /^[\p{L}][\p{L}\p{M} .'-]{1,59}$/u;

/** Open recording: start a visitor session from just a name (no account). */
export async function POST(request: NextRequest) {
  if (!openRecordingEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  const name = typeof body?.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';
  if (!NAME_RE.test(name)) return NextResponse.json({ error: 'Please enter your name (letters only, 2 to 60 characters).' }, { status: 400 });
  try {
    const userId = await createGuestUser(name);
    const res = NextResponse.json({ success: true });
    res.cookies.set(SESSION_COOKIE, createSessionCookieValue(userId), sessionCookieOptions());
    return res;
  } catch (error) {
    console.error('[guardian] guest sign-in failed:', error);
    return NextResponse.json({ error: 'Guardian is temporarily unavailable.' }, { status: 503 });
  }
}

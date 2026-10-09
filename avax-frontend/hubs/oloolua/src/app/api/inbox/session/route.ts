import { NextResponse, type NextRequest } from 'next/server';
import {
  INBOX_COOKIE, inboxConfig, checkPassword, createSessionToken,
  verifySessionToken, sessionCookieOptions,
} from '@/lib/inboxAuth';

// Login attempts are rate limited tightly per IP in src/proxy.ts.

export async function GET(request: NextRequest) {
  const cfg = inboxConfig();
  return NextResponse.json({
    configured: cfg.ok,
    ...(cfg.ok ? {} : { reason: cfg.reason }),
    authenticated: verifySessionToken(request.cookies.get(INBOX_COOKIE)?.value),
  });
}

export async function POST(request: NextRequest) {
  const cfg = inboxConfig();
  if (!cfg.ok) {
    return NextResponse.json({ success: false, error: cfg.reason }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  if (!checkPassword(body?.password)) {
    console.warn('[inbox] failed login attempt');
    return NextResponse.json({ success: false, error: 'Incorrect password.' }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(INBOX_COOKIE, createSessionToken(), sessionCookieOptions());
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(INBOX_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
  return res;
}

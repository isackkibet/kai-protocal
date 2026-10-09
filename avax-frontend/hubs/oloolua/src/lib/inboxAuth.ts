/**
 * Password + signed-cookie auth for the team inbox. Server-only: import from
 * route handlers, never from client components.
 *
 * Setup: set INBOX_PASSWORD (12+ characters) in the Vercel project's
 * environment variables. Changing it signs every existing session out,
 * because the session signing key is derived from it.
 */

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const INBOX_COOKIE = 'oloolua_inbox';
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const MIN_PASSWORD_LENGTH = 12;

// A flat shape rather than a discriminated union: this project's tsconfig has
// strict off, which stops `!cfg.ok` from narrowing a union.
interface Config { ok: boolean; password: string; reason: string }

export function inboxConfig(): Config {
  const password = process.env.INBOX_PASSWORD ?? '';
  if (!password) {
    return { ok: false, password: '', reason: 'The team inbox is not set up yet: INBOX_PASSWORD is missing.' };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, password: '', reason: `INBOX_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  return { ok: true, password, reason: '' };
}

/** Constant-time comparison that does not leak length. */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

function signingKey(password: string): Buffer {
  return createHash('sha256').update(`oloolua-inbox-session|${password}`).digest();
}

function sign(password: string, exp: number): string {
  return createHmac('sha256', signingKey(password)).update(`inbox:${exp}`).digest('hex');
}

export function checkPassword(candidate: unknown): boolean {
  const cfg = inboxConfig();
  if (!cfg.ok || typeof candidate !== 'string') return false;
  return safeEqual(candidate, cfg.password);
}

export function createSessionToken(): string {
  const cfg = inboxConfig();
  if (!cfg.ok) throw new Error(cfg.reason);
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  return `${exp}.${sign(cfg.password, exp)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  const cfg = inboxConfig();
  if (!cfg.ok || !token) return false;
  const [expStr, sig] = token.split('.');
  const exp = Number(expStr);
  if (!Number.isInteger(exp) || !sig || exp < Math.floor(Date.now() / 1000)) return false;
  return safeEqual(sig, sign(cfg.password, exp));
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    // Only the inbox API ever needs it; pages and other APIs never see it.
    path: '/api/inbox',
    maxAge: SESSION_TTL_SECONDS,
  };
}

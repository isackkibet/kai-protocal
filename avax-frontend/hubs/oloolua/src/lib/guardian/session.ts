/**
 * Guardian sessions and identity (PRD B2). Server-only.
 *
 * Authentication is not authorization: a valid session only says who the
 * user is. Their Hub membership and role are read from the database on every
 * request, so a role change or suspension takes effect immediately.
 */

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { ensureGuardianSchema, HUB_ID } from './schema';
import type { Role } from './constants';

export const SESSION_COOKIE = 'guardian_session';
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface Viewer {
  user: { id: string; name: string; email: string | null; guest?: boolean };
  hubId: string;
  role: Role | null;
  membershipStatus: 'active' | 'pending' | 'suspended' | 'none';
}

function secret(): Buffer | null {
  const s = process.env.GUARDIAN_SESSION_SECRET ?? '';
  return s.length >= 32 ? createHash('sha256').update(`guardian-session|${s}`).digest() : null;
}

/** Sign-in uses the KAI Nuvari Privy app, so one account works on both sites. */
export function authConfigured(): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!secret()) missing.push('GUARDIAN_SESSION_SECRET (32+ characters)');
  // Sign-in is satisfied by either of two interchangeable providers: direct
  // Google OAuth, or KAI's shared Privy app (Google + email). Neither is
  // required when the other is present.
  const google = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
  const privy = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID && !!process.env.PRIVY_APP_SECRET;
  if (!google && !privy) {
    missing.push('GOOGLE_CLIENT_ID');
    missing.push('GOOGLE_CLIENT_SECRET');
  }
  return { ok: missing.length === 0 || devLoginEnabled(), missing };
}

/**
 * Open recording: a visitor types their name and can record activities
 * without an account, as the site worked before sign-in existed. Their
 * records are saved unverified, so verified totals are unaffected until a
 * Verifier or Admin reviews them.
 */
export function openRecordingEnabled(): boolean {
  return process.env.GUARDIAN_OPEN_RECORDING === 'true' && !!secret();
}

/** Local testing only: never available in a production build. */
export function devLoginEnabled(): boolean {
  return process.env.NODE_ENV === 'development' && process.env.GUARDIAN_DEV_LOGIN === 'true' && !!secret();
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Signs any small JSON payload: base64url(json).hmac */
export function signPayload(payload: object): string {
  const key = secret();
  if (!key) throw new Error('GUARDIAN_SESSION_SECRET is not configured');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${createHmac('sha256', key).update(body).digest('base64url')}`;
}

export function verifyPayload<T extends { exp: number }>(token: string | undefined): T | null {
  const key = secret();
  if (!key || !token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  if (!safeEqual(sig, createHmac('sha256', key).update(body).digest('base64url'))) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T;
    return typeof data.exp === 'number' && data.exp > Math.floor(Date.now() / 1000) ? data : null;
  } catch {
    return null;
  }
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function createSessionCookieValue(userId: string): string {
  return signPayload({ uid: userId, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS });
}

export function sessionCookieOptions(maxAge = SESSION_TTL_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export async function getViewer(request: NextRequest): Promise<Viewer | null> {
  const session = verifyPayload<{ uid: string; exp: number }>(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  await ensureGuardianSchema();
  const rows = (await sql`
    SELECT u.id, u.name, u.email, u.auth_sub, u.status AS user_status, m.role, m.status AS membership_status
    FROM guardian_users u
    LEFT JOIN guardian_memberships m ON m.user_id = u.id AND m.hub_id = ${HUB_ID}
    WHERE u.id = ${session.uid}
  `) as { id: string; name: string; email: string | null; auth_sub: string | null; user_status: string; role: Role | null; membership_status: string | null }[];
  const row = rows[0];
  if (!row || row.user_status === 'suspended') return null;
  const guest = row.auth_sub?.startsWith('guest:') ?? false;
  // Turning open recording off ends every visitor session at once.
  if (guest && !openRecordingEnabled()) return null;
  const membershipStatus = (row.membership_status ?? 'none') as Viewer['membershipStatus'];
  return {
    user: { id: row.id, name: row.name, email: row.email, guest },
    hubId: HUB_ID,
    role: membershipStatus === 'active' ? row.role : null,
    membershipStatus,
  };
}

function adminEmails(): Set<string> {
  return new Set(
    (process.env.GUARDIAN_ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Finds or creates the user for a verified identity, links a seeded team
 * member when an Admin has set their email, and applies the access policy:
 * listed admin emails become Admin; everyone else starts Pending until an
 * Admin approves them (or Viewer when GUARDIAN_AUTO_VIEWER=true).
 */
export async function upsertSignedInUser(identity: { sub: string; email: string; name: string }): Promise<string> {
  await ensureGuardianSchema();
  const email = identity.email.toLowerCase();
  const name = identity.name.slice(0, 120) || email;

  let rows = (await sql`
    UPDATE guardian_users SET email = ${email}, last_login_at = now()
    WHERE auth_sub = ${identity.sub} RETURNING id
  `) as { id: string }[];

  if (rows.length === 0) {
    // A team member seeded by name (B4) whose email an Admin has added.
    rows = (await sql`
      UPDATE guardian_users SET auth_sub = ${identity.sub}, status = 'active', last_login_at = now()
      WHERE auth_sub IS NULL AND lower(email) = ${email} RETURNING id
    `) as { id: string }[];
  }
  if (rows.length === 0) {
    rows = (await sql`
      INSERT INTO guardian_users (auth_sub, email, name, last_login_at)
      VALUES (${identity.sub}, ${email}, ${name}, now()) RETURNING id
    `) as { id: string }[];
  }
  const userId = rows[0].id;

  if (adminEmails().has(email)) {
    await sql`INSERT INTO guardian_memberships (user_id, hub_id, role, status) VALUES (${userId}, ${HUB_ID}, 'admin', 'active')
      ON CONFLICT (user_id, hub_id) DO UPDATE SET role = 'admin', status = 'active', updated_at = now()`;
  } else {
    const autoViewer = process.env.GUARDIAN_AUTO_VIEWER === 'true';
    await sql`INSERT INTO guardian_memberships (user_id, hub_id, role, status)
      VALUES (${userId}, ${HUB_ID}, 'viewer', ${autoViewer ? 'active' : 'pending'})
      ON CONFLICT (user_id, hub_id) DO NOTHING`;
  }
  return userId;
}

/** Creates a visitor (open recording) with Keeper access: they can read and record, never verify. */
export async function createGuestUser(name: string): Promise<string> {
  await ensureGuardianSchema();
  const [row] = (await sql`
    INSERT INTO guardian_users (auth_sub, email, name, last_login_at)
    VALUES (${`guest:${randomToken(16)}`}, NULL, ${name.slice(0, 60)}, now()) RETURNING id
  `) as { id: string }[];
  await sql`INSERT INTO guardian_memberships (user_id, hub_id, role, status) VALUES (${row.id}, ${HUB_ID}, 'keeper', 'active')`;
  return row.id;
}

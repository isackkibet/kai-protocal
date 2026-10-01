/**
 * src/lib/security/route-guard.ts
 *
 * Small helpers so individual route handlers can opt into the same protections
 * the proxy applies globally, without each one re-implementing them.
 *
 * ── Why routes need this even though proxy.ts already rate-limits ───────────
 * Because proxy.ts is explicitly not the security boundary. Next's own guidance
 * is that it must never be your only authorization layer, and it is configurable
 * away via `config.matcher`. A defence that lives in exactly one place is one
 * refactor away from being gone. Putting the check in the handler too means:
 *
 *   - the route fails closed even if the matcher is mis-scoped
 *   - the limit can be tightened for one expensive route without affecting all
 *   - tests can exercise the guard without booting Next
 *
 * The cost is a duplicate check on the request path, which is negligible next
 * to a database round-trip.
 */

import { NextResponse } from 'next/server';
import { assessRisk } from './client-ip.ts';
import { checkPolicy, rateLimitHeaders, type Policy, type CheckResult } from './rate-limit.ts';
import { verifyPrivyUserId } from '@/lib/auth/privy-server';
import { verifyWalletOwnership } from '@/lib/auth/wallet-signature';

export interface GuardFailure {
  ok: false;
  response: NextResponse;
}

export interface GuardSuccess {
  ok: true;
  /** Set when the caller had an authenticated Privy session. */
  userId?: string;
}

export type GuardResult = GuardFailure | GuardSuccess;

/**
 * Apply rate limits inside a route handler.
 *
 * `userId` should only be supplied from a VERIFIED session — never from a
 * request header — otherwise a caller can mint unlimited buckets by inventing
 * new ids.
 */
export async function requireRateLimit(
  req: Request,
  policies: Policy[],
  opts: { userId?: string } = {},
): Promise<GuardResult> {
  const risk = assessRisk(req);

  for (const policy of policies) {
    const result = checkPolicy(policy, req, { risk, userId: opts.userId });
    if (!result.allowed) {
      return { ok: false, response: tooManyRequests(result) };
    }
  }
  return { ok: true };
}

export function tooManyRequests(result: CheckResult): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please slow down.' },
    { status: 429, headers: rateLimitHeaders(result) },
  );
}

/**
 * Require either a valid Privy session OR a valid wallet-ownership signature.
 *
 * This is the pattern most write endpoints want: it covers both the
 * browser-login users and the wallet-only users the platform supports, without
 * either being able to spoof the other.
 */
export async function requireUser(
  req: Request,
): Promise<{ ok: true; userId?: string; wallet?: string } | { ok: false; response: NextResponse }> {
  const userId = await verifyPrivyUserId(req.headers.get('authorization'));
  if (userId) return { ok: true, userId };

  const wallet = (req.headers.get('x-wallet-address') ?? '').toLowerCase();
  if (wallet) {
    const owns = await verifyWalletOwnership(
      wallet,
      req.headers.get('x-wallet-signature') ?? '',
      Number(req.headers.get('x-wallet-timestamp') ?? '0'),
    );
    if (owns) return { ok: true, wallet };
  }

  return {
    ok: false,
    response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  };
}

/**
 * Standard rejection for a failed input validation pass.
 * Keeps handlers from each inventing their own error shape.
 */
export function invalidInput(message: string, field?: string): NextResponse {
  return NextResponse.json(
    { error: message, ...(field ? { field } : {}) },
    { status: 400 },
  );
}

/** Uniform handler wrapper: normalises thrown errors without leaking detail. */
export function handlerError(err: unknown, route: string): NextResponse {
  const message = err instanceof Error ? err.message : 'unknown';
  console.error(`[${route}]`, message);
  // Generic message to the client; specifics stay in the logs.
  return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
}

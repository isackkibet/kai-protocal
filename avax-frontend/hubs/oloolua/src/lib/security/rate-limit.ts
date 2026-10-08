/**
 * src/lib/security/rate-limit.ts
 *
 * Fixed-window rate limiting with two independent dimensions, evaluated per
 * request:
 *
 *   global — protects the whole deployment from volumetric floods
 *   ip     — one client cannot spend the entire budget
 *
 * This app has no login/session, so there is no "user" dimension to key on;
 * every caller is scoped by IP.
 *
 * ── Honest limitations (read before relying on this) ─────────────────────────
 * This store is in-process. On Vercel each serverless instance keeps its own
 * counters, so the EFFECTIVE limit is (configured limit × number of warm
 * instances), and all counters reset on cold start. That makes this a solid
 * backstop against scripted abuse and accidental runaway clients, but it is
 * NOT volumetric DDoS protection. Real edge protection belongs at the CDN
 * (Vercel Firewall / WAF rate-limit rules, or Cloudflare in front).
 *
 * For a shared, durable counter, swap `MemoryStore` for an Upstash Redis or
 * Vercel KV store — the `RateLimitStore` interface below is the seam for that.
 */

import { createHash } from 'node:crypto';
import { getClientIp, type RiskSignal } from './client-ip';

// ── Store ────────────────────────────────────────────────────────────────────

interface Bucket {
  count: number;
  /** Epoch ms at which this window resets. */
  resetAt: number;
}

export interface RateLimitStore {
  hit(key: string, windowMs: number, cost?: number): Bucket;
  reset(key: string): void;
  clear(): void;
  size(): number;
}

/**
 * Bounded in-memory store.
 *
 * Two protections against unbounded growth (an attacker sending requests
 * from many distinct IPs is itself a memory-exhaustion attack):
 *   - hard cap on distinct keys, evicting the soonest-to-expire entries
 *   - lazy sweep of expired buckets on write
 */
export class MemoryStore implements RateLimitStore {
  private readonly buckets = new Map<string, Bucket>();
  private readonly maxKeys: number;

  constructor(maxKeys = 20_000) {
    this.maxKeys = maxKeys;
  }

  hit(key: string, windowMs: number, cost = 1): Bucket {
    const now = Date.now();
    const existing = this.buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      this.sweep(now);
      this.evictIfFull();
      const fresh: Bucket = { count: cost, resetAt: now + windowMs };
      this.buckets.set(key, fresh);
      return fresh;
    }

    existing.count += cost;
    return existing;
  }

  reset(key: string): void {
    this.buckets.delete(key);
  }

  clear(): void {
    this.buckets.clear();
  }

  size(): number {
    return this.buckets.size;
  }

  private sweep(now: number): void {
    for (const [k, v] of this.buckets) {
      if (v.resetAt <= now) this.buckets.delete(k);
    }
  }

  /** Drops the entries closest to expiry until we are back under the cap. */
  private evictIfFull(): void {
    if (this.buckets.size < this.maxKeys) return;

    const byResetAt = [...this.buckets.entries()].sort(
      (a, b) => a[1].resetAt - b[1].resetAt,
    );
    const toDrop = Math.max(1, Math.floor(this.maxKeys * 0.1));
    for (let i = 0; i < toDrop && i < byResetAt.length; i++) {
      this.buckets.delete(byResetAt[i][0]);
    }
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __oloolua_rateLimitStore: RateLimitStore | undefined;
}

const store: RateLimitStore =
  globalThis.__oloolua_rateLimitStore ?? (globalThis.__oloolua_rateLimitStore = new MemoryStore());

// ── Keys ─────────────────────────────────────────────────────────────────────

/**
 * Keys are hashed so a raw IP address never sits in a long-lived map, and so
 * an attacker cannot inflate memory with oversized key strings.
 */
function hashKey(...parts: (string | number | undefined | null)[]): string {
  return createHash('sha256').update(parts.filter(Boolean).join('|')).digest('hex').slice(0, 32);
}

/** Stable identifier for the request's route, e.g. "POST:/api/activities". */
export function routeKey(req: Request): string {
  const path = new URL(req.url).pathname.replace(/\/+$/, '') || '/';
  return `${req.method.toUpperCase()}:${path}`;
}

// ── Policies ─────────────────────────────────────────────────────────────────

export interface Policy {
  scope: 'global' | 'ip';
  limit: number;
  windowMs: number;
}

export interface CheckResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  /** Which dimension rejected the request, for a useful 429 body. */
  scope?: Policy['scope'];
}

/**
 * Named budgets. This app has one small write surface (recording a
 * conservation activity) and a public read endpoint, so the tiers stay
 * simple: generous for reads, tighter for writes.
 */
export const POLICIES = {
  /** Default applied to any other /api request. */
  api: { scope: 'ip', limit: 120, windowMs: 60_000 },
  /** Ceiling across the whole deployment. */
  global: { scope: 'global', limit: 3_000, windowMs: 60_000 },
  /** Writes that create ledger records (activity submissions). */
  write: { scope: 'ip', limit: 20, windowMs: 60_000 },
} as const satisfies Record<string, Policy>;

/**
 * Multiplier applied when the request looks like an anonymous/abusive
 * client. High-risk callers get the SAME limit divided, not a hard block —
 * that is how we slow abuse without locking out real users behind carrier
 * NAT.
 */
function riskMultiplier(risk: RiskSignal): number {
  if (risk.tier === 'high') return 4;
  if (risk.tier === 'elevated') return 2;
  return 1;
}

// ── Enforcement ──────────────────────────────────────────────────────────────

export function checkPolicy(
  policy: Policy,
  req: Request,
  opts: { risk?: RiskSignal; cost?: number } = {},
): CheckResult {
  const { risk, cost = 1 } = opts;

  const key = buildKey(policy.scope, req);
  const limit = Math.max(1, Math.floor(policy.limit / (risk ? riskMultiplier(risk) : 1)));
  const bucket = store.hit(key, policy.windowMs, cost);

  return {
    allowed: bucket.count <= limit,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
    ...(bucket.count > limit ? { scope: policy.scope } : {}),
  };
}

function buildKey(scope: Policy['scope'], req: Request): string {
  if (scope === 'global') {
    // Deliberately NOT keyed by route or IP — the whole point of the global
    // ceiling is to be one shared budget a flood cannot sidestep by
    // spreading requests across endpoints or rotating source addresses.
    return hashKey('global');
  }
  const ip = getClientIp(req);
  return hashKey('ip', ip, routeKey(req));
}

/** Standard RateLimit-* headers, plus Retry-After when rejecting. */
export function rateLimitHeaders(result: CheckResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
  if (!result.allowed) {
    headers['Retry-After'] = String(
      Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000)),
    );
  }
  return headers;
}

/** Test seam — resets all counters. */
export function __resetRateLimits(): void {
  store.clear();
}

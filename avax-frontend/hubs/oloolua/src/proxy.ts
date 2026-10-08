/**
 * src/proxy.ts
 *
 * Global request gate for the Oloolua hub (Next.js 16 — this file convention
 * was `middleware.ts` before Next 16; `middleware.ts` is deprecated).
 *
 * Runs before any route handler and applies, in order:
 *   1. A nonce per request, threaded into the CSP.
 *   2. Security response headers + HSTS (production only).
 *   3. CORS — allow-listed origins only, never reflected blindly.
 *   4. Body-size and content-type guards on /api writes.
 *   5. Bot heuristic screening.
 *   6. Layered rate limiting: global → IP.
 *   7. Origin verification on state-changing /api requests.
 *
 * WHAT THIS IS NOT: proxy.ts is a cheap pre-filter, not the whole security
 * boundary. The route handler still validates and sanitises its own input
 * (see src/app/api/activities/route.ts) — defence in depth, so a mis-scoped
 * `config.matcher` here can never be the only thing standing between a
 * request and the database.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { randomBytes } from 'node:crypto';

import { assessRisk } from '@/lib/security/client-ip';
import { checkPolicy, POLICIES, rateLimitHeaders, routeKey } from '@/lib/security/rate-limit';
import { verifyCsrf } from '@/lib/security/csrf';
import { securityHeaders, hstsHeader, applyCors, buildCsp } from '@/lib/security/headers';

/**
 * CSP starts in REPORT-ONLY mode: the browser logs violations to the console
 * but blocks nothing. Enforcing a nonce policy breaks any statically
 * prerendered page (no nonce can be injected at build time), which is most
 * of this app. Set CSP_ENFORCE=true only after a report-only run in
 * production shows no console violations.
 */
const CSP_ENFORCE = process.env.CSP_ENFORCE === 'true';

function policyFor(method: string): Policy[] {
  return method === 'GET' || method === 'HEAD' ? [POLICIES.api] : [POLICIES.write];
}

type Policy = typeof POLICIES[keyof typeof POLICIES];

// ── Body guard ───────────────────────────────────────────────────────────────

/** Activity records are small JSON objects; this is generous. */
const MAX_BODY_BYTES = 64 * 1024;
const ALLOWED_CONTENT_TYPES = new Set(['application/json']);

function checkBody(req: NextRequest): string | null {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return null;

  const declared = Number(req.headers.get('content-length') ?? '0');
  if (declared > MAX_BODY_BYTES) return 'payload_too_large';

  const contentType = req.headers.get('content-type') ?? '';
  const base = contentType.split(';')[0]?.trim().toLowerCase() ?? '';
  if (base && !ALLOWED_CONTENT_TYPES.has(base)) return 'unsupported_media_type';
  return null;
}

// ── Entry point ──────────────────────────────────────────────────────────────

export function proxy(req: NextRequest) {
  const url = new URL(req.url);
  const { pathname } = url;
  const nonce = randomBytes(16).toString('base64');

  // A nonce must be visible to server components so Next can apply it to its
  // own <script> tags; without this the CSP would block its own bundle.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', buildCsp(nonce));

  // 1. Preflight — answer and stop before any other work.
  if (req.method === 'OPTIONS') {
    return finalize(NextResponse.next({ request: { headers: requestHeaders } }), req, nonce);
  }

  const isApi = pathname.startsWith('/api');

  // 2. Body guard.
  if (isApi) {
    const bodyProblem = checkBody(req);
    if (bodyProblem) {
      return finalize(
        NextResponse.json(
          { error: bodyProblem === 'payload_too_large' ? 'Payload too large.' : 'Unsupported media type.' },
          { status: bodyProblem === 'payload_too_large' ? 413 : 415 },
        ),
        req, nonce,
      );
    }
  }

  // 3. Bot screening and 4. rate limiting.
  if (isApi) {
    const risk = assessRisk(req);

    const globalResult = checkPolicy(POLICIES.global, req, { risk });
    if (!globalResult.allowed) {
      return finalize(tooManyRequests(req, globalResult), req, nonce);
    }

    for (const policy of policyFor(req.method)) {
      const result = checkPolicy(policy, req, { risk });
      if (!result.allowed) {
        return finalize(tooManyRequests(req, result), req, nonce);
      }
    }
  }

  // 5. Origin verification — only meaningful for state-changing requests.
  if (isApi) {
    const csrf = verifyCsrf(req);
    if (csrf.ok === false) {
      console.warn(`[security] rejected ${req.method} ${pathname}: ${csrf.reason}`);
      return finalize(
        NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 }),
        req, nonce,
      );
    }
  }

  return finalize(
    NextResponse.next({ request: { headers: requestHeaders } }),
    req, nonce,
  );
}

function tooManyRequests(req: NextRequest, result: ReturnType<typeof checkPolicy>): NextResponse {
  console.warn(
    `[security] 429 ${routeKey(req)} scope=${result.scope} ` +
    `remaining=${result.remaining}/${result.limit}`,
  );
  return NextResponse.json(
    { error: 'Too many requests. Please slow down and try again shortly.' },
    { status: 429, headers: rateLimitHeaders(result) },
  );
}

/** Attach CORS, security headers and HSTS to whatever response we return. */
function finalize(res: NextResponse, req: NextRequest, nonce: string): NextResponse {
  applyCors(res, req);
  const isApi = new URL(req.url).pathname.startsWith('/api');
  for (const [key, value] of Object.entries(securityHeaders(nonce))) {
    if (key === 'Content-Security-Policy' && !CSP_ENFORCE) {
      res.headers.set('Content-Security-Policy-Report-Only', value);
      continue;
    }
    res.headers.set(key, value);
  }
  if (isApi) {
    // Keep ledger reads/writes out of intermediary caches.
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }
  for (const [key, value] of Object.entries(hstsHeader())) {
    res.headers.set(key, value);
  }
  return res;
}

// ── Scope ────────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Skip Next internals and static assets — otherwise every image/CSS/JS
     * chunk request pays for rate-limit bookkeeping and header work.
     */
    '/((?!_next/static|_next/image|favicon.ico|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2)$).*)',
  ],
};

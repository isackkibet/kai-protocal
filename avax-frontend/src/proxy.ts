/**
 * src/proxy.ts
 *
 * Global request gate for the KAI app (Next.js 16 — this file convention was
 * `middleware.ts` before Next 16; `middleware.ts` is deprecated).
 *
 * Runs before any route handler and applies, in order:
 *   1. A nonce per request, threaded into the CSP.
 *   2. Security response headers + HSTS (production only).
 *   3. CORS — allow-listed origins only, never reflected blindly.
 *   4. Body-size and content-type guards.
 *   5. Bot / DDoS heuristic screening.
 *   6. Layered rate limiting: global → IP → route-specific.
 *   7. CSRF verification on state-changing requests.
 *
 * WHAT THIS IS NOT: proxy.ts is a cheap pre-filter, not the security boundary.
 * Next's own docs are explicit that it must not be your only authorization —
 * a request that reaches a route handler is not thereby trusted. Every
 * sensitive route still authenticates and authorizes in its own handler
 * (see lib/auth/privy-server.ts, lib/auth/admin-auth.ts). That is deliberate
 * defence-in-depth: if the proxy is ever mis-scoped by `config.matcher`, the
 * route handler is still the thing that refuses the request.
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
 * but blocks nothing. Enforcing a nonce policy breaks every statically
 * prerendered page (no nonce can be injected at build time — Next docs,
 * "Content Security Policy"), which is most of this app, and would silently
 * stop Privy login and hydration. Set CSP_ENFORCE=true only after the
 * report-only run shows no violations (docs/SECURITY.md §4.8).
 */
const CSP_ENFORCE = process.env.CSP_ENFORCE === 'true';

// ── Route classification ─────────────────────────────────────────────────────

/** Routes where every request is either expensive or fraud-attractive. */
function policyFor(pathname: string, method = 'GET'): readonly typeof POLICIES[keyof typeof POLICIES][] {
  // Order matters: most specific first, so a payment route gets the tight
  // payment budget rather than the generic API one.
  // Provider webhooks first: Safaricom and Paystack send every confirmation
  // from a handful of IPs, so the per-IP checkout budgets (5–10/min) would
  // start refusing real payment confirmations under normal sales volume.
  if (pathname.endsWith('/webhook') || pathname.endsWith('/callback')) return [POLICIES.webhook];
  if (pathname.startsWith('/api/paystack')) return [POLICIES.paystack];
  if (pathname.startsWith('/api/mpesa')) return [POLICIES.mpesa];

  // Opening the SDG page only reads points; logging an action stays on the AI budget.
  if (pathname.startsWith('/api/sdg') && (method === 'GET' || method === 'HEAD')) return [POLICIES.read];
  if (pathname.startsWith('/api/chat') ||
      pathname.startsWith('/api/conservation/ask') ||
      pathname.startsWith('/api/agent') ||
      pathname.startsWith('/api/sdg')) return [POLICIES.ai];

  // Reads of nursery / MRV data (dashboards, the nursery page, quick-action
  // counts) get the read budget; only saving data uses the tight write one.
  // They used to share the write budget, so a few page loads hit 429.
  if (pathname.startsWith('/api/mrv') || pathname.startsWith('/api/cfa') || pathname.startsWith('/api/murals') || pathname.startsWith('/api/hubs')) {
    return [method === 'GET' || method === 'HEAD' ? POLICIES.read : POLICIES.write];
  }

  if (pathname.startsWith('/api/whitelist') || pathname.startsWith('/api/cfa/join')) {
    return [POLICIES.public];
  }

  return [POLICIES.api];
}

// ── Body guard ───────────────────────────────────────────────────────────────

const MAX_BODY_BYTES = 512 * 1024; // AI prompts and JSON records; generous
/** Evidence photos/PDFs: 3 MB file + form fields (route re-checks the file). */
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024 + 64 * 1024;
const UPLOAD_PATHS = new Set(['/api/cfa/evidence', '/api/murals', '/api/hubs/oloolua/items', '/api/hubs/sihu/items']);
const ALLOWED_CONTENT_TYPES = new Set([
  'application/json',
  'application/x-www-form-urlencoded',
  'multipart/form-data',
  'text/plain',
]);

function checkBody(req: NextRequest, pathname: string): string | null {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return null;

  const declared = Number(req.headers.get('content-length') ?? '0');
  if (declared > (UPLOAD_PATHS.has(pathname) ? MAX_UPLOAD_BYTES : MAX_BODY_BYTES)) return 'payload_too_large';

  const contentType = req.headers.get('content-type') ?? '';
  // Strip parameters like "; charset=utf-8".
  const base = contentType.split(';')[0]?.trim().toLowerCase() ?? '';
  // Webhooks send application/json; some Safaricom deployments send text/csv.
  if (base && !ALLOWED_CONTENT_TYPES.has(base) && base !== 'text/csv') {
    return 'unsupported_media_type';
  }
  return null;
}

// ── Entry point ──────────────────────────────────────────────────────────────

export function proxy(req: NextRequest) {
  const url = new URL(req.url);
  const { pathname } = url;
  const nonce = randomBytes(16).toString('base64');

  // A nonce must be visible to server components so they can apply it to
  // their <script> tags; without this Next would strip it and CSP would
  // block its own bundle.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('x-csp-nonce', nonce);
  // Next applies the nonce to its own <script> tags by reading the CSP from
  // the REQUEST headers during server rendering; x-nonce alone isn't enough.
  requestHeaders.set('Content-Security-Policy', buildCsp(nonce));

  // 1. Preflight — answer and stop before any other work.
  if (req.method === 'OPTIONS') {
    return finalize(NextResponse.next({ request: { headers: requestHeaders } }), req, nonce);
  }

  const isApi = pathname.startsWith('/api');

  // 2. Body guard.
  const bodyProblem = checkBody(req, pathname);
  if (bodyProblem) {
    return finalize(
      NextResponse.json(
        { error: bodyProblem === 'payload_too_large' ? 'Payload too large.' : 'Unsupported media type.' },
        { status: bodyProblem === 'payload_too_large' ? 413 : 415 },
      ),
      req, nonce,
    );
  }

  // 3. Bot / anonymity screening and 4. rate limiting.
  if (isApi) {
    // Provider webhooks come from servers with scripted user agents; don't let
    // the bot heuristic divide their budget.
    const isWebhook = pathname.endsWith('/webhook') || pathname.endsWith('/callback');
    const risk = isWebhook ? { ...assessRisk(req), tier: 'low' as const } : assessRisk(req);

    // Global ceiling first: under a volumetric flood every individual bucket
    // still allows a trickle, so the deployment-wide cap is what stops it.
    const globalResult = checkPolicy(POLICIES.global, req, { risk });
    if (!globalResult.allowed) {
      return finalize(tooManyRequests(req, globalResult), req, nonce);
    }

    for (const policy of policyFor(pathname, req.method)) {
      const result = checkPolicy(policy, req, { risk });
      if (!result.allowed) {
        return finalize(tooManyRequests(req, result), req, nonce);
      }
    }
  }

  // 5. CSRF — only meaningful for cookie-authenticated state changes.
  if (isApi) {
    const csrf = verifyCsrf(req);
    if (!csrf.ok) {
      console.warn(`[security] CSRF rejected ${req.method} ${pathname}: ${csrf.reason}`);
      return finalize(
        NextResponse.json({ error: 'Invalid request token.' }, { status: 403 }),
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
    // no-store on pages would switch off Vercel's CDN cache for the whole
    // site; it belongs on API responses (payments, auth, personal data).
    if (key === 'Cache-Control' && !isApi) continue;
    res.headers.set(key, value);
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
     * Skip Next internals and static assets — otherwise every CSS/JS chunk
     * request pays for rate-limit bookkeeping and header work.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2)$).*)',
  ],
};

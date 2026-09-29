/**
 * src/lib/security/csrf.ts
 *
 * Double-submit cookie CSRF protection.
 *
 * How it works:
 *   1. Server issues a random token and sets it in a NON-HttpOnly cookie,
 *      because the browser has to read it to echo it back in a header.
 *   2. Client reads the cookie and sends the same value in `x-csrf-token`.
 *   3. Server compares header vs cookie with a constant-time compare.
 *
 * Why this is safe here: an attacker's page on evil.com CAN cause the browser
 * to send the cookie (cookies are sent cross-origin on a request), but the
 * Same Origin Policy stops their JavaScript from READING the cookie, so they
 * cannot populate the header. The custom header additionally forces a CORS
 * preflight, which we answer only for allow-listed origins.
 *
 * ── Cookie attribute notes ───────────────────────────────────────────────────
 *   SameSite=Lax   — blocks the classic cross-site POST. Note this ALONE is
 *                    not sufficient: older browsers and some redirect flows
 *                    still leak the cookie, which is why we also require the
 *                    header match.
 *   Secure         — HTTPS only. Required for production.
 *   HttpOnly=false — deliberate, and the reason this is safe: the value is a
 *                    nonce, not a credential. It grants nothing on its own.
 *
 * Server-to-server callers (Paystack/Safaricom webhooks, cron) have no cookie
 * and therefore no CSRF risk — they authenticate with a signature instead.
 * Those routes MUST be exempt, and are listed in isCsrfExempt().
 *
 * ── What verifyCsrf() actually enforces today ───────────────────────────────
 * This app authenticates with a Privy bearer token in the Authorization
 * header, not a cookie. A cross-site attacker can't attach that header, so
 * the classic cookie-riding CSRF doesn't apply — and no client code issues the
 * double-submit cookie, so REQUIRING it would 403 every POST (sign-up, claims,
 * planting, chat, checkout). verifyCsrf() therefore enforces the OWASP
 * "verify origin with standard headers" defence, which needs no client work:
 *   - reject when the browser says the request is cross-site (Sec-Fetch-Site)
 *   - reject when an Origin is present and not on the allow-list
 *   - if a client DOES send the double-submit pair, it must match
 * Requests with no Origin at all are not browser-initiated cross-site POSTs
 * (browsers always send Origin on those), so they pass through to the route's
 * own authentication.
 */

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const CSRF_COOKIE = 'kai_csrf_token';
export const CSRF_HEADER = 'x-csrf-token';

const TOKEN_BYTES = 32;

/** Origins allowed to attach a CSRF-exempt, credentialed request. */
function allowedOrigins(): Set<string> {
  const configured = (process.env.CSRF_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const out = new Set(configured);
  // Always trust our own deployment origins so a misconfigured env var cannot
  // lock the site out of its own forms.
  if (process.env.VERCEL_URL) out.add(`https://${process.env.VERCEL_URL}`);
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    out.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) out.add(process.env.NEXT_PUBLIC_SITE_URL);
  if (process.env.VERCEL_BRANCH_URL) out.add(`https://${process.env.VERCEL_BRANCH_URL}`);
  if (process.env.NODE_ENV !== 'production') {
    // 3001: the app's port while Hedera Guardian occupies 3000 locally.
    for (const port of [3000, 3001]) {
      out.add(`http://localhost:${port}`);
      out.add(`http://127.0.0.1:${port}`);
    }
  }
  return out;
}

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return allowedOrigins().has(origin.replace(/\/$/, ''));
}

export function generateCsrfToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

/** Constant-time string compare that tolerates length mismatch. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // Hash first so differing lengths don't throw and don't leak length.
  const hashA = createHash('sha256').update(bufA).digest();
  const hashB = createHash('sha256').update(bufB).digest();
  return timingSafeEqual(hashA, hashB);
}

export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return null;
}

/** Cookie attributes for the CSRF cookie. */
export function csrfCookieOptions() {
  return {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 8, // 8h — long enough for a work session, short enough to rotate
  };
}

/**
 * Routes that must NOT require a CSRF token.
 *
 * Either they are authenticated by an HMAC signature from a third party
 * (webhooks), or they are safe GETs, or they are polled by infrastructure
 * that has no cookie jar.
 */
const EXEMPT_PATHS: RegExp[] = [
  /^\/api\/paystack\/webhook\/?$/,   // HMAC-signed by Paystack
  /^\/api\/mpesa\/callback\/?$/,    // Safaricom IPN — authenticated separately
  /^\/api\/mpesa\/query\/?$/,       // polling read, no state change
  /^\/api\/health\/?$/,             // uptime probe
  /^\/api\/diag\//,                 // diagnostics
];

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Verify a state-changing request.
 * Returns null when the request is acceptable, or a machine-readable reason.
 */
/**
 * A request whose Origin is the host it was sent to is same-origin by
 * definition — never CSRF. Checked directly so a site reached through an alias
 * that isn't in the env-derived allow-list still accepts its own forms.
 */
function isSameOrigin(req: Request, origin: string): boolean {
  try {
    const o = new URL(origin);
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? new URL(req.url).host;
    return o.host === host;
  } catch {
    return false;
  }
}

export function verifyCsrf(
  req: Request,
): { ok: true } | { ok: false; reason: string } {
  if (SAFE_METHODS.has(req.method.toUpperCase())) return { ok: true };

  const path = new URL(req.url).pathname;
  if (EXEMPT_PATHS.some((re) => re.test(path))) return { ok: true };

  // Browsers label every request; a cross-site state change is refused.
  // ('same-site' / 'same-origin' / 'none' are fine.)
  if (req.headers.get('sec-fetch-site') === 'cross-site') {
    return { ok: false, reason: 'csrf_cross_site' };
  }

  const origin = req.headers.get('origin');
  if (origin && !isSameOrigin(req, origin) && !isAllowedOrigin(origin)) {
    return { ok: false, reason: 'csrf_origin_mismatch' };
  }

  // Optional double-submit: enforced only when the client opted in by
  // sending either half, so a half-sent or tampered pair is still refused.
  const cookieToken = readCookie(req, CSRF_COOKIE);
  const headerToken = req.headers.get(CSRF_HEADER);
  if (cookieToken || headerToken) {
    if (!cookieToken) return { ok: false, reason: 'csrf_cookie_missing' };
    if (!headerToken) return { ok: false, reason: 'csrf_header_missing' };
    if (!safeEqual(cookieToken, headerToken)) {
      return { ok: false, reason: 'csrf_token_mismatch' };
    }
  }

  return { ok: true };
}

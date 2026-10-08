/**
 * src/lib/security/csrf.ts
 *
 * Origin-verification CSRF defence for state-changing requests.
 *
 * This app authenticates nothing (no login, no session cookie) - anyone can
 * call POST /api/activities, by design, since it is a public activity log.
 * That means classic cookie-riding CSRF does not apply here either: there is
 * no session to ride. What we still want to stop is a third-party page
 * silently firing POSTs at this API from a visitor's browser (e.g. to spam
 * the ledger or burn the rate-limit budget). verifyCsrf() enforces the OWASP
 * "verify origin with standard headers" defence, which needs no client work:
 *   - reject when the browser says the request is cross-site (Sec-Fetch-Site)
 *   - reject when an Origin is present and not on the allow-list
 * Requests with no Origin at all are not browser-initiated cross-site POSTs
 * (browsers always send Origin on those), so they pass through.
 */

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Origins allowed to make a state-changing request against this app. */
function allowedOrigins(): Set<string> {
  const configured = (process.env.CSRF_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const out = new Set(configured);
  // Always trust our own deployment origins so a misconfigured env var
  // cannot lock the site out of its own forms.
  if (process.env.VERCEL_URL) out.add(`https://${process.env.VERCEL_URL}`);
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    out.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) out.add(process.env.NEXT_PUBLIC_SITE_URL);
  if (process.env.VERCEL_BRANCH_URL) out.add(`https://${process.env.VERCEL_BRANCH_URL}`);
  if (process.env.NODE_ENV !== 'production') {
    for (const port of [3000, 3001, 3911, 3912]) {
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

/**
 * A request whose Origin is the host it was sent to is same-origin by
 * definition - never CSRF. Checked directly so the site reached through an
 * alias that isn't in the env-derived allow-list still accepts its own forms.
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

  // Browsers label every request; a cross-site state change is refused.
  // ('same-site' / 'same-origin' / 'none' are fine.)
  if (req.headers.get('sec-fetch-site') === 'cross-site') {
    return { ok: false, reason: 'csrf_cross_site' };
  }

  const origin = req.headers.get('origin');
  if (origin && !isSameOrigin(req, origin) && !isAllowedOrigin(origin)) {
    return { ok: false, reason: 'csrf_origin_mismatch' };
  }

  return { ok: true };
}

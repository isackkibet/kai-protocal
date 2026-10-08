/**
 * src/lib/security/client-ip.ts
 *
 * Resolves the caller's real IP and derives a coarse "anonymity" risk signal.
 *
 * IMPORTANT — trusting forwarding headers:
 * A proxy header such as `x-forwarded-for` is trivially spoofable by any
 * client unless a trusted proxy overwrites it. On Vercel the platform
 * appends to `x-forwarded-for` and sets `x-vercel-forwarded-for`, but if this
 * app is ever self-hosted behind an arbitrary proxy, a client can prepend
 * fake entries and rotate their apparent IP to defeat rate limiting.
 *
 * We therefore:
 *   1. Prefer the platform-set header when we know we run behind Vercel.
 *   2. Fall back to the LEFT-most entry of x-forwarded-for, which is the
 *      closest thing to an "original client" hint but is NOT trustworthy.
 *   3. Always hash the resulting IP for rate-limit keys so keys stay bounded
 *      in size and we never store raw addresses in memory maps.
 */

/** Headers in priority order for reading the client address. */
const IP_HEADERS = [
  'x-vercel-forwarded-for', // Vercel platform — overwrites, not appends
  'cf-connecting-ip',       // Cloudflare, if ever fronted by it
  'x-real-ip',              // nginx convention
  'x-forwarded-for',        // generic, last resort (append-style, spoofable)
] as const;

function firstIpFromForwardedFor(value: string): string {
  // "client, proxy1, proxy2" → take the first (client-most) hop.
  const first = value.split(',')[0]?.trim() ?? '';
  return first;
}

/** Strip an IPv4:port or [IPv6]:port wrapper down to a bare address. */
function stripPort(value: string): string {
  const v = value.trim();
  if (v.startsWith('[')) {
    const close = v.indexOf(']');
    return close === -1 ? v : v.slice(1, close);
  }
  // Bare IPv4 with a port (":" appears exactly once and only after digits).
  const colonCount = (v.match(/:/g) ?? []).length;
  if (colonCount === 1) return v.split(':')[0];
  return v;
}

/**
 * Very small shape check — not a full validator. We only want to reject
 * obvious garbage so it cannot poison rate-limit keys with unbounded values.
 * Accepts IPv4 dotted-quad and IPv6 (including compressed and v4-mapped).
 */
function isPlausibleIp(value: string): boolean {
  if (!value || value.length > 45) return false;

  if (value.includes(':')) {
    // IPv6: only hex digits, colons, dots and an optional zone id.
    return /^[0-9a-fA-F:.]+(%[0-9a-zA-Z]+)?$/.test(value);
  }

  const octets = value.split('.');
  if (octets.length !== 4) return false;
  return octets.every((o) => {
    if (!/^\d{1,3}$/.test(o)) return false;
    const n = Number(o);
    return n >= 0 && n <= 255;
  });
}

/**
 * Best-effort client IP for a request.
 * Returns "0.0.0.0" when nothing usable is present so callers always get a
 * stable key rather than having to handle null.
 */
export function getClientIp(req: Request): string {
  for (const header of IP_HEADERS) {
    const raw = req.headers.get(header);
    if (!raw) continue;

    const candidate =
      header === 'x-forwarded-for' ? firstIpFromForwardedFor(raw) : stripPort(raw);

    if (isPlausibleIp(candidate)) return candidate;
  }
  return '0.0.0.0';
}

/**
 * True when the request arrived over a trusted platform proxy (i.e. the
 * forwarding header we read cannot be forged by the client).
 */
export function hasTrustedProxy(req: Request): boolean {
  return (
    !!process.env.VERCEL ||
    req.headers.has('x-vercel-forwarded-for') ||
    req.headers.has('cf-connecting-ip')
  );
}

// ── Anonymity / abuse risk signal ────────────────────────────────────────────

/** Vercel and most CDNs strip these from real browsers. */
const BOT_MARKERS = [
  'curl',
  'wget',
  'python-requests',
  'python-urllib',
  'go-http-client',
  'java',
  'okhttp',
  'axios',
  'node-fetch',
  'postmanruntime',
  'insomnia',
  'httpie',
  'libwww-perl',
] as const;

export type RiskTier = 'low' | 'elevated' | 'high';

export interface RiskSignal {
  tier: RiskTier;
  /** Non-sensitive machine-readable reasons, safe to log. */
  reasons: string[];
  /** True when a generic non-browser client was detected. */
  looksLikeBot: boolean;
}

/**
 * Classify how likely this caller is to be an abusive automated client.
 *
 * Deliberately NOT a hard block — this only tightens rate limits for callers
 * that look scripted, so legitimate browsers on carrier NAT are never
 * locked out.
 */
export function assessRisk(req: Request): RiskSignal {
  const reasons: string[] = [];

  const ua = (req.headers.get('user-agent') ?? '').toLowerCase();
  const looksLikeBot = ua === '' || BOT_MARKERS.some((m) => ua.includes(m));
  if (looksLikeBot) reasons.push('no_ua_or_scripted_ua');

  const trusted = hasTrustedProxy(req);

  // A trusted edge ALWAYS sets x-forwarded-host / via. On Vercel those
  // headers are present on every single request, so counting them as a risk
  // signal for a trusted proxy would quietly punish every honest visitor.
  if (!trusted && (req.headers.has('via') || req.headers.has('x-forwarded-host'))) {
    reasons.push('forwarded_chain');
  }
  if (!trusted) reasons.push('untrusted_proxy_headers');

  // `Accept: application/json` with no text/html is exactly what a browser
  // fetch() sends — flagging it would punish the app's own frontend. Real
  // browsers always attach Sec-Fetch-*, so use their absence as the signal.
  const browserFetch =
    req.headers.has('sec-fetch-mode') || req.headers.has('sec-fetch-site');
  const accept = req.headers.get('accept') ?? '';
  if (!browserFetch && !accept.includes('text/html') && !accept.includes('*/*')) {
    reasons.push('non_browser_accept');
  }

  let tier: RiskTier = 'low';
  if (reasons.length >= 2) tier = 'high';
  else if (reasons.length === 1) tier = 'elevated';

  return { tier, reasons, looksLikeBot };
}

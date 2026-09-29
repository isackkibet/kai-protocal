/**
 * src/lib/security/headers.ts
 *
 * Security response headers and CORS handling.
 *
 * ── CSP and why this app needs a permissive one ──────────────────────────────
 * A copy-paste "strict" Content-Security-Policy will BREAK this application:
 *   - Privy renders its login UI inside an iframe (auth gate for the whole app)
 *   - WalletConnect / MetaMask connect flows load remote iframes and run
 *     injected-provider scripts from nonces and blob: URLs
 *   - viem talks to RPC endpoints, Alchemy, WalletConnect Cloud and Paystack
 *
 * So the script/frame/connect lists are explicit rather than 'self'. If a
 * provider you depend on breaks, add it here deliberately rather than
 * loosening the whole policy.
 *
 * The directives that NEVER need relaxing — and which carry the most weight
 * against real attacks — are applied strictly:
 *   frame-ancestors 'none'  → clickjacking
 *   object-src    'none'   → plugin/plugin-based XSS
 *   base-uri      'none'   → base-tag hijack
 *   form-action   'self'   → form redirection attacks
 */

import type { NextResponse } from 'next/server';
import { isAllowedOrigin } from './csrf.ts';

// ── CSP ──────────────────────────────────────────────────────────────────────

const CSP_DIRECTIVES: Record<string, string[]> = {
  'default-src': ["'self'"],

  // Nonce-based where available; 'strict-dynamic' lets Next's bootstrap load
  // the chunks it needs without enumerating every hashed bundle file.
  'script-src': [
    "'self'",
    "'nonce-{NONCE}'",
    "'strict-dynamic'",
    'https://sdk.privy.io',
    'https://auth.privy.io',
    'https://*.privy.io',
    'https://connect.privy.io',
  ],

  // Inline styles are pervasive in Next.js + Tailwind runtime values.
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],

  'img-src': ["'self'", 'data:', 'blob:', 'https:', 'ipfs:', 'https://ipfs.io'],

  'connect-src': [
    "'self'",
    'https://*.privy.io',
    'https://api.privy.io',
    'https://*.walletconnect.com',
    'https://*.walletconnect.org',
    'https://cloud.walletconnect.com',
    'https://relay.walletconnect.com',
    'https://api.paystack.co',
    'https://api.mpesa.safaricom.com',
    'https://sandbox.safaricom.co.ke',
    'https://*.avalabs.org',      // Fuji RPC / chainkit
    'https://*.avax.network',
    'https://api.openai.com',
    'https://integrate.api.nvidia.com',
    'https://api.groq.com',
    'https://generativelanguage.googleapis.com',
    'https://api.neon.tech',
    'wss://*.avalabs.org',
  ],

  'frame-src': [
    "'self'",
    'https://*.privy.io',
    'https://auth.privy.io',
    'https://*.walletconnect.com',
    'https://verify.paystack.com',
  ],

  // Clickjacking + plugin XSS. These stay strict.
  'frame-ancestors': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'none'"],
  'form-action': ["'self'"],

  'manifest-src': ["'self'"],
  'worker-src': ["'self'", 'blob:'],
  'media-src': ["'self'", 'blob:'],
  'upgrade-insecure-requests': [],
};

/**
 * Build the CSP header value.
 *
 * When a nonce is supplied (we generate one per request in proxy.ts) the
 * policy is genuinely strict for scripts. When it is not — for example in a
 * static context — we fall back to allowing 'unsafe-inline' for scripts so we
 * never serve a policy that breaks the app's own bundle.
 */
export function buildCsp(nonce?: string): string {
  const parts: string[] = [];
  for (const [directive, values] of Object.entries(CSP_DIRECTIVES)) {
    if (values.length === 0) {
      parts.push(directive);
      continue;
    }
    const resolved = values.map((v) => (v === "'nonce-{NONCE}'" ? `'nonce-${nonce}'` : v));
    if (directive === 'script-src' && !nonce) {
      resolved.push("'unsafe-inline'");
    }
    parts.push(`${directive} ${resolved.join(' ')}`);
  }
  return parts.join('; ');
}

// ── Full header set ──────────────────────────────────────────────────────────

export function securityHeaders(nonce?: string): Record<string, string> {
  return {
    'Content-Security-Policy': buildCsp(nonce),

    // Never let a browser guess content type (stops MIME-confusion XSS).
    'X-Content-Type-Options': 'nosniff',

    // Clickjacking. CSP frame-ancestors covers modern browsers; this covers old.
    'X-Frame-Options': 'DENY',

    // Only send the Origin on cross-origin requests — stops Referer leaking
    // full URLs (which may contain record ids) to third parties.
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Disable powerful browser features this app never uses. `camera` is kept
    // because evidence capture may legitimately need it later.
    'Permissions-Policy': [
      'accelerometer=()',
      'autoplay=()',
      'camera=(self)',
      'display-capture=()',
      'encrypted-media=()',
      'geolocation=(self)',
      'gyroscope=()',
      'interest-cohort=()',
      'magnetometer=()',
      'microphone=(self)', // voice assistant (/voice, GlobalVoiceAssistant) needs the mic
      'payment=(self)',
      'usb=()',
    ].join(', '),

    // Cross-origin isolation hardening. COEP is deliberately NOT set: it would
    // block Privy's and WalletConnect's cross-origin iframes and break login.
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',

    // Keep payment/auth responses out of intermediary caches.
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'X-DNS-Prefetch-Control': 'off',
  };
}

/** HSTS is set only in production over HTTPS. */
export function hstsHeader(): Record<string, string> {
  if (process.env.NODE_ENV !== 'production') return {};
  return {
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  };
}

/**
 * Apply CORS headers to a response.
 *
 * Rules:
 *   - No Origin header (curl, server-to-server, native app) → no CORS headers
 *     are added. CORS protects browsers; such a caller is not browser-bound and
 *     must be protected by auth + rate limiting instead.
 *   - Origin in the allow-list → echo it back WITH credentials.
 *   - Anything else → no headers at all, so the browser blocks the read.
 *
 * We never reflect an arbitrary origin, even with `Access-Control-Allow-Origin: *`
 * plus credentials, which is both invalid and the classic CORS bypass.
 */
export function applyCors<T extends NextResponse>(
  res: T,
  req: Request,
): T {
  const origin = req.headers.get('origin');
  if (!origin || !isAllowedOrigin(origin)) return res;

  res.headers.set('Access-Control-Allow-Origin', origin);
  res.headers.set('Access-Control-Allow-Credentials', 'true');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',
    'X-Requested-With',
    'X-Paystack-Signature',
    'X-Admin-Key',
    'X-Wallet-Address',
  ].join(', '));
  res.headers.set('Access-Control-Expose-Headers', [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'Retry-After',
  ].join(', '));
  // Vary so a shared cache never serves one origin's response to another.
  res.headers.set('Vary', 'Origin');
  res.headers.set('Access-Control-Max-Age', '600');

  return res;
}

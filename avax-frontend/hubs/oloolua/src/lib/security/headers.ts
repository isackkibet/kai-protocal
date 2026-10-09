/**
 * src/lib/security/headers.ts
 *
 * Security response headers and CORS handling.
 *
 * This app is a static conservation marketing site plus one small Neon-backed
 * API route. It has no auth provider, no wallet connect flow and no payment
 * iframes, so - unlike a Web3/fintech app - the CSP here can stay close to
 * the strict default rather than carrying a long provider allow-list.
 *
 * The two concessions:
 *   img-src needs the external species-photo hosts used on /seedlings
 *     (Wikimedia Commons, Brave's image proxy) alongside local /assets.
 *   style-src needs 'unsafe-inline' because Tailwind + inline `style={}`
 *     props are used throughout (PageLayout and several content pages).
 */

import type { NextResponse } from 'next/server';
import { isAllowedOrigin } from './csrf';

// ── CSP ──────────────────────────────────────────────────────────────────────

const CSP_DIRECTIVES: Record<string, string[]> = {
  'default-src': ["'self'"],

  // Nonce-based where available; 'strict-dynamic' lets Next's own bootstrap
  // load the chunks it needs without enumerating every hashed bundle file.
  'script-src': ["'self'", "'nonce-{NONCE}'", "'strict-dynamic'"],

  // Inline styles are pervasive in this app's Tailwind + inline style props.
  'style-src': ["'self'", "'unsafe-inline'"],
  'font-src': ["'self'", 'data:'],

  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https://upload.wikimedia.org',
    'https://imgs.search.brave.com',
  ],

  // The dashboard polls its own API; nothing else is called client-side.
  'connect-src': ["'self'"],

  'frame-src': ["'none'"],

  // Clickjacking + plugin XSS. These stay strict.
  'frame-ancestors': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'none'"],
  'form-action': ["'self'"],

  'manifest-src': ["'self'"],
  'worker-src': ["'self'"],
  'media-src': ["'self'"],
  'upgrade-insecure-requests': [],
};

/**
 * Build the CSP header value.
 *
 * When a nonce is supplied (generated per request in proxy.ts) the policy is
 * genuinely strict for scripts. When it is not, we fall back to allowing
 * 'unsafe-inline' for scripts so we never serve a policy that breaks the
 * app's own bundle.
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

    // Only send the Origin on cross-origin requests.
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Only the microphone is used (AI Guardian voice input, this site only).
    'Permissions-Policy': [
      'accelerometer=()',
      'autoplay=()',
      'camera=()',
      'display-capture=()',
      'encrypted-media=()',
      'geolocation=()',
      'gyroscope=()',
      'interest-cohort=()',
      'magnetometer=()',
      'microphone=(self)',
      'payment=()',
      'usb=()',
    ].join(', '),

    'Cross-Origin-Opener-Policy': 'same-origin',

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
 *   - No Origin header (curl, server-to-server) → no CORS headers added.
 *   - Origin in the allow-list → echo it back.
 *   - Anything else → no headers at all, so the browser blocks the read.
 *
 * We never reflect an arbitrary origin - that is the classic CORS bypass.
 */
export function applyCors<T extends NextResponse>(res: T, req: Request): T {
  const origin = req.headers.get('origin');
  if (!origin || !isAllowedOrigin(origin)) return res;

  res.headers.set('Access-Control-Allow-Origin', origin);
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', ['Content-Type', 'X-Requested-With'].join(', '));
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

/**
 * node --test src/lib/security/*.test.ts
 *
 * Tests for the security primitives. These encode the actual attack shapes we
 * are defending against, so a regression that reopens a hole fails here rather
 * than in production.
 */

import { test, describe } from 'node:test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

import {
  looksLikeSqlInjection,
  sanitizeDeep,
  assertSafePayload,
  InputError,
  assertNoPrivilegeEscalation,
  escapeHtml,
  sanitizeForHtml,
  requireReference,
  requireInt,
} from './input.ts';

import { getClientIp, assessRisk } from './client-ip.ts';

import { MemoryStore, checkPolicy, __resetRateLimits } from './rate-limit.ts';

import {
  buildCsp,
  securityHeaders,
} from './headers.ts';

import {
  isAllowedOrigin,
  CSRF_COOKIE,
  CSRF_HEADER,
  generateCsrfToken,
  readCookie,
  verifyCsrf,
} from './csrf.ts';

// ── SQL injection ────────────────────────────────────────────────────────────

describe('SQL injection detection', () => {
  test('flags classic injection payloads', () => {
    const payloads = [
      "' OR '1'='1",
      '1; DROP TABLE users--',
      "admin'--",
      'UNION SELECT password FROM users',
      '1 OR 1=1',
      "'; SELECT SLEEP(5)--",
      'x UNION ALL SELECT NULL,NULL',
      "1' AND (SELECT COUNT(*) FROM information_schema.tables)>0--",
    ];
    for (const p of payloads) {
      assert.equal(looksLikeSqlInjection(p), true, `should flag: ${p}`);
    }
  });

  test('does not flag ordinary conservation data', () => {
    // Real record content must not trip the filter, or it breaks the product.
    const legit = [
      'Croton megalocarpus',
      'Nasari Tree Nursery',
      'Planted 500 seedlings on 2026-09-27',
      'Jaza Miti v1.0',
      'Zone ALPHA-01',
      'Croton; Acacia',
      "O'Brien",
    ];
    for (const v of legit) {
      assert.equal(looksLikeSqlInjection(v), false, `should NOT flag: ${v}`);
    }
  });

  test('rejects a nested injection payload via assertSafePayload', () => {
    assert.throws(
      () => assertSafePayload({ data: { species: "'; DROP TABLE records;--" } }),
      InputError,
    );
  });
});

// ── NoSQL operator injection ─────────────────────────────────────────────────

describe('NoSQL operator injection', () => {
  test('strips $ne / $gt auth bypass operators', () => {
    const dirty = {
      email: 'a@b.com',
      password: { $ne: null },
      role: { $gt: '' },
    };
    const clean = sanitizeDeep(dirty) as Record<string, unknown>;

    assert.deepEqual(clean.password, {});
    assert.deepEqual(clean.role, {});
    assert.equal(clean.email, 'a@b.com');
  });

  test('strips $where and $function code-execution operators', () => {
    const clean = sanitizeDeep({
      q: { $where: 'this.password == "x"' },
      r: { $function: { body: 'function(){}', args: [] } },
    }) as Record<string, unknown>;

    assert.deepEqual(clean.q, {});
    assert.deepEqual(clean.r, {});
  });

  test('throws when a forbidden operator appears in a request body', () => {
    assert.throws(
      () => assertSafePayload({ user: { password: { $ne: 1 } } }),
      InputError,
    );
  });

  test('preserves legitimate arrays of objects', () => {
    const clean = sanitizeDeep({
      species: [{ name: 'Croton', quantity: 500 }],
    }) as { species: { name: string; quantity: number }[] };

    assert.equal(clean.species[0].name, 'Croton');
    assert.equal(clean.species[0].quantity, 500);
  });
});

// ── Prototype pollution ──────────────────────────────────────────────────────

describe('prototype pollution', () => {
  test('removes __proto__ key without polluting Object.prototype', () => {
    const payload = JSON.parse('{"__proto__":{"polluted":"yes"},"safe":"ok"}');
    const clean = sanitizeDeep(payload) as Record<string, unknown>;

    assert.equal(clean.safe, 'ok');
    // `clean.__proto__` would just read the inherited prototype, so assert on
    // own-property presence instead — that is what actually matters.
    assert.equal(Object.prototype.hasOwnProperty.call(clean, '__proto__'), false);
    // The critical assertion: the global prototype must be untouched.
    assert.equal(({} as Record<string, unknown>).polluted, undefined);
  });

  test('removes constructor.prototype chain', () => {
    const clean = sanitizeDeep({ constructor: { prototype: { bad: 1 } }, ok: 2 }) as Record<string, unknown>;
    assert.equal(Object.prototype.hasOwnProperty.call(clean, 'constructor'), false);
    assert.equal(clean.ok, 2);
  });

  test('survives a circular reference without hanging', () => {
    const cyclic: Record<string, unknown> = { name: 'loop' };
    cyclic.self = cyclic;
    const clean = sanitizeDeep(cyclic) as Record<string, unknown>;
    assert.equal(clean.name, 'loop');
  });
});

// ── Privilege escalation ─────────────────────────────────────────────────────

describe('privilege escalation guard', () => {
  test('rejects client-supplied verification status', () => {
    // This is the PRD's hardest rule: verified/anchored are backend-only.
    assert.throws(() => assertNoPrivilegeEscalation({ verificationStatus: 'VERIFIED' }), InputError);
    assert.throws(() => assertNoPrivilegeEscalation({ verification_status: 'VERIFIED' }), InputError);
    assert.throws(() => assertNoPrivilegeEscalation({ blockchainStatus: 'ANCHORED' }), InputError);
    assert.throws(() => assertNoPrivilegeEscalation({ avalancheTxHash: '0xdead' }), InputError);
  });

  test('rejects client-supplied hash and role fields', () => {
    assert.throws(() => assertNoPrivilegeEscalation({ dataHash: 'abc' }), InputError);
    assert.throws(() => assertNoPrivilegeEscalation({ previous_hash: 'abc' }), InputError);
    assert.throws(() => assertNoPrivilegeEscalation({ role: 'ADMIN' }), InputError);
    assert.throws(() => assertNoPrivilegeEscalation({ pointsAwarded: true }), InputError);
  });

  test('allows legitimate record fields through', () => {
    assert.doesNotThrow(() =>
      assertNoPrivilegeEscalation({
        speciesId: 'abc',
        numberPlanted: 500,
        activity: 'planting',
        submittedName: 'Amina',
      }),
    );
  });
});

// ── XSS ──────────────────────────────────────────────────────────────────────

describe('XSS sinks', () => {
  test('escapes HTML metacharacters', () => {
    assert.equal(
      escapeHtml('<script>alert(1)</script>'),
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
  });

  test('strips script blocks including content', () => {
    const out = sanitizeForHtml('before<script>alert(1)</script>after');
    assert.ok(!out.includes('<script'));
    assert.ok(!out.includes('alert(1)'));
    assert.ok(out.includes('before'));
    assert.ok(out.includes('after'));
  });

  test('strips inline event handlers', () => {
    const out = sanitizeForHtml('<p onclick="steal()">hi</p>');
    assert.ok(!out.includes('onclick'));
    assert.ok(!out.toLowerCase().includes('steal()'));
  });

  test('removes javascript: and data: URLs', () => {
    assert.ok(!sanitizeForHtml('<a href="javascript:alert(1)">x</a>').includes('javascript:'));
    assert.ok(!sanitizeForHtml('<a href="data:text/html,<script>1</script>">x</a>').includes('data:text/html'));
  });

  test('keeps safe formatting and relative links', () => {
    const out = sanitizeForHtml('<p><strong>ok</strong> <a href="/verify/1">link</a></p>');
    assert.ok(out.includes('<strong>'));
    assert.ok(out.includes('href="/verify/1"'));
  });

  test('removes iframe used for clickjacking', () => {
    assert.ok(!sanitizeForHtml('<iframe src="https://evil.com"></iframe>').includes('iframe'));
  });
});

// ── Field validators ─────────────────────────────────────────────────────────

describe('field validators', () => {
  test('rejects a reference containing path traversal', () => {
    assert.throws(() => requireReference({ reference: '../../etc/passwd' }), InputError);
    assert.throws(() => requireReference({ reference: 'a'.repeat(100) }), InputError);
    assert.doesNotThrow(() => requireReference({ reference: 'kai_nft5_abc123def' }));
  });

  test('enforces integer bounds', () => {
    assert.throws(() => requireInt({ n: 0 }, 'n', { min: 1 }), InputError);
    assert.throws(() => requireInt({ n: 5.5 }, 'n'), InputError);
    assert.throws(() => requireInt({ n: 999 }, 'n', { max: 100 }), InputError);
    assert.equal(requireInt({ n: 500 }, 'n', { min: 1, max: 1000 }), 500);
  });
});

// ── Client IP ────────────────────────────────────────────────────────────────

describe('client IP resolution', () => {
  test('reads Vercel forwarded header', () => {
    const req = new Request('https://x/api', {
      headers: { 'x-vercel-forwarded-for': '203.0.113.9' },
    });
    assert.equal(getClientIp(req), '203.0.113.9');
  });

  test('takes the client-most hop of an x-forwarded-for chain', () => {
    const req = new Request('https://x/api', {
      headers: { 'x-forwarded-for': '198.51.100.7, 10.0.0.1, 10.0.0.2' },
    });
    assert.equal(getClientIp(req), '198.51.100.7');
  });

  test('strips a port', () => {
    const req = new Request('https://x/api', { headers: { 'x-real-ip': '203.0.113.5:443' } });
    assert.equal(getClientIp(req), '203.0.113.5');
  });

  test('rejects a malformed forwarded header rather than poisoning keys', () => {
    const req = new Request('https://x/api', {
      headers: { 'x-vercel-forwarded-for': 'not-an-ip-at-all-evil' },
    });
    assert.equal(getClientIp(req), '0.0.0.0');
  });

  test('falls back when no header present', () => {
    assert.equal(getClientIp(new Request('https://x/api')), '0.0.0.0');
  });
});

// ── Risk signals ─────────────────────────────────────────────────────────────

describe('abuse risk signals', () => {
  test('flags a scripted client with no user-agent', () => {
    const risk = assessRisk(new Request('https://x/api'));
    assert.equal(risk.looksLikeBot, true);
    assert.ok(risk.tier !== 'low');
  });

  test('treats a normal browser as low risk', () => {
    const req = new Request('https://x/api', {
      headers: {
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        accept: 'text/html,application/xhtml+xml',
        'x-vercel-forwarded-for': '203.0.113.1',
      },
    });
    const risk = assessRisk(req);
    assert.equal(risk.tier, 'low');
  });

  test('raises the tier for an anonymising proxy', () => {
    const req = new Request('https://x/api', {
      headers: {
        'user-agent': 'Mozilla/5.0 Chrome/120',
        accept: 'text/html',
        'x-vercel-forwarded-for': '203.0.113.1',
        'cf-ipcountry': 'XX',
      },
    });
    const risk = assessRisk(req);
    assert.ok(risk.tier !== 'low');
    assert.ok(risk.reasons.includes('anonymising_proxy'));
  });
});

// ── Rate limiting ────────────────────────────────────────────────────────────

describe('rate limiting', () => {
  const req = new Request('https://x/api/paystack/initiate', {
    method: 'POST',
    headers: { 'x-vercel-forwarded-for': '203.0.113.44' },
  });

  test('allows requests up to the limit then blocks', () => {
    __resetRateLimits();
    const policy = { scope: 'ip' as const, limit: 3, windowMs: 60_000 };

    assert.equal(checkPolicy(policy, req).allowed, true);
    assert.equal(checkPolicy(policy, req).allowed, true);
    assert.equal(checkPolicy(policy, req).allowed, true);

    const blocked = checkPolicy(policy, req);
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.scope, 'ip');
  });

  test('decrements remaining and reports a reset time', () => {
    __resetRateLimits();
    const policy = { scope: 'ip' as const, limit: 2, windowMs: 60_000 };
    const first = checkPolicy(policy, req);
    assert.equal(first.limit, 2);
    assert.equal(first.remaining, 1);
    assert.ok(first.resetAt > Date.now());
  });

  test('separates buckets per client IP', () => {
    __resetRateLimits();
    const policy = { scope: 'ip' as const, limit: 1, windowMs: 60_000 };

    assert.equal(checkPolicy(policy, req).allowed, true);
    assert.equal(checkPolicy(policy, req).allowed, false);

    const other = new Request('https://x/api/paystack/initiate', {
      method: 'POST',
      headers: { 'x-vercel-forwarded-for': '198.51.100.99' },
    });
    assert.equal(checkPolicy(policy, other).allowed, true);
  });

  test('separates buckets per endpoint', () => {
    __resetRateLimits();
    const policy = { scope: 'ip' as const, limit: 1, windowMs: 60_000 };

    assert.equal(checkPolicy(policy, req).allowed, true);
    assert.equal(checkPolicy(policy, req).allowed, false);

    const otherRoute = new Request('https://x/api/chat', {
      method: 'POST',
      headers: { 'x-vercel-forwarded-for': '203.0.113.44' },
    });
    assert.equal(checkPolicy(policy, otherRoute).allowed, true);
  });

  test('tightens the limit for a high-risk caller', () => {
    __resetRateLimits();
    const policy = { scope: 'ip' as const, limit: 10, windowMs: 60_000 };
    const lowRisk = { tier: 'low' as const, reasons: [], looksLikeBot: false };
    const highRisk = { tier: 'high' as const, reasons: ['a'], looksLikeBot: true };

    const normal = checkPolicy(policy, req, { risk: lowRisk });
    const risky = checkPolicy(policy, req, { risk: highRisk });
    assert.equal(normal.limit, 10);
    assert.ok(risky.limit < normal.limit);
  });

  test('global scope is shared across endpoints', () => {
    __resetRateLimits();
    const policy = { scope: 'global' as const, limit: 1, windowMs: 60_000 };
    const a = new Request('https://x/api/a', { headers: { 'x-vercel-forwarded-for': '1.1.1.1' } });
    const b = new Request('https://x/api/b', { headers: { 'x-vercel-forwarded-for': '2.2.2.2' } });

    assert.equal(checkPolicy(policy, a).allowed, true);
    // Different IP and different route, but the global ceiling still applies.
    assert.equal(checkPolicy(policy, b).allowed, false);
  });

  test('memory store is bounded so key flooding cannot exhaust memory', () => {
    const store = new MemoryStore(10);
    for (let i = 0; i < 500; i++) store.hit(`key-${i}`, 60_000);
    assert.ok(store.size() <= 10, `store grew to ${store.size()}`);
  });
});

// ── Headers / CSP ────────────────────────────────────────────────────────────

describe('security headers', () => {
  test('applies a nonce when provided', () => {
    const csp = buildCsp('TESTNONCE123');
    assert.ok(csp.includes("'nonce-TESTNONCE123'"));
    assert.ok(!csp.includes('{NONCE}'));
  });

  test('keeps the strict anti-framing directives regardless', () => {
    const csp = buildCsp('n');
    assert.ok(csp.includes("frame-ancestors 'none'"));
    assert.ok(csp.includes("object-src 'none'"));
    assert.ok(csp.includes("base-uri 'none'"));
    assert.ok(csp.includes("form-action 'self'"));
  });

  test('permits the origins Privy and the wallets need', () => {
    const csp = buildCsp('n');
    assert.ok(csp.includes('https://*.privy.io'));
    assert.ok(csp.includes('https://api.paystack.co'));
    assert.ok(csp.includes('https://*.walletconnect.com'));
  });

  test('header set includes the core hardening headers', () => {
    const h = securityHeaders('n');
    assert.equal(h['X-Content-Type-Options'], 'nosniff');
    assert.equal(h['X-Frame-Options'], 'DENY');
    assert.ok(h['Referrer-Policy'].length > 0);
    assert.ok(h['Permissions-Policy'].includes('geolocation='));
    assert.ok(h['Cache-Control'].includes('no-store'));
  });
});

// ── CSRF ─────────────────────────────────────────────────────────────────────

describe('CSRF protection', () => {
  function post(headers: Record<string, string>): Request {
    return new Request('https://x/api/cfa/planting', { method: 'POST', headers });
  }

  test('accepts a matching cookie + header pair', () => {
    const token = generateCsrfToken();
    const req = post({
      cookie: `${CSRF_COOKIE}=${token}`,
      [CSRF_HEADER]: token,
      origin: 'http://localhost:3000',
    });
    assert.deepEqual(verifyCsrf(req), { ok: true });
  });

  test('rejects when the header is missing (cross-site form post)', () => {
    const token = generateCsrfToken();
    const req = post({ cookie: `${CSRF_COOKIE}=${token}` });
    const result = verifyCsrf(req);
    assert.equal(result.ok, false);
    assert.equal(!result.ok && result.reason, 'csrf_header_missing');
  });

  test('rejects when cookie and header disagree', () => {
    const req = post({
      cookie: `${CSRF_COOKIE}=cookieValue`,
      [CSRF_HEADER]: 'attackerValue',
    });
    const result = verifyCsrf(req);
    assert.equal(result.ok, false);
    assert.equal(!result.ok && result.reason, 'csrf_token_mismatch');
  });

  test('rejects a mismatched Origin even when tokens match', () => {
    // Stops an attacker-controlled subdomain from setting the cookie itself.
    const token = generateCsrfToken();
    const req = post({
      cookie: `${CSRF_COOKIE}=${token}`,
      [CSRF_HEADER]: token,
      origin: 'https://evil.example.com',
    });
    const result = verifyCsrf(req);
    assert.equal(result.ok, false);
    assert.equal(!result.ok && result.reason, 'csrf_origin_mismatch');
  });

  test('does not require a token for safe methods', () => {
    const req = new Request('https://x/api/mrv/records');
    assert.deepEqual(verifyCsrf(req), { ok: true });
  });

  test('exempts signature-authenticated webhooks', () => {
    // Webhooks are server-to-server: no cookie jar, so no CSRF risk. They are
    // authenticated by HMAC/signature instead, which CSRF cannot help with.
    const req = new Request('https://x/api/paystack/webhook', {
      method: 'POST',
      headers: { 'x-paystack-signature': 'abc' },
    });
    assert.deepEqual(verifyCsrf(req), { ok: true });
  });

  // The app authenticates with a Privy bearer header and no client issues the
  // double-submit cookie — requiring it would 403 every real POST.
  test('accepts an ordinary same-origin POST that sends no CSRF token', () => {
    const req = new Request('https://avax-frontend-seven.vercel.app/api/airdrop/claim', {
      method: 'POST',
      headers: { origin: 'https://avax-frontend-seven.vercel.app', 'sec-fetch-site': 'same-origin', authorization: 'Bearer t' },
    });
    assert.deepEqual(verifyCsrf(req), { ok: true });
  });

  test('accepts a same-origin POST through an alias missing from the allow-list', () => {
    const req = new Request('https://some-alias.vercel.app/api/cfa/planting', {
      method: 'POST',
      headers: { origin: 'https://some-alias.vercel.app', host: 'some-alias.vercel.app' },
    });
    assert.deepEqual(verifyCsrf(req), { ok: true });
  });

  test('rejects a request the browser marks cross-site', () => {
    const req = post({ 'sec-fetch-site': 'cross-site' });
    const result = verifyCsrf(req);
    assert.equal(!result.ok && result.reason, 'csrf_cross_site');
  });

  test('rejects a foreign Origin even without any token', () => {
    const req = post({ origin: 'https://evil.example.com' });
    const result = verifyCsrf(req);
    assert.equal(!result.ok && result.reason, 'csrf_origin_mismatch');
  });

  test('passes a non-browser POST with no Origin (route auth decides)', () => {
    assert.deepEqual(verifyCsrf(post({})), { ok: true });
  });

  test('parses cookies containing several values', () => {
    const token = generateCsrfToken();
    const req = post({ cookie: `other=1; ${CSRF_COOKIE}=${token}; another=2` });
    assert.equal(readCookie(req, CSRF_COOKIE), token);
  });

  test('origin allow-list rejects unknown origins', () => {
    assert.equal(isAllowedOrigin('https://evil.com'), false);
    assert.equal(isAllowedOrigin(null), false);
    assert.equal(isAllowedOrigin('http://localhost:3000'), true);
  });
});

/**
 * Price-authority drift guard.
 *
 * The original payment bypass existed because the price lived in client
 * JavaScript. We now resolve every price from src/lib/catalog.ts, but the
 * storefront still keeps its own display copy in METADATA_MAP. If those two
 * ever disagree, the bug is back — a user sees one price and is charged
 * another, and the discrepancy is invisible until someone complains.
 *
 * So parse both files and fail loudly on any drift.
 */
describe('catalog price authority', () => {
  const read = (rel: string) =>
    readFileSync(new URL(`../../../${rel}`, import.meta.url), 'utf8');

  const parseClientPrices = (src: string): Record<string, number> => {
    const out: Record<string, number> = {};
    // nft12: { name: 'Wetland Watcher',  price: 78,  desc: '...' },
    for (const m of src.matchAll(/^\s*(nft\d+)\s*:\s*\{[^}]*?price:\s*(\d+(?:\.\d+)?)/gm)) {
      out[m[1]] = Number(m[2]);
    }
    return out;
  };

  const parseServerPrices = (src: string): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const m of src.matchAll(/^\s*(nft\d+)\s*:\s*\{[^}]*?priceUsd:\s*(\d+(?:\.\d+)?)/gm)) {
      out[m[1]] = Number(m[2]);
    }
    return out;
  };

  const client = parseClientPrices(read('src/app/connft/page.tsx'));
  const server = parseServerPrices(read('src/lib/catalog.ts'));

  test('parses a non-trivial number of items from both files', () => {
    assert.ok(Object.keys(client).length > 30, 'client catalogue looks empty');
    assert.ok(Object.keys(server).length > 30, 'server catalogue looks empty');
  });

  test('no item is priced differently on the server than on the storefront', () => {
    const drift: string[] = [];
    for (const [id, clientPrice] of Object.entries(client)) {
      const serverPrice = server[id];
      if (serverPrice === undefined) {
        drift.push(`${id}: priced ${clientPrice} on storefront but MISSING from src/lib/catalog.ts`);
      } else if (serverPrice !== clientPrice) {
        drift.push(`${id}: storefront ${clientPrice} vs server ${serverPrice}`);
      }
    }
    assert.deepEqual(drift, [], 'price drift — server catalogue is authoritative:\n' + drift.join('\n'));
  });

  test('every server entry is a positive, sane amount', () => {
    for (const [id, price] of Object.entries(server)) {
      assert.ok(price > 0, `${id} has non-positive price ${price}`);
      assert.ok(Number.isFinite(price), `${id} has non-finite price ${price}`);
    }
  });
});

/**
 * Risk-scoring regression guard.
 *
 * The scorer originally counted `x-forwarded-host` (set by Vercel on EVERY
 * request) and a missing `text/html` in Accept (sent by every browser fetch())
 * as risk signals. On the real platform that scored every honest user at
 * "high" and silently cut their AI quota to a quarter. These tests pin the
 * production behaviour so a future tweak can't quietly do that again.
 */
describe('abuse risk scoring', () => {
  const CHROME_UA =
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

  const withEnv = (trusted: boolean, fn: () => void) => {
    const prev = process.env.VERCEL;
    if (trusted) process.env.VERCEL = '1';
    else delete process.env.VERCEL;
    try {
      fn();
    } finally {
      if (prev === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = prev;
    }
  };

  const headers = (o: Record<string, string>) => new Headers(o);

  test('a real browser fetch behind Vercel scores low risk', () => {
    withEnv(true, () => {
      const risk = assessRisk(
        new Request('https://site.test/api/chat', {
          headers: headers({
            'user-agent': CHROME_UA,
            accept: 'application/json',
            'accept-language': 'en-US,en;q=0.9',
            origin: 'https://site.test',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            // Vercel sets these on every single request.
            'x-forwarded-host': 'site.test',
            'x-forwarded-proto': 'https',
            via: '1.1 varnish',
          }),
        }),
      );
      assert.equal(risk.tier, 'low', `reasons: ${risk.reasons.join(', ')}`);
    });
  });

  test('platform forwarding headers alone never escalate risk', () => {
    withEnv(true, () => {
      const risk = assessRisk(
        new Request('https://site.test/api/chat', {
          headers: headers({
            'user-agent': CHROME_UA,
            accept: 'text/html,application/xhtml+xml',
            'x-forwarded-host': 'site.test',
          }),
        }),
      );
      assert.equal(risk.tier, 'low', `reasons: ${risk.reasons.join(', ')}`);
    });
  });

  test('a scripted client with no browser fingerprints still scores high', () => {
    withEnv(true, () => {
      const risk = assessRisk(
        new Request('https://site.test/api/chat', {
          headers: headers({ accept: 'application/json' }),
        }),
      );
      assert.equal(risk.tier, 'high', `reasons: ${risk.reasons.join(', ')}`);
      assert.equal(risk.looksLikeBot, true);
    });
  });

  test('an explicit curl UA is still detected', () => {
    withEnv(true, () => {
      const risk = assessRisk(
        new Request('https://site.test/api/chat', { headers: headers({ 'user-agent': 'curl/8.5.0' }) }),
      );
      assert.equal(risk.looksLikeBot, true);
      assert.ok(risk.tier !== 'low');
    });
  });

  test('local dev without a trusted proxy is elevated, never high-on-infrastructure', () => {
    withEnv(false, () => {
      const risk = assessRisk(
        new Request('http://localhost:3111/api/chat', {
          headers: headers({
            'user-agent': CHROME_UA,
            accept: 'application/json',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
          }),
        }),
      );
      // One reason (untrusted proxy), so elevated — not high.
      assert.equal(risk.tier, 'elevated', `reasons: ${risk.reasons.join(', ')}`);
    });
  });
});

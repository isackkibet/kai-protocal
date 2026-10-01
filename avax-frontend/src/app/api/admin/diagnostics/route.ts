import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/db';
import { isAuthorizedAdmin } from '@/lib/auth/admin-auth';
import { isAllowedOrigin, CSRF_COOKIE, CSRF_HEADER } from '@/lib/security/csrf';
import { POLICIES } from '@/lib/security/rate-limit';
import { CATALOG, TRANSFER_LIMITS_USD } from '@/lib/payments/catalog';

/**
 * GET /api/admin/diagnostics
 *
 * Read-only environment check for the onboarding pipeline — reports whether
 * each required secret is configured (true/false only, never the value) and
 * whether the database is reachable. Built to answer "why isn't anyone
 * landing in the database" without digging through Vercel's dashboard or
 * pasting secrets into chat. Gated by the same admin key as /admin/members.
 */
export async function GET(req: Request) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const prisma = await getPrisma();
  let dbReachable = false;
  let dbError: string | null = null;
  if (prisma) {
    try {
      await prisma.kaiUser.count();
      dbReachable = true;
    } catch (e: unknown) {
      dbError = e instanceof Error ? e.message : 'unknown error';
    }
  } else {
    dbError = 'DATABASE_URL not set';
  }

  // Never report a secret — only whether one is present. An operator needs to
  // know "unset" or "set", never the value, and a diagnostic endpoint that
  // leaks values is a diagnostic endpoint that gets screenshotted into a Slack.
  const isSet = (k: string) => !!process.env[k];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const extraOrigins = (process.env.CSRF_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // Fail-closed check: in production an unaccepted configured origin means
  // every same-origin form submission is rejected by the proxy. That is the
  // single most likely way these controls take a site offline by accident, so
  // surface it loudly.
  //
  // In dev this is a non-finding: localhost origins are allowed by default, so
  // a missing NEXT_PUBLIC_SITE_URL is expected locally and must not read as an
  // incident. Only production can actually misfire.
  const isProd = process.env.NODE_ENV === 'production';
  const selfOriginOk = isAllowedOrigin(siteUrl ?? null);
  const csrfStatus = !isProd
    ? 'dev — localhost origins allowed, siteUrl not required'
    : selfOriginOk
      ? 'ok'
      : 'MISCONFIGURED — configured origin is rejected; state-changing requests will 403';

  const security = {
    csrf: {
      cookie: CSRF_COOKIE,
      header: CSRF_HEADER,
      siteUrlConfigured: !!siteUrl,
      configuredOriginAccepted: selfOriginOk,
      environment: isProd ? 'production' : 'development',
      extraOrigins: extraOrigins.length,
      status: csrfStatus,
    },
    cors: {
      // A wildcard alongside credentials is invalid and is the classic bypass.
      wildcardRejected: !extraOrigins.includes('*'),
      extraOrigins,
    },
    rateLimit: {
      store: 'in-process (per-instance; NOT shared across Vercel functions)',
      sharedStoreConfigured: isSet('UPSTASH_REDIS_REST_URL'),
      policies: Object.fromEntries(
        Object.entries(POLICIES).map(([k, p]) => [
          k,
          { limit: p.limit, windowMs: p.windowMs, scope: p.scope },
        ]),
      ),
      edgeProtection: 'Vercel Firewall rule required — Hobby allows only 1 rate limit rule',
    },
    payments: {
      // Prices must come from the server catalogue. This is the fix for the
      // original bypass, so report the size of the authoritative list.
      catalogItems: Object.keys(CATALOG).length,
      transferLimitsUsd: TRANSFER_LIMITS_USD,
      paystackSecretKey: isSet('PAYSTACK_SECRET_KEY'),
      mpesaConsumerKey: isSet('MPESA_CONSUMER_KEY'),
      mpesaConsumerSecret: isSet('MPESA_CONSUMER_SECRET'),
      mpesaPasskey: isSet('MPESA_PASSKEY'),
      mpesaShortcode: isSet('MPESA_SHORTCODE'),
      mpesaCallback: isSet('MPESA_CALLBACK_URL'),
      mpesaIpAllowList: isSet('MPESA_ALLOWED_IPS'),
      mpesaNote:
        'Daraja IPN is unsigned. Callbacks are re-confirmed via STK Query; the IP allow-list is optional defence in depth.',
    },
    headers: {
      csp: 'set in src/proxy.ts only (a second CSP in next.config.ts breaks login)',
      hsts: process.env.NODE_ENV === 'production' ? 'enabled' : 'disabled outside production',
      poweredBy: 'suppressed',
    },
    ai: {
      nvidiaKeyConfigured: isSet('NVIDIA_API_KEY'),
      warning: isSet('NVIDIA_API_KEY')
        ? 'A key pasted in chat/issues is compromised — rotate it'
        : undefined,
    },
  };

  return NextResponse.json({
    privy: {
      appIdConfigured: !!process.env.NEXT_PUBLIC_PRIVY_APP_ID,
      appSecretConfigured: !!process.env.PRIVY_APP_SECRET,
    },
    database: {
      urlConfigured: !!process.env.DATABASE_URL,
      reachable: dbReachable,
      error: dbError,
    },
    adminKeyConfigured: !!process.env.ADMIN_API_KEY,
    security,
    deployedAt: new Date().toISOString(),
  });
}

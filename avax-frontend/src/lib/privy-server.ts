import { PrivyClient } from '@privy-io/server-auth';

/**
 * Server-side Privy verification (PRD 1 §12 — the backend must never trust a
 * caller-supplied identity outright). `@privy-io/server-auth` was added for
 * exactly this purpose but was previously unused, which left endpoints like
 * /api/kai-bar/onboard trusting whatever `privyUserId` a client claimed to be.
 *
 * Usage: pass the bearer token from the client's `getAccessToken()` call and
 * get back the verified Privy user id, or null if the token is missing/invalid.
 */

let client: PrivyClient | null | undefined;

/**
 * Never throws — a malformed/misconfigured PRIVY_APP_SECRET must not crash
 * the whole serverless function. Every call site relies on that guarantee.
 */
function getClient(): PrivyClient | null {
  if (client !== undefined) return client;
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  try {
    client = appId && appSecret ? new PrivyClient(appId, appSecret) : null;
  } catch (e) {
    console.error('[privy-server] failed to construct PrivyClient', e);
    client = null;
  }
  return client;
}

/** Guaranteed to never throw — always resolves, worst case to `null`. */
export async function verifyPrivyUserId(authHeader: string | null): Promise<string | null> {
  try {
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    if (!token) return null;

    const privy = getClient();
    if (!privy) {
      // Privy server credentials aren't configured (local/dev) — caller decides
      // how to handle this; we can't verify, so we don't vouch for anyone.
      return null;
    }

    const claims = await privy.verifyAuthToken(token);
    return claims.userId;
  } catch (e) {
    console.error('[privy-server] verifyPrivyUserId failed', e);
    return null;
  }
}

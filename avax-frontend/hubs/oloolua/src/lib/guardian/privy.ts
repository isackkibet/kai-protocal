/**
 * Privy verification for the Guardian Hub (server-only).
 *
 * The Hub shares KAI's existing Privy app, so people sign in with the same
 * Google/email identity they already use across KAI. The browser sends the
 * Privy *identity token*; this module verifies it with the app secret and
 * resolves the verified identity. A caller-supplied email is never trusted on
 * its own — only the fields inside the verified token are used.
 */

import { PrivyClient } from '@privy-io/server-auth';

let client: PrivyClient | null | undefined;

function getClient(): PrivyClient | null {
  if (client !== undefined) return client;
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  client = appId && appSecret ? new PrivyClient(appId, appSecret) : null;
  return client;
}

/** True when both the public app id and the app secret are present. */
export function privyConfigured(): boolean {
  return !!getClient();
}

export interface PrivyIdentity {
  /** Stable subject stored in guardian_users.google_sub. */
  sub: string;
  email: string;
  name: string;
}

/**
 * Verifies a `Authorization: Bearer <identity token>` header and returns the
 * proven identity, or null when the token is missing, invalid or carries no
 * email (email/Google logins always do).
 */
export async function verifyPrivyIdentity(authHeader: string | null): Promise<PrivyIdentity | null> {
  const privy = getClient();
  if (!privy) return null;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!token) return null;

  try {
    const user = await privy.getUser({ idToken: token });
    const email = user.email?.address ?? user.google?.email ?? null;
    if (!email) return null;
    const name = user.google?.name ?? email;
    return { sub: `privy:${user.id}`, email, name: name.slice(0, 120) };
  } catch {
    return null;
  }
}

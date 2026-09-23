import { verifyPrivyUserId } from '@/lib/privy-server';
import type { Actor } from '@/lib/sihu-store';

/**
 * Resolves the caller's identity for SIHU endpoints.
 *
 * Signed-in users send a Privy bearer token and are keyed by their verified
 * Privy user id. Guests can still read, like, comment, save and report using a
 * client-generated guest key — the PRD's "wallet- and account-optional"
 * principle applied to the content layer. Privileged actions (creating,
 * submitting, editor decisions) require a verified session.
 */
export async function resolveActor(req: Request, name?: string, guestKey?: string): Promise<{ actor: Actor | null; authenticated: boolean }> {
  const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));

  if (privyUserId) {
    return {
      actor: { name: name?.trim() || 'Verified contributor', key: privyUserId },
      authenticated: true,
    };
  }

  const gkey = guestKey?.trim();
  if (gkey && gkey.length >= 8) {
    return {
      actor: { name: name?.trim() || 'Guest', key: `guest:${gkey}` },
      authenticated: false,
    };
  }

  return { actor: null, authenticated: false };
}
import { verifyPrivyUserId } from '@/lib/auth/privy-server';
import { getPrisma } from '@/lib/db/db';
import type { Actor } from '@/lib/hubs/sihu-store';

/** The member's account name and email, when they have a KaiUser row. */
async function memberProfile(privyUserId: string): Promise<{ name: string; email: string } | null> {
  const prisma = await getPrisma();
  if (!prisma) return null;
  try {
    return await prisma.kaiUser.findUnique({ where: { privyUserId }, select: { name: true, email: true } });
  } catch {
    return null;
  }
}

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
    // Use the member's real name for bylines instead of a generic label.
    const profile = name?.trim() ? null : await memberProfile(privyUserId);
    return {
      actor: { name: name?.trim() || profile?.name?.trim() || 'Verified contributor', key: privyUserId },
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
/**
 * Whether a signed-in member may use the SIHU editor desk.
 *
 * Editors are listed in SIHU_EDITOR_EMAILS (comma separated emails or Privy
 * user ids). Without a database (local demo mode) everyone signed in may
 * review, so the flow can be tried out. With a database and no list, nobody
 * can publish: before this check, any signed-in member could approve and
 * publish any story, including their own.
 */
export async function isHubEditor(privyUserId: string): Promise<boolean> {
  const allow = (process.env.SIHU_EDITOR_EMAILS ?? '')
    .split(',').map(v => v.trim().toLowerCase()).filter(Boolean);
  if (allow.includes(privyUserId.toLowerCase())) return true;
  if (!process.env.DATABASE_URL) return true;
  if (allow.length === 0) return false;
  const profile = await memberProfile(privyUserId);
  return !!profile?.email && allow.includes(profile.email.toLowerCase());
}

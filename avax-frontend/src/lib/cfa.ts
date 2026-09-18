import { getPrisma } from '@/lib/db';

/**
 * MVP nursery/conservation data (KAI Nuvari PRD §5, §6) is scoped to a single
 * CFA for now — there's no multi-CFA switcher in the UI yet. This finds (or
 * lazily creates) that one CommunityForest row so the nursery API routes
 * always have somewhere to attach species/planting/survival/inventory data.
 */
export async function getOrCreateDefaultForest() {
  const prisma = await getPrisma();
  if (!prisma) return null;

  try {
    const existing = await prisma.communityForest.findFirst({ orderBy: { createdAt: 'asc' } });
    if (existing) return existing;

    return prisma.communityForest.create({
      data: {
        name: 'KAI Nuvari Community Forest',
        did: 'did:kai:default-cfa',
        locationRegion: 'Unspecified',
        establishedAt: new Date(),
      },
    });
  } catch (e) {
    console.error('[cfa] database unavailable', e);
    return null;
  }
}

/**
 * Finds the ForestMember (CFA membership) linked to a Privy-authenticated
 * KaiUser, if any. Conservation records submitted by a linked member are
 * eligible for Kai Bar points (PRD §7); anonymous/unlinked submissions still
 * record data but never mint points.
 */
export async function getMemberForPrivyUser(privyUserId: string | null) {
  if (!privyUserId) return null;
  const prisma = await getPrisma();
  if (!prisma) return null;

  try {
    const user = await prisma.kaiUser.findUnique({ where: { privyUserId } });
    if (!user) return null;

    return prisma.forestMember.findUnique({ where: { kaiUserId: user.id } });
  } catch (e) {
    console.error('[cfa] database unavailable', e);
    return null;
  }
}

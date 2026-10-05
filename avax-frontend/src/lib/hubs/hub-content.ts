import { createHash } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { verifyPrivyUserId } from '@/lib/auth/privy-server';
import { canManageCatalogue, getNurseryCfa, getSessionMember } from '@/lib/nursery/db';
import { isHubEditor } from '@/lib/hubs/hub-actor';
import { sniffMime } from '@/lib/nursery/evidence-rules';

/**
 * Information Hub landing pages (/hubs/<hub>): what each organisation is,
 * what it stands for, what it does, and the news, activities, photos,
 * videos and podcasts its admins publish (tables hub_profiles, hub_items).
 *
 * Default About / Mission text only repeats what the app already says about
 * each organisation; hub admins replace it with their own words on the page.
 */

export const HUB_IDS = ['oloolua', 'sihu'] as const;
export type HubId = (typeof HUB_IDS)[number];
export const HUB_KINDS = ['news', 'activity', 'photo', 'video', 'podcast'] as const;
export type HubKind = (typeof HUB_KINDS)[number];
export const isHubId = (v: string): v is HubId => (HUB_IDS as readonly string[]).includes(v);
export const isHubKind = (v: string): v is HubKind => (HUB_KINDS as readonly string[]).includes(v);

export interface HubInfo {
  id: HubId;
  name: string;
  org: string;
  place: string;
  tagline: string;
  defaultAbout: string;
  defaultMission: string;
  /** What the organisation does, in a few words each. */
  work: { title: string; text: string; icon: 'sprout' | 'shield' | 'bee' | 'check' | 'news' | 'mic' | 'search' | 'book' }[];
  heroImage: string;
  accent: string;
  /** Where to go deeper inside the platform. */
  deeper: { label: string; href: string }[];
  /** Who may manage the hub, in plain words. */
  managers: string;
}

export const HUBS: Record<HubId, HubInfo> = {
  oloolua: {
    id: 'oloolua',
    name: 'Oloolua Conservation Hub',
    org: 'Oloolua Youth Guardians',
    place: 'Oloolua Community Forest Association, Kenya',
    tagline: 'Young people protecting and restoring the Oloolua forest.',
    defaultAbout:
      'The Oloolua Youth Guardians work with the Oloolua Community Forest Association on hands-on forest conservation: raising seedlings in nursery groups, planting trees, patrolling the forest and beekeeping.',
    defaultMission:
      'To restore the forest with verified work: every seedling and planting is recorded, checked by a CFA verifier and published with its proof.',
    work: [
      { title: 'Nursery groups', text: 'Raising indigenous seedlings and recording every batch.', icon: 'sprout' },
      { title: 'Tree planting', text: 'Planting seedlings and checking how many survive.', icon: 'check' },
      { title: 'Forest patrols', text: 'Protecting the forest from illegal logging and fire.', icon: 'shield' },
      { title: 'Beekeeping', text: 'Keeping bees as a forest-friendly income.', icon: 'bee' },
    ],
    heroImage: '/images/home-hero.jpg',
    accent: '#7DC383',
    deeper: [
      { label: 'Nursery groups and records', href: '/nursery' },
      { label: 'Guides: Jaza Miti and more', href: '/conservation' },
      { label: 'Murals from this work', href: '/murals' },
    ],
    managers: 'CFA admins',
  },
  sihu: {
    id: 'sihu',
    name: 'SIHU Information Hub',
    org: 'SIHU',
    place: 'Sango, Lake Victoria Basin',
    tagline: 'Community news and stories from the Lake Victoria Basin.',
    defaultAbout:
      'SIHU publishes community news, investigations, field reports and guides from the Lake Victoria Basin. Anyone can write; every story is checked by an AI pre-review and a human editor before it is published.',
    defaultMission:
      'To give communities a trusted place to share local news and knowledge, checked before it is published.',
    work: [
      { title: 'Local news', text: 'Stories and updates from the community.', icon: 'news' },
      { title: 'Investigations', text: 'Deeper reporting on issues that matter locally.', icon: 'search' },
      { title: 'Guides', text: 'How-to guides and field reports.', icon: 'book' },
      { title: 'Podcasts', text: 'Audio stories and conversations.', icon: 'mic' },
    ],
    heroImage: '/images/kai-background.jpg',
    accent: '#6FA8DC',
    deeper: [
      { label: 'All stories', href: '/hub' },
      { label: 'Write a story', href: '/hub/create' },
    ],
    managers: 'SIHU editors',
  },
};

export interface HubItemView {
  id: string; hub: HubId; kind: HubKind; title: string; summary: string | null; url: string | null;
  hasImage: boolean; happenedOn: string | null; authorName: string | null; createdAt: string;
}

export async function hubProfile(prisma: PrismaClient, hub: HubId) {
  const row = await prisma.hubProfile.findUnique({ where: { hub } });
  return { about: row?.about || HUBS[hub].defaultAbout, mission: row?.mission || HUBS[hub].defaultMission, updatedAt: row?.updatedAt?.toISOString() ?? null };
}

export async function hubItems(prisma: PrismaClient, hub: HubId, opts: { kind?: HubKind; take?: number } = {}): Promise<HubItemView[]> {
  const rows = await prisma.hubItem.findMany({
    where: { hub, published: true, ...(opts.kind ? { kind: opts.kind } : {}) },
    orderBy: [{ happenedOn: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
    take: opts.take ?? 60,
    select: { id: true, hub: true, kind: true, title: true, summary: true, url: true, imageSha256: true, happenedOn: true, authorName: true, createdAt: true },
  });
  return rows.map((r) => ({
    id: r.id, hub: r.hub as HubId, kind: r.kind as HubKind, title: r.title, summary: r.summary, url: r.url,
    hasImage: !!r.imageSha256, happenedOn: r.happenedOn ? r.happenedOn.toISOString().slice(0, 10) : null,
    authorName: r.authorName, createdAt: r.createdAt.toISOString(),
  }));
}

/**
 * Who may manage a hub: Oloolua -> CFA admins (verified CFA membership);
 * SIHU -> SIHU editors (SIHU_EDITOR_EMAILS). Returns the manager's name and
 * email for attribution, or null.
 */
export async function hubManager(prisma: PrismaClient, req: Request, hub: HubId): Promise<{ name: string; email: string | null } | null> {
  if (hub === 'oloolua') {
    const cfa = await getNurseryCfa(prisma);
    const session = await getSessionMember(prisma, req);
    if (!cfa || !session.ok || session.member.cfaId !== cfa.id || !canManageCatalogue(session.member)) return null;
    return { name: session.member.name, email: session.member.email ?? null };
  }
  const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
  if (!privyUserId || !(await isHubEditor(privyUserId))) return null;
  const user = await prisma.kaiUser.findUnique({ where: { privyUserId }, select: { name: true, email: true } });
  return { name: user?.name ?? 'SIHU editor', email: user?.email ?? null };
}

export const MAX_HUB_IMAGE_BYTES = 3 * 1024 * 1024;

/** Checks a picture and returns what to store, or a plain-words problem. */
export function checkHubImage(bytes: Uint8Array): { ok: true; bytes: Uint8Array<ArrayBuffer>; mime: string; sha256: string } | { ok: false; error: string } {
  if (bytes.length > MAX_HUB_IMAGE_BYTES) return { ok: false, error: 'The picture is larger than 3 MB.' };
  const mime = sniffMime(bytes);
  if (mime !== 'image/jpeg' && mime !== 'image/png' && mime !== 'image/webp') return { ok: false, error: 'Use a JPEG, PNG or WebP picture.' };
  return { ok: true, bytes: new Uint8Array(bytes), mime, sha256: createHash('sha256').update(bytes).digest('hex') };
}

/** A YouTube video id from a watch/share/shorts link, for its thumbnail. */
export function youtubeId(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

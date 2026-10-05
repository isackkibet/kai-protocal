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
export const HUB_KINDS = ['news', 'story', 'activity', 'photo', 'video', 'podcast'] as const;
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
  hasImage: boolean; hasBody: boolean; happenedOn: string | null; authorName: string | null; createdAt: string;
  updatedAt: string; published: boolean;
}

/** One item with its full text (news articles and stories). */
export interface HubItemFull extends HubItemView { body: string | null }

export async function hubProfile(prisma: PrismaClient, hub: HubId) {
  const row = await prisma.hubProfile.findUnique({ where: { hub } });
  return { about: row?.about || HUBS[hub].defaultAbout, mission: row?.mission || HUBS[hub].defaultMission, updatedAt: row?.updatedAt?.toISOString() ?? null };
}

const ITEM_SELECT = {
  id: true, hub: true, kind: true, title: true, summary: true, url: true, imageSha256: true, happenedOn: true,
  authorName: true, createdAt: true, updatedAt: true, published: true, body: true,
} as const;

type ItemRow = {
  id: string; hub: string; kind: string; title: string; summary: string | null; url: string | null; imageSha256: string | null;
  happenedOn: Date | null; authorName: string | null; createdAt: Date; updatedAt: Date; published: boolean; body: string | null;
};

const toView = (r: ItemRow): HubItemView => ({
  id: r.id, hub: r.hub as HubId, kind: r.kind as HubKind, title: r.title, summary: r.summary, url: r.url,
  hasImage: !!r.imageSha256, hasBody: !!r.body?.trim(), happenedOn: r.happenedOn ? r.happenedOn.toISOString().slice(0, 10) : null,
  authorName: r.authorName, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString(), published: r.published,
});

/** Published items, newest first. `all` also returns hidden ones (for hub managers). */
export async function hubItems(prisma: PrismaClient, hub: HubId, opts: { kind?: HubKind; take?: number; all?: boolean } = {}): Promise<HubItemView[]> {
  const rows = await prisma.hubItem.findMany({
    where: { hub, ...(opts.all ? {} : { published: true }), ...(opts.kind ? { kind: opts.kind } : {}) },
    orderBy: [{ happenedOn: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
    take: opts.take ?? 60,
    select: ITEM_SELECT,
  });
  return rows.map(toView);
}

/** One item with its full text. Hidden items only when `all` (hub managers). */
export async function hubItem(prisma: PrismaClient, hub: HubId, id: string, opts: { all?: boolean } = {}): Promise<HubItemFull | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const r = await prisma.hubItem.findFirst({ where: { id, hub, ...(opts.all ? {} : { published: true }) }, select: ITEM_SELECT });
  return r ? { ...toView(r), body: r.body } : null;
}

/** What a create or edit form may set, checked. Image handling stays in the route. */
export type HubItemInput = { kind: HubKind; title: string; summary: string | null; body: string | null; url: string | null; happenedOn: Date | null };

export function readHubItemForm(form: FormData): { ok: true; data: HubItemInput } | { ok: false; error: string; field: string } {
  const str = (k: string, max: number) => String(form.get(k) ?? '').trim().slice(0, max);
  const kind = str('kind', 20);
  const title = str('title', 160);
  const summary = str('summary', 2000) || null;
  const body = String(form.get('body') ?? '').replace(/\r\n/g, '\n').trim().slice(0, 60000) || null;
  const url = str('url', 500) || null;
  const day = str('happenedOn', 10);
  if (!isHubKind(kind)) return { ok: false, error: 'Choose what you are adding.', field: 'kind' };
  if (title.length < 3) return { ok: false, error: 'Add a title of at least 3 letters.', field: 'title' };
  if (url && !/^https:\/\/[^\s]+$/.test(url)) return { ok: false, error: 'Links must start with https://', field: 'url' };
  if ((kind === 'video' || kind === 'podcast') && !url) return { ok: false, error: 'Add the link to the video or podcast.', field: 'url' };
  if ((kind === 'news' || kind === 'story') && !body && !summary) return { ok: false, error: 'Write the story, or at least a short summary.', field: 'body' };
  const happenedOn = /^\d{4}-\d{2}-\d{2}$/.test(day) && !Number.isNaN(Date.parse(day)) ? new Date(`${day}T00:00:00Z`) : null;
  return { ok: true, data: { kind, title, summary, body, url, happenedOn } };
}

/** Public hub content may be read by the hub's own websites (no cookies). */
export const PUBLIC_READ_HEADERS = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=60, s-maxage=60' } as const;

/** Platform admins who may manage every hub (HUB_ADMIN_EMAILS, comma separated). */
const isHubAdminEmail = (email: string | null | undefined) =>
  !!email && (process.env.HUB_ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean).includes(email.trim().toLowerCase());

/**
 * Who may manage a hub: platform hub admins (HUB_ADMIN_EMAILS) manage every
 * hub; Oloolua -> CFA admins (verified CFA membership); SIHU -> SIHU editors
 * (SIHU_EDITOR_EMAILS). Returns the manager's name and email for
 * attribution, or null.
 */
export async function hubManager(prisma: PrismaClient, req: Request, hub: HubId): Promise<{ name: string; email: string | null } | null> {
  if (process.env.HUB_ADMIN_EMAILS) {
    const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
    if (privyUserId) {
      const user = await prisma.kaiUser.findUnique({ where: { privyUserId }, select: { name: true, email: true } });
      if (isHubAdminEmail(user?.email)) return { name: user?.name ?? 'Hub admin', email: user?.email ?? null };
    }
  }
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

import type { Prisma } from '@prisma/client';
import { getPrisma } from '@/lib/db';
import { SIHU_SEED_POSTS } from '@/lib/sihu-seed';
import { runAiPreReview } from '@/lib/sihu-ai-review';
import type {
  AiReviewReport,
  ContentPost,
  PostComment,
  PostDraftInput,
  ReviewDecision,
  SihuPostStatus,
} from '@/lib/sihu-types';

/**
 * Data layer for the SIHU information hub (PRD Part A).
 *
 * Follows the app-wide pattern: when a DATABASE_URL is configured and the
 * content tables exist, everything runs against Neon PostgreSQL; otherwise a
 * module-level in-memory store seeded with published content keeps every
 * feature working in dev/preview. Both paths return identical ContentPost
 * shapes. If Prisma is configured but a query throws (e.g. tables not yet
 * migrated), the memory store takes over so the product never hard-fails.
 */

export interface Actor {
  name: string;
  key: string; // privyUserId when signed in, else a stable guest key
}

// ── In-memory fallback ───────────────────────────────────────────
interface MemPost extends ContentPost {
  comments: PostComment[];
  likedByKeys?: Set<string>;
  savedByKeys?: Set<string>;
  reportsArr?: { reason: string; note: string | null; actor: string; at: string }[];
}

const mem = new Map<string, MemPost>();

function seedMemory() {
  if (mem.size > 0) return;
  for (const p of SIHU_SEED_POSTS) {
    mem.set(p.id, { ...p, comments: [], revisions: [], likesCount: p.likesCount });
  }
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  const used = new Set<string>([...mem.values()].map(p => p.slug));
  let slug = base || 'untitled';
  let n = 2;
  while (used.has(slug)) slug = `${base}-${n++}`;
  return slug;
}

function toPostShape(p: MemPost): ContentPost {
  const { comments: _c, ...rest } = p;
  void _c;
  return { ...rest, comments: p.comments };
}

// ── Prisma mapping ───────────────────────────────────────────────
function mapPrismaPost(row: {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  body: string;
  contentType: string;
  category: string;
  language: string;
  status: string;
  aiDisclosure: string | null;
  authorBadge: string | null;
  creatorName: string;
  creatorUserId: string | null;
  creatorEmail: string | null;
  tags: string[];
  mediaUrl: string | null;
  audioUrl: string | null;
  audioDurationSeconds: number | null;
  featured: boolean;
  viewsCount: number;
  likesCount: number;
  tipsEarnedKes: number;
  aiReport: unknown;
  editorNote: string | null;
  reviewedAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { comments: number };
}): ContentPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    body: row.body,
    contentType: row.contentType as ContentPost['contentType'],
    category: row.category,
    language: row.language,
    status: row.status as SihuPostStatus,
    aiDisclosure: (row.aiDisclosure as ContentPost['aiDisclosure']) ?? 'HUMAN',
    authorBadge: row.authorBadge,
    creatorName: row.creatorName,
    creatorUserId: row.creatorUserId,
    creatorEmail: row.creatorEmail,
    tags: row.tags,
    mediaUrl: row.mediaUrl,
    audioUrl: row.audioUrl,
    audioDurationSeconds: row.audioDurationSeconds,
    featured: row.featured,
    viewsCount: row.viewsCount,
    likesCount: row.likesCount,
    tipsEarnedKes: row.tipsEarnedKes,
    aiReport: (row.aiReport as AiReviewReport) ?? null,
    editorNote: row.editorNote,
    reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ── Reads ────────────────────────────────────────────────────────
export async function listPublishedPosts(opts?: { q?: string; category?: string }): Promise<ContentPost[]> {
  const prisma = await getPrisma();
  if (prisma) {
    try {
      const where: Record<string, unknown> = {
        status: 'PUBLISHED' as const,
        ...(opts?.category && opts.category !== 'ALL' ? { category: opts.category } : {}),
      };
      const rows = await prisma.contentPost.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
      });
      return rows.map(mapPrismaPost);
    } catch {
      /* fall through to memory */
    }
  }
  seedMemory();
  let posts = [...mem.values()].filter(p => p.status === 'PUBLISHED');
  if (opts?.category && opts.category !== 'ALL') posts = posts.filter(p => p.category === opts.category);
  const q = (opts?.q ?? '').toLowerCase().trim();
  if (q) {
    posts = posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.summary?.toLowerCase().includes(q) ||
      p.body.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q)),
    );
  }
  return [...posts].sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '')).map(toPostShape);
}

export async function getBySlug(slug: string, withComments = false): Promise<ContentPost | null> {
  const prisma = await getPrisma();
  if (prisma) {
    try {
      const row = await prisma.contentPost.findUnique({ where: { slug } });
      if (!row) return null;
      const post = mapPrismaPost(row);
      if (withComments && post.status === 'PUBLISHED') {
        const comments = await prisma.postComment.findMany({
          where: { postId: row.id, status: { in: ['VISIBLE', 'REPORTED'] } },
          orderBy: { createdAt: 'asc' },
        });
        post.comments = comments.map(c => ({
          id: c.id,
          authorName: c.authorName,
          authorUserId: c.authorUserId,
          body: c.body,
          status: c.status as PostComment['status'],
          createdAt: c.createdAt.toISOString(),
        }));
      }
      return post;
    } catch {
      /* fall through */
    }
  }
  seedMemory();
  const p = [...mem.values()].find(p => p.slug === slug);
  if (!p) return null;
  const post = toPostShape(p);
  if (withComments) post.comments = p.comments;
  return post;
}

export async function getById(id: string): Promise<ContentPost | null> {
  const prisma = await getPrisma();
  if (prisma) {
    try {
      const row = await prisma.contentPost.findUnique({ where: { id } });
      return row ? mapPrismaPost(row) : null;
    } catch {
      /* fall through */
    }
  }
  seedMemory();
  const p = mem.get(id);
  return p ? toPostShape(p) : null;
}

export async function listReviewQueue(): Promise<ContentPost[]> {
  const prisma = await getPrisma();
  if (prisma) {
    try {
      const rows = await prisma.contentPost.findMany({
        where: { status: { in: ['SUBMITTED', 'APPROVED', 'CHANGES_REQUESTED'] } },
        orderBy: { updatedAt: 'desc' },
      });
      return rows.map(mapPrismaPost);
    } catch {
      /* fall through */
    }
  }
  seedMemory();
  return [...mem.values()]
    .filter(p => ['SUBMITTED', 'APPROVED', 'CHANGES_REQUESTED'].includes(p.status))
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
    .map(toPostShape);
}

export async function listContributorPosts(actorKey: string): Promise<ContentPost[]> {
  const prisma = await getPrisma();
  if (prisma) {
    try {
      const rows = await prisma.contentPost.findMany({
        where: { creatorUserId: actorKey },
        orderBy: { updatedAt: 'desc' },
      });
      return rows.map(mapPrismaPost);
    } catch {
      /* fall through */
    }
  }
  seedMemory();
  return [...mem.values()]
    .filter(p => p.creatorUserId === actorKey)
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
    .map(toPostShape);
}

// ── Writes ───────────────────────────────────────────────────────
export async function createDraft(input: PostDraftInput, actor: Actor): Promise<ContentPost> {
  const prisma = await getPrisma();
  if (prisma) {
    try {
      const slug = await uniqueSlugFromDb(input.title);
      const row = await prisma.contentPost.create({
        data: {
          slug,
          title: input.title,
          summary: input.summary ?? null,
          body: input.body,
          contentType: input.contentType,
          category: input.category,
          language: input.language ?? 'EN',
          status: 'DRAFT',
          aiDisclosure: 'HUMAN',
          creatorName: actor.name,
          creatorUserId: actor.key,
          creatorEmail: null,
          tags: input.tags ?? [],
          mediaUrl: input.mediaUrl ?? null,
          audioUrl: input.audioUrl ?? null,
        },
      });
      await prisma.postRevision.create({
        data: { postId: row.id, action: 'CREATED', actorName: actor.name },
      });
      return mapPrismaPost(row);
    } catch {
      /* fall through */
    }
  }
  seedMemory();
  const now = new Date().toISOString();
  const post: MemPost = {
    id: `mem-${Date.now()}`,
    slug: slugify(input.title),
    title: input.title,
    summary: input.summary ?? null,
    body: input.body,
    contentType: input.contentType,
    category: input.category,
    language: input.language ?? 'EN',
    status: 'DRAFT',
    aiDisclosure: 'HUMAN',
    authorBadge: null,
    creatorName: actor.name,
    creatorUserId: actor.key,
    creatorEmail: null,
    tags: input.tags ?? [],
    mediaUrl: input.mediaUrl ?? null,
    audioUrl: input.audioUrl ?? null,
    audioDurationSeconds: null,
    featured: false,
    viewsCount: 0,
    likesCount: 0,
    tipsEarnedKes: 0,
    aiReport: null,
    editorNote: null,
    reviewedAt: null,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
    comments: [],
    revisions: [{ action: 'CREATED', actorName: actor.name, createdAt: now }],
  };
  mem.set(post.id, post);
  return toPostShape(post);
}

export async function saveDraft(id: string, input: PostDraftInput, actor: Actor): Promise<ContentPost | null> {
  const prisma = await getPrisma();
  if (prisma) {
    try {
      const existing = await prisma.contentPost.findUnique({ where: { id } });
      if (!existing) return null;
      if (!['DRAFT', 'CHANGES_REQUESTED', 'REJECTED'].includes(existing.status)) return null;
      const row = await prisma.contentPost.update({
        where: { id },
        data: {
          title: input.title,
          summary: input.summary ?? null,
          body: input.body,
          contentType: input.contentType,
          category: input.category,
          language: input.language ?? existing.language,
          tags: input.tags ?? existing.tags,
          mediaUrl: input.mediaUrl ?? existing.mediaUrl,
          audioUrl: input.audioUrl ?? existing.audioUrl,
        },
      });
      await prisma.postRevision.create({
        data: { postId: id, action: 'EDITED', actorName: actor.name, snapshot: { title: input.title, body: input.body } },
      });
      return mapPrismaPost(row);
    } catch {
      /* fall through */
    }
  }
  seedMemory();
  const p = mem.get(id);
  if (!p || !['DRAFT', 'CHANGES_REQUESTED', 'REJECTED'].includes(p.status)) return null;
  p.title = input.title;
  p.summary = input.summary ?? null;
  p.body = input.body;
  p.contentType = input.contentType;
  p.category = input.category;
  p.tags = input.tags ?? [];
  if (input.mediaUrl) p.mediaUrl = input.mediaUrl;
  if (input.audioUrl) p.audioUrl = input.audioUrl;
  p.updatedAt = new Date().toISOString();
  p.revisions = [...(p.revisions ?? []), { action: 'EDITED', actorName: actor.name, createdAt: p.updatedAt }];
  return toPostShape(p);
}

export async function submitForReview(id: string, actor: Actor): Promise<ContentPost | null> {
  const prisma = await getPrisma();
  if (prisma) {
    try {
      const existing = await prisma.contentPost.findUnique({ where: { id } });
      if (!existing || !['DRAFT', 'CHANGES_REQUESTED', 'REJECTED'].includes(existing.status)) return null;
      const row = await prisma.contentPost.update({
        where: { id },
        data: { status: 'SUBMITTED', editorNote: null },
      });
      await prisma.postRevision.create({ data: { postId: id, action: 'SUBMITTED', actorName: actor.name } });
      return mapPrismaPost(row);
    } catch {
      /* fall through */
    }
  }
  seedMemory();
  const p = mem.get(id);
  if (!p || !['DRAFT', 'CHANGES_REQUESTED', 'REJECTED'].includes(p.status)) return null;
  p.status = 'SUBMITTED';
  p.editorNote = null;
  p.updatedAt = new Date().toISOString();
  p.revisions = [...(p.revisions ?? []), { action: 'SUBMITTED', actorName: actor.name, createdAt: p.updatedAt }];
  return toPostShape(p);
}

export async function preReview(id: string, actor: Actor): Promise<{ post: ContentPost; report: AiReviewReport } | null> {
  const post = await getById(id);
  if (!post) return null;
  const published = await listPublishedPosts({});
  const report = runAiPreReview({ title: post.title, body: post.body }, published);

  const prisma = await getPrisma();
  if (prisma) {
    try {
      const row = await prisma.contentPost.update({
        where: { id },
        data: {
          aiReport: report as unknown as Prisma.InputJsonValue,
          aiDisclosure: report.disclosure,
        },
      });
      await prisma.postRevision.create({
        data: { postId: id, action: 'AI_REVIEWED', actorName: actor.name, snapshot: { report } as unknown as Prisma.InputJsonValue },
      });
      return { post: mapPrismaPost(row), report };
    } catch {
      /* fall through */
    }
  }
  seedMemory();
  const p = mem.get(id);
  if (!p) return null;
  p.aiReport = report;
  p.aiDisclosure = report.disclosure;
  p.updatedAt = new Date().toISOString();
  p.revisions = [...(p.revisions ?? []), { action: 'AI_REVIEWED', actorName: actor.name, createdAt: p.updatedAt }];
  return { post: toPostShape(p), report };
}

export async function makeDecision(id: string, decision: ReviewDecision, actorName: string): Promise<ContentPost | null> {
  const prisma = await getPrisma();
  if (prisma) {
    try {
      const existing = await prisma.contentPost.findUnique({ where: { id } });
      if (!existing) return null;
      let data: Record<string, unknown> = { editorNote: decision.note ?? null, reviewedAt: new Date() };
      if (decision.decision === 'PUBLISH') {
        data = {
          ...data,
          status: 'PUBLISHED',
          publishedAt: existing.publishedAt ?? new Date(),
          reviewedById: actorName,
        };
      } else if (decision.decision === 'APPROVE') {
        data = { ...data, status: 'APPROVED', reviewedById: actorName };
      } else if (decision.decision === 'REJECT') {
        data = { ...data, status: 'REJECTED', reviewedById: actorName };
      } else {
        data = { ...data, status: 'CHANGES_REQUESTED', reviewedById: actorName };
      }
      const row = await prisma.contentPost.update({ where: { id }, data: data as never });
      await prisma.postRevision.create({
        data: { postId: id, action: decision.decision === 'PUBLISH' ? 'PUBLISHED' : decision.decision, actorName, note: decision.note ?? null },
      });
      return mapPrismaPost(row);
    } catch {
      /* fall through */
    }
  }
  seedMemory();
  const p = mem.get(id);
  if (!p) return null;
  p.editorNote = decision.note ?? null;
  p.reviewedAt = new Date().toISOString();
  const now = new Date().toISOString();
  if (decision.decision === 'PUBLISH') {
    p.status = 'PUBLISHED';
    p.publishedAt = p.publishedAt ?? now;
    p.revisions = [...(p.revisions ?? []), { action: 'PUBLISHED', actorName, note: decision.note, createdAt: now }];
  } else if (decision.decision === 'APPROVE') {
    p.status = 'APPROVED';
    p.revisions = [...(p.revisions ?? []), { action: 'APPROVED', actorName, note: decision.note, createdAt: now }];
  } else if (decision.decision === 'REJECT') {
    p.status = 'REJECTED';
    p.revisions = [...(p.revisions ?? []), { action: 'REJECTED', actorName, note: decision.note, createdAt: now }];
  } else {
    p.status = 'CHANGES_REQUESTED';
    p.revisions = [...(p.revisions ?? []), { action: 'CHANGES_REQUESTED', actorName, note: decision.note, createdAt: now }];
  }
  p.updatedAt = now;
  return toPostShape(p);
}

// ── Engagement ──────────────────────────────────────────────────
export async function toggleLike(slug: string, actor: Actor): Promise<{ liked: boolean; likesCount: number }> {
  const prisma = await getPrisma();
  if (prisma) {
    try {
      const post = await prisma.contentPost.findUnique({ where: { slug } });
      if (!post) return { liked: false, likesCount: 0 };
      const existing = await prisma.postLike.findUnique({
        where: { postId_userIdKey: { postId: post.id, userIdKey: actor.key } },
      });
      if (existing) {
        await prisma.postLike.delete({ where: { id: existing.id } });
      } else {
        await prisma.postLike.create({ data: { postId: post.id, userIdKey: actor.key } });
      }
      const count = await prisma.postLike.count({ where: { postId: post.id } });
      await prisma.contentPost.update({ where: { id: post.id }, data: { likesCount: count } });
      return { liked: !existing, likesCount: count };
    } catch {
      /* fall through */
    }
  }
  seedMemory();
  const p = [...mem.values()].find(p => p.slug === slug);
  if (!p) return { liked: false, likesCount: 0 };
  const likeKey = `${actor.key}`;
  if (!p.likedByKeys && p.status !== 'PUBLISHED') return { liked: false, likesCount: p.likesCount };
  if (!p.likedByKeys) p.likedByKeys = new Set<string>();
  if (p.likedByKeys.has(likeKey)) {
    p.likedByKeys.delete(likeKey);
    p.likesCount = Math.max(0, p.likesCount - 1);
    return { liked: false, likesCount: p.likesCount };
  }
  p.likedByKeys.add(likeKey);
  p.likesCount += 1;
  return { liked: true, likesCount: p.likesCount };
}

export async function addComment(slug: string, author: Actor, body: string): Promise<PostComment | null> {
  const prisma = await getPrisma();
  if (prisma) {
    try {
      const post = await prisma.contentPost.findUnique({ where: { slug } });
      if (!post) return null;
      const row = await prisma.postComment.create({
        data: { postId: post.id, authorName: author.name, authorUserId: author.key, body },
      });
      return {
        id: row.id,
        authorName: row.authorName,
        authorUserId: row.authorUserId,
        body: row.body,
        status: row.status as PostComment['status'],
        createdAt: row.createdAt.toISOString(),
      };
    } catch {
      /* fall through */
    }
  }
  seedMemory();
  const p = [...mem.values()].find(p => p.slug === slug);
  if (!p) return null;
  const comment: PostComment = {
    id: `memc-${Date.now()}`,
    authorName: author.name,
    authorUserId: author.key,
    body,
    status: 'VISIBLE',
    createdAt: new Date().toISOString(),
  };
  p.comments = [...(p.comments ?? []), comment];
  return comment;
}

export async function toggleSave(slug: string, actor: Actor): Promise<{ saved: boolean; savesCount: number }> {
  const prisma = await getPrisma();
  if (prisma) {
    try {
      const post = await prisma.contentPost.findUnique({ where: { slug } });
      if (!post) return { saved: false, savesCount: 0 };
      const existing = await prisma.postSave.findUnique({
        where: { postId_userIdKey: { postId: post.id, userIdKey: actor.key } },
      });
      if (existing) {
        await prisma.postSave.delete({ where: { id: existing.id } });
      } else {
        await prisma.postSave.create({ data: { postId: post.id, userIdKey: actor.key } });
      }
      const count = await prisma.postSave.count({ where: { postId: post.id } });
      return { saved: !existing, savesCount: count };
    } catch {
      /* fall through */
    }
  }
  seedMemory();
  const p = [...mem.values()].find(p => p.slug === slug);
  if (!p) return { saved: false, savesCount: 0 };
  if (!p.savedByKeys) p.savedByKeys = new Set<string>();
  if (p.savedByKeys.has(actor.key)) {
    p.savedByKeys.delete(actor.key);
    return { saved: false, savesCount: Math.max(0, p.savedByKeys.size) };
  }
  p.savedByKeys.add(actor.key);
  return { saved: true, savesCount: p.savedByKeys.size };
}

export async function reportPost(slug: string, actor: Actor, reason: string, note?: string): Promise<boolean> {
  const prisma = await getPrisma();
  if (prisma) {
    try {
      const post = await prisma.contentPost.findUnique({ where: { slug } });
      if (!post) return false;
      await prisma.postReport.create({
        data: {
          postId: post.id,
          userIdKey: actor.key,
          reason,
          note: note ?? null,
          snapshot: post.title,
        },
      });
      return true;
    } catch {
      /* fall through */
    }
  }
  seedMemory();
  const p = [...mem.values()].find(p => p.slug === slug);
  if (!p) return false;
  if (!p.reportsArr) p.reportsArr = [];
  p.reportsArr.push({ reason, note: note ?? null, actor: actor.name, at: new Date().toISOString() });
  return true;
}

export async function recordView(slug: string, viewsCount?: number): Promise<void> {
  // No-op via reads below; view counting is best-effort and tolerant of failure.
  const prisma = await getPrisma();
  if (prisma) {
    try {
      await prisma.contentPost.updateMany({ where: { slug }, data: { viewsCount: { increment: 1 } } });
    } catch {
      /* ignore */
    }
  }
  seedMemory();
  const p = [...mem.values()].find(p => p.slug === slug);
  if (p) p.viewsCount = viewsCount ?? p.viewsCount + 1;
}

// ── Helpers ──────────────────────────────────────────────────────
async function uniqueSlugFromDb(title: string): Promise<string> {
  const prisma = await getPrisma();
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || 'untitled';
  let slug = base;
  let n = 2;
  while (prisma && (await prisma.contentPost.findUnique({ where: { slug } }))) {
    slug = `${base}-${n++}`;
  }
  return slug;
}
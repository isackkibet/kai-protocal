import { NextResponse } from 'next/server';
import { listPublishedPosts } from '@/lib/sihu-store';

// Returns the published SIHU feed, shaped exactly like the old seed-driven
// page consumed it so the frontend contract is unchanged. Unknown categories
// are simply omitted upstream; published conservation posts flow through "All".
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') ?? 'ALL';
  const q        = searchParams.get('q') ?? '';

  const posts = await listPublishedPosts({ category, q });

  const feed = posts.map(p => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    summary: p.summary ?? '',
    contentType: p.contentType,
    category: p.category,
    creator: p.creatorName,
    badge: p.authorBadge ?? '',
    publishedAt: (p.publishedAt ?? p.createdAt).slice(0, 10),
    viewsCount: p.viewsCount,
    likesCount: p.likesCount,
    tipsEarnedKes: p.tipsEarnedKes,
    audioDurationSeconds: p.audioDurationSeconds ?? undefined,
    audioUrl: p.audioUrl ?? undefined,
    language: p.language,
    tags: p.tags,
    aiDisclosure: p.aiDisclosure,
  }));

  return NextResponse.json({ posts: feed, category, q });
}
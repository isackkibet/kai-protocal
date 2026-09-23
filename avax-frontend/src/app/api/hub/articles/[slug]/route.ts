import { NextResponse } from 'next/server';
import { addComment, getBySlug, recordView, reportPost, toggleLike, toggleSave } from '@/lib/sihu-store';
import { resolveActor } from '@/lib/hub-actor';

/**
 * SIHU public article + engagement endpoints (PRD Part A §5).
 *
 * GET  /api/hub/articles/:slug  — published article (readable unauthenticated)
 * POST /api/hub/articles/:slug  — like / save / comment / report
 */
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const post = await getBySlug(slug, true);
  if (!post || post.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Article not found.' }, { status: 404 });
  }
  recordView(slug).catch(() => {});
  return NextResponse.json({ post });
}

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const body = await req.json().catch(() => ({})) as {
    action?: 'like' | 'save' | 'comment' | 'report';
    name?: string;
    guestKey?: string;
    text?: string;
    reason?: string;
    note?: string;
  };

  const post = await getBySlug(slug);
  if (!post || post.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Article not found.' }, { status: 404 });
  }

  const { actor, authenticated } = await resolveActor(req, body.name, body.guestKey);
  if (!actor) {
    return NextResponse.json({ error: 'Please sign in or provide a guest identifier.' }, { status: 401 });
  }

  switch (body.action) {
    case 'like': {
      const res = await toggleLike(slug, actor);
      return NextResponse.json(res);
    }
    case 'save': {
      const res = await toggleSave(slug, actor);
      return NextResponse.json(res);
    }
    case 'comment': {
      const text = body.text?.trim();
      if (!text || text.length < 2 || text.length > 1000) {
        return NextResponse.json({ error: 'Comment must be 2–1000 characters.' }, { status: 400 });
      }
      const comment = await addComment(slug, actor, text);
      if (!comment) return NextResponse.json({ error: 'Comment could not be added.' }, { status: 500 });
      return NextResponse.json({ comment }, { status: 201 });
    }
    case 'report': {
      const reason = (body.reason ?? '').trim();
      if (!reason) return NextResponse.json({ error: 'A report reason is required.' }, { status: 400 });
      const ok = await reportPost(slug, actor, reason, body.note?.trim() || undefined);
      if (!ok) return NextResponse.json({ error: 'Report could not be filed.' }, { status: 500 });
      return NextResponse.json({ ok: true, reported: true });
    }
    default:
      return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 400 });
  }
}

export const dynamic = 'force-dynamic';
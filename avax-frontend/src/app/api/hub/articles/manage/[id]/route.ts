import { NextResponse } from 'next/server';
import { getById, saveDraft, submitForReview, preReview } from '@/lib/sihu-store';
import { resolveActor } from '@/lib/hub-actor';
import type { PostDraftInput } from '@/lib/sihu-types';

/**
 * SIHU author workflow endpoints (PRD Part A §2).
 *
 * PATCH /api/hub/articles/:id      — save changes to a DRAFT / CHANGES_REQUESTED post
 * POST  /api/hub/articles/:id/submit — move DRAFT / CHANGES_REQUESTED → SUBMITTED
 * POST  /api/hub/articles/:id/preview — run the AI editorial pre-review (never publishes)
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({})) as Partial<PostDraftInput> & { name?: string };
  const { actor, authenticated } = await resolveActor(req, body.name);
  if (!actor || !authenticated) {
    return NextResponse.json({ error: 'Please sign in to edit.' }, { status: 401 });
  }

  const existing = await getById(id);
  if (!existing) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
  if (existing.creatorUserId !== actor.key) {
    return NextResponse.json({ error: 'Only the author can edit this draft.' }, { status: 403 });
  }

  const title = body.title?.trim() || existing.title;
  const text = body.body?.trim() || existing.body;
  const post = await saveDraft(
    id,
    {
      title,
      summary: body.summary?.trim() ?? existing.summary ?? undefined,
      body: text,
      contentType: body.contentType ?? existing.contentType,
      category: body.category ?? existing.category,
      language: body.language ?? existing.language,
      tags: body.tags ?? existing.tags,
      mediaUrl: body.mediaUrl ?? existing.mediaUrl ?? undefined,
      audioUrl: body.audioUrl ?? existing.audioUrl ?? undefined,
    },
    actor,
  );
  if (!post) return NextResponse.json({ error: 'This post is no longer editable.' }, { status: 409 });
  return NextResponse.json({ post });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({})) as { action?: string; name?: string };
  const { actor, authenticated } = await resolveActor(req, body.name);
  if (!actor || !authenticated) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }

  const existing = await getById(id);
  if (!existing) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
  if (existing.creatorUserId !== actor.key) {
    return NextResponse.json({ error: 'Only the author can do this.' }, { status: 403 });
  }

  if (body.action === 'submit') {
    const post = await submitForReview(id, actor);
    if (!post) return NextResponse.json({ error: 'Only drafts and requested-change posts can be submitted.' }, { status: 409 });
    return NextResponse.json({ post });
  }

  if (body.action === 'preview') {
    const res = await preReview(id, actor);
    if (!res) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    return NextResponse.json({ post: res.post, report: res.report });
  }

  return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 400 });
}
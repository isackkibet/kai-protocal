import { NextResponse } from 'next/server';
import { createDraft, listContributorPosts } from '@/lib/sihu-store';
import { resolveActor } from '@/lib/hub-actor';
import type { PostDraftInput } from '@/lib/sihu-types';

/**
 * SIHU authoring endpoints (PRD Part A §2).
 *
 * POST  /api/hub/articles      — create a draft (requires verified sign-in)
 * GET   /api/hub/articles      — list the signed-in contributor's own posts
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as Partial<PostDraftInput> & { name?: string };
  const { actor, authenticated } = await resolveActor(req, body.name);

  if (!actor || !authenticated) {
    return NextResponse.json({ error: 'Please sign in to create an article.' }, { status: 401 });
  }

  const title = body.title?.trim();
  const text = body.body?.trim();
  if (!title || !text) {
    return NextResponse.json({ error: 'Title and article body are required.' }, { status: 400 });
  }
  if (title.length < 6 || text.length < 80) {
    return NextResponse.json({ error: 'Title should be 6+ characters and the body at least 80 characters.' }, { status: 400 });
  }

  const post = await createDraft(
    {
      title,
      summary: body.summary?.trim() || undefined,
      body: text,
      contentType: body.contentType ?? 'ARTICLE',
      category: body.category ?? 'COMMUNITY',
      language: body.language ?? 'EN',
      tags: body.tags ?? [],
      mediaUrl: body.mediaUrl,
      audioUrl: body.audioUrl,
    },
    actor,
  );

  return NextResponse.json({ post }, { status: 201 });
}

export async function GET(req: Request) {
  const { actor, authenticated } = await resolveActor(req);
  if (!actor || !authenticated) {
    return NextResponse.json({ posts: [] });
  }
  const posts = await listContributorPosts(actor.key);
  return NextResponse.json({ posts });
}
import { NextResponse } from 'next/server';
import { getById, makeDecision } from '@/lib/sihu-store';
import { resolveActor } from '@/lib/hub-actor';
import type { ReviewDecision } from '@/lib/sihu-types';

/**
 * Editor decision endpoint. Kept as its own route so the editor dashboard can
 * call it cleanly: /api/hub/editor/[id]
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({})) as ReviewDecision & { name?: string };
  const { actor, authenticated } = await resolveActor(req, body.name);
  if (!actor || !authenticated) {
    return NextResponse.json({ error: 'Please sign in to review.' }, { status: 401 });
  }

  const post = await getById(id);
  if (!post) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
  if (post.status === 'PUBLISHED') {
    return NextResponse.json({ error: 'This post is already published.' }, { status: 409 });
  }

  const updated = await makeDecision(id, { decision: body.decision, note: body.note?.trim() || undefined }, actor.name);
  if (!updated) return NextResponse.json({ error: 'Decision could not be applied.' }, { status: 500 });
  return NextResponse.json({ post: updated });
}
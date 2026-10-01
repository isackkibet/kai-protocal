import { NextResponse } from 'next/server';
import { getById, makeDecision } from '@/lib/hubs/sihu-store';
import { resolveActor, isHubEditor } from '@/lib/hubs/hub-actor';
import type { ReviewDecision } from '@/lib/hubs/sihu-types';

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

  if (!(await isHubEditor(actor.key))) {
    return NextResponse.json({ error: 'Only SIHU editors can review stories.', notEditor: true }, { status: 403 });
  }

  const post = await getById(id);
  if (!post) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
  if (post.creatorUserId && post.creatorUserId === actor.key) {
    return NextResponse.json({ error: 'You cannot review your own story. Another editor has to decide.' }, { status: 403 });
  }
  const decisions = ['PUBLISH', 'APPROVE', 'REJECT', 'REQUIRE_CHANGES'];
  if (!decisions.includes(body.decision)) {
    return NextResponse.json({ error: 'Unknown decision.' }, { status: 400 });
  }
  // The writer needs to know why: a rejection or a change request carries a reason.
  if ((body.decision === 'REJECT' || body.decision === 'REQUIRE_CHANGES') && !body.note?.trim()) {
    return NextResponse.json({ error: 'Add a short note so the writer knows what to fix.' }, { status: 400 });
  }
  if (post.status === 'PUBLISHED') {
    return NextResponse.json({ error: 'This post is already published.' }, { status: 409 });
  }

  const updated = await makeDecision(id, { decision: body.decision, note: body.note?.trim() || undefined }, actor.name);
  if (!updated) return NextResponse.json({ error: 'Decision could not be applied.' }, { status: 500 });
  return NextResponse.json({ post: updated });
}
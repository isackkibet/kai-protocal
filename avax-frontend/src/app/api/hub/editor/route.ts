import { NextResponse } from 'next/server';
import { getById, listReviewQueue, makeDecision } from '@/lib/sihu-store';
import { resolveActor } from '@/lib/hub-actor';
import type { ReviewDecision } from '@/lib/sihu-types';

/**
 * SIHU editor endpoints (PRD Part A §4, §6).
 *
 * GET /api/hub/editor       — the review queue: SUBMITTED / APPROVED / CHANGES_REQUESTED
 * POST /api/hub/editor/:id  — editor decision: PUBLISH | APPROVE | REJECT | REQUIRE_CHANGES
 *
 * Editor authority: a verified signed-in session. Real role-based access
 * control (which Privy users hold the EDITOR role) plugs in where Kai Nuvari
 * role management is introduced; the AI can never call this endpoint.
 */
export async function GET(req: Request) {
  const { actor, authenticated } = await resolveActor(req);
  if (!actor || !authenticated) {
    return NextResponse.json({ error: 'Please sign in to open the editor.' }, { status: 401 });
  }
  const posts = await listReviewQueue();
  return NextResponse.json({ posts });
}

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
  if (!['SUBMITTED', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED'].includes(post.status)) {
    return NextResponse.json({ error: 'This post is not in the review queue.' }, { status: 409 });
  }

  const decision: ReviewDecision = {
    decision: body.decision,
    note: body.note?.trim() || undefined,
  };

  const updated = await makeDecision(id, decision, actor.name);
  if (!updated) return NextResponse.json({ error: 'Decision could not be applied.' }, { status: 500 });
  return NextResponse.json({ post: updated });
}
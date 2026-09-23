import { NextResponse } from 'next/server';
import { listReviewQueue } from '@/lib/sihu-store';
import { resolveActor } from '@/lib/hub-actor';

/**
 * SIHU editor endpoints (PRD Part A §4, §6).
 *
 * GET /api/hub/editor      — the review queue: SUBMITTED / APPROVED / CHANGES_REQUESTED
 * POST /api/hub/editor/:id — editor decision: PUBLISH | APPROVE | REJECT | REQUIRE_CHANGES
 *                            (see [id]/route.ts)
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
import { NextResponse } from 'next/server';
import { listReviewQueue } from '@/lib/hubs/sihu-store';
import { resolveActor, isHubEditor } from '@/lib/hubs/hub-actor';

/**
 * SIHU editor endpoints (PRD Part A §4, §6).
 *
 * GET /api/hub/editor      — the review queue: SUBMITTED / APPROVED / CHANGES_REQUESTED
 * POST /api/hub/editor/:id — editor decision: PUBLISH | APPROVE | REJECT | REQUIRE_CHANGES
 *                            (see [id]/route.ts)
 *
 * Editor authority: a verified session whose member is on the editor list
 * (SIHU_EDITOR_EMAILS, see isHubEditor). The AI can never call this endpoint.
 */
export async function GET(req: Request) {
  const { actor, authenticated } = await resolveActor(req);
  if (!actor || !authenticated) {
    return NextResponse.json({ error: 'Please sign in to open the editor.' }, { status: 401 });
  }
  if (!(await isHubEditor(actor.key))) {
    return NextResponse.json({ error: 'Only SIHU editors can open the editor desk.', notEditor: true }, { status: 403 });
  }
  const posts = await listReviewQueue();
  return NextResponse.json({ posts });
}
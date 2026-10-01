import { NextResponse } from 'next/server';
import { RecordError } from '@/lib/mrv/records';
import { DECISIONS, reviewRecord, type Decision } from '@/lib/mrv/verification';
import { memberContext } from '@/lib/nursery/route';
import { requireRateLimit } from '@/lib/security/route-guard';
import { readJsonBody, InputError } from '@/lib/security/input';

/**
 * POST /api/mrv/records/:id/review — a verifier's decision (Kanuvari Tools &
 * Agents PRD §4.9 review_record / approve_record / reject_record /
 * request_correction).
 *
 * Body: { decision: UNDER_REVIEW | VERIFIED | REJECTED | CORRECTION_REQUIRED,
 *         reason?, expectedVersion? }
 * Only an active verifier or admin of the record's CFA, never on their own
 * submission. Every decision is kept in verification_reviews.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const limited = await requireRateLimit(req, [{ scope: 'ip', limit: 30, windowMs: 60_000 }]);
  if (!limited.ok) return limited.response;

  let body: Record<string, unknown>;
  try {
    body = ((await readJsonBody(req)) ?? {}) as Record<string, unknown>;
  } catch (err) {
    return NextResponse.json({ error: err instanceof InputError ? err.message : 'Invalid JSON body' }, { status: 400 });
  }
  const decision = String(body.decision ?? '') as Decision;
  if (!(DECISIONS as readonly string[]).includes(decision)) {
    return NextResponse.json({ error: `decision must be one of: ${DECISIONS.join(', ')}` }, { status: 400 });
  }
  const reason = typeof body.reason === 'string' ? body.reason.slice(0, 2000) : null;
  const expectedVersion = Number.isInteger(body.expectedVersion) ? (body.expectedVersion as number) : null;

  const ctx = await memberContext(req);
  if (!ctx.ok) return ctx.response;
  try {
    const result = await reviewRecord(ctx.prisma, { recordId: id, member: ctx.member, decision, reason, expectedVersion });
    return NextResponse.json({
      ok: true,
      record: { id: result.record.id, verificationStatus: result.record.verificationStatus, currentVersion: result.record.currentVersion },
      review: { id: result.review.id, decision: result.review.decision, createdAt: result.review.createdAt },
    });
  } catch (e) {
    if (e instanceof RecordError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('[mrv/records/:id/review] failed', e);
    return NextResponse.json({ error: 'Could not save the decision.' }, { status: 500 });
  }
}

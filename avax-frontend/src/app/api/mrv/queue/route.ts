import { NextResponse } from 'next/server';
import { memberContext } from '@/lib/nursery/route';
import { QUEUE_STATUSES } from '@/lib/mrv/verification';

/**
 * GET /api/mrv/queue — the verification desk (Kanuvari Tools & Agents PRD
 * §4.9 get_verification_queue).
 *
 *   queue  — records waiting for a verifier (verifiers and admins only),
 *            oldest first, minus the caller's own submissions.
 *   mine   — the caller's records that were sent back (correction required)
 *            or rejected, so they can fix them.
 */
export async function GET(req: Request) {
  const ctx = await memberContext(req);
  if (!ctx.ok) return ctx.response;
  const { prisma, cfa, member } = ctx;

  try {
    const canReview = member.status === 'active' && (member.role === 'verifier' || member.role === 'admin');
    const select = {
      id: true, recordType: true, schemaVersion: true, currentVersion: true, dataHash: true,
      verificationStatus: true, anchorStatus: true, submittedByMemberId: true, createdAt: true, updatedAt: true,
      versions: { orderBy: { version: 'desc' as const }, take: 1, select: { data: true } },
      reviews: { orderBy: { createdAt: 'desc' as const }, take: 1, select: { decision: true, reason: true, createdAt: true } },
    };
    const [queue, mine] = await Promise.all([
      canReview
        ? prisma.conservationRecord.findMany({
            where: { forestId: cfa.id, verificationStatus: { in: [...QUEUE_STATUSES] }, NOT: { submittedByMemberId: member.id } },
            orderBy: { createdAt: 'asc' },
            take: 50,
            select,
          })
        : Promise.resolve([]),
      prisma.conservationRecord.findMany({
        where: { forestId: cfa.id, submittedByMemberId: member.id, verificationStatus: { in: ['CORRECTION_REQUIRED', 'REJECTED'] } },
        orderBy: { updatedAt: 'desc' },
        take: 50,
        select,
      }),
    ]);
    const shape = (r: (typeof mine)[number]) => {
      const { versions, reviews, ...rest } = r;
      return { ...rest, data: versions[0]?.data ?? null, lastReview: reviews[0] ?? null };
    };
    return NextResponse.json({ role: member.role, canReview, queue: queue.map(shape), mine: mine.map(shape) });
  } catch (e) {
    console.error('[mrv/queue] failed', e);
    return NextResponse.json({ error: 'Could not load the queue.' }, { status: 500 });
  }
}

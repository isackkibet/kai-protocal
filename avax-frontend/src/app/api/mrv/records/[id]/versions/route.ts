import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { verifyPrivyUserId } from '@/lib/privy-server';
import { appendRecordVersion, RecordError } from '@/lib/mrv/records';

/**
 * POST /api/mrv/records/:id/versions — submit a correction.
 *
 * Body: { data, reason }. The correction becomes a new version chained to
 * the previous one; the original is never modified (PRD §4.2). Only the
 * member who submitted the record, or an ADMIN of the same CFA, may correct
 * it. Any status in the body is ignored — status is backend-owned (§6.1).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
  if (!privyUserId) return NextResponse.json({ error: 'Please sign in to correct a record.' }, { status: 401 });

  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });

  try {
    const record = await prisma.conservationRecord.findUnique({ where: { id } });
    if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

    const kaiUser = await prisma.kaiUser.findUnique({ where: { privyUserId } });
    const member = kaiUser ? await prisma.forestMember.findUnique({ where: { kaiUserId: kaiUser.id } }) : null;
    const isSubmitter = !!member && member.id === record.submittedByMemberId;
    const isAdmin = !!member && member.forestId === record.forestId && member.role === 'ADMIN';
    if (!isSubmitter && !isAdmin) {
      return NextResponse.json({ error: 'Only the submitter or a CFA admin can correct this record.' }, { status: 403 });
    }

    const data = body.data;
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return NextResponse.json({ error: 'data must be the full corrected record object' }, { status: 400 });
    }

    const updated = await appendRecordVersion(prisma, id, {
      data,
      reason: String(body.reason ?? ''),
      memberId: member!.id,
    });
    return NextResponse.json({ ok: true, record: updated });
  } catch (e) {
    if (e instanceof RecordError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('[mrv/records/:id/versions] failed', e);
    return NextResponse.json({ error: 'Failed to save correction' }, { status: 500 });
  }
}

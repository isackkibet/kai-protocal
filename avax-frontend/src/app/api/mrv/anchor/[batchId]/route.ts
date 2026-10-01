import { NextResponse } from 'next/server';
import { cancelAnchorBatch, confirmAnchorBatch } from '@/lib/mrv/anchor';
import { RecordError } from '@/lib/mrv/records';
import { memberContext } from '@/lib/nursery/route';
import { requireRateLimit } from '@/lib/security/route-guard';
import { readJsonBody, InputError } from '@/lib/security/input';

/**
 * POST /api/mrv/anchor/:batchId
 *   { action: 'confirm', txHash } — after the wallet sent the anchoring
 *     transaction: the server reads it from Fuji and checks it carries this
 *     batch's root before marking the records ANCHORED. Answers 202 while
 *     the transaction is not mined yet (the page retries).
 *   { action: 'cancel' } — give up on a pending batch (wallet rejected).
 */
export async function POST(req: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const limited = await requireRateLimit(req, [{ scope: 'ip', limit: 30, windowMs: 60_000 }]);
  if (!limited.ok) return limited.response;
  if (!/^[0-9a-f-]{36}$/i.test(batchId)) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = ((await readJsonBody(req)) ?? {}) as Record<string, unknown>;
  } catch (err) {
    return NextResponse.json({ error: err instanceof InputError ? err.message : 'Invalid JSON body' }, { status: 400 });
  }

  const ctx = await memberContext(req);
  if (!ctx.ok) return ctx.response;
  try {
    if (body.action === 'cancel') return NextResponse.json(await cancelAnchorBatch(ctx.prisma, ctx.cfa, ctx.member, batchId));
    if (body.action === 'confirm') {
      const batch = await confirmAnchorBatch(ctx.prisma, ctx.cfa, ctx.member, batchId, String(body.txHash ?? ''));
      return NextResponse.json({ ok: true, batch });
    }
    return NextResponse.json({ error: "action must be 'confirm' or 'cancel'" }, { status: 400 });
  } catch (e) {
    if (e instanceof RecordError) {
      return NextResponse.json({ error: e.message, pending: e.status === 202 }, { status: e.status });
    }
    console.error('[mrv/anchor/:batchId] failed', e);
    return NextResponse.json({ error: 'Could not update the batch.' }, { status: 500 });
  }
}

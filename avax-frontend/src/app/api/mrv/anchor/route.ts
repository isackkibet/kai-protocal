import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/db';
import { createAnchorBatch, listAnchorBatches } from '@/lib/mrv/anchor';
import { RecordError } from '@/lib/mrv/records';
import { getNurseryCfa } from '@/lib/nursery/db';
import { memberContext } from '@/lib/nursery/route';
import { requireRateLimit } from '@/lib/security/route-guard';

/**
 * /api/mrv/anchor — Merkle anchoring of verified records on Avalanche Fuji
 * (Kanuvari Tools & Agents PRD §4.11, §9).
 *
 * GET  — public: how many verified records wait, and recent batches.
 * POST — CFA admin/verifier: build a batch (or return the pending one). The
 *        response carries the exact transaction to send from their wallet;
 *        then POST /api/mrv/anchor/:batchId { action: 'confirm', txHash }.
 */
export async function GET() {
  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ verifiedWaiting: 0, batches: [], db: false });
  try {
    const cfa = await getNurseryCfa(prisma);
    if (!cfa) return NextResponse.json({ verifiedWaiting: 0, batches: [], db: false });
    return NextResponse.json(await listAnchorBatches(prisma, cfa.id));
  } catch (e) {
    console.error('[mrv/anchor] list failed', e);
    return NextResponse.json({ verifiedWaiting: 0, batches: [], db: false });
  }
}

export async function POST(req: Request) {
  const limited = await requireRateLimit(req, [{ scope: 'ip', limit: 10, windowMs: 60_000 }]);
  if (!limited.ok) return limited.response;
  const ctx = await memberContext(req);
  if (!ctx.ok) return ctx.response;
  try {
    const batch = await createAnchorBatch(ctx.prisma, ctx.cfa, ctx.member);
    return NextResponse.json({ ok: true, batch });
  } catch (e) {
    if (e instanceof RecordError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('[mrv/anchor] create failed', e);
    return NextResponse.json({ error: 'Could not create the batch.' }, { status: 500 });
  }
}

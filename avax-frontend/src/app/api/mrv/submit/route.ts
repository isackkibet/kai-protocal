import { NextResponse } from 'next/server';
import { RecordError } from '@/lib/mrv/records';
import { recordForSource, SUBMITTABLE_SOURCES, type SubmittableSource } from '@/lib/mrv/sources';
import { memberContext } from '@/lib/nursery/route';
import { requireRateLimit } from '@/lib/security/route-guard';
import { readJsonBody, InputError } from '@/lib/security/input';

/**
 * POST /api/mrv/submit { sourceTable, sourceId } — submit a planted batch or
 * a survival check for verification (Kanuvari Tools & Agents PRD §4.9
 * submit_for_verification). New plantings and survival checks are submitted
 * automatically; this covers rows whose record wasn't created at the time.
 * Idempotent: returns the existing record if there is one.
 */
export async function POST(req: Request) {
  const limited = await requireRateLimit(req, [{ scope: 'ip', limit: 30, windowMs: 60_000 }]);
  if (!limited.ok) return limited.response;

  let body: Record<string, unknown>;
  try {
    body = ((await readJsonBody(req)) ?? {}) as Record<string, unknown>;
  } catch (err) {
    return NextResponse.json({ error: err instanceof InputError ? err.message : 'Invalid JSON body' }, { status: 400 });
  }
  const sourceTable = String(body.sourceTable ?? '') as SubmittableSource;
  const sourceId = String(body.sourceId ?? '');
  if (!(SUBMITTABLE_SOURCES as readonly string[]).includes(sourceTable)) {
    return NextResponse.json({ error: `sourceTable must be one of: ${SUBMITTABLE_SOURCES.join(', ')}` }, { status: 400 });
  }

  const ctx = await memberContext(req);
  if (!ctx.ok) return ctx.response;
  try {
    const record = await recordForSource(ctx.prisma, ctx.cfa, sourceTable, sourceId);
    return NextResponse.json({ ok: true, record: { id: record.id, dataHash: record.dataHash, verificationStatus: record.verificationStatus } });
  } catch (e) {
    if (e instanceof RecordError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('[mrv/submit] failed', e);
    return NextResponse.json({ error: 'Could not submit this record.' }, { status: 500 });
  }
}

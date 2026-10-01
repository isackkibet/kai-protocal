import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/db';
import { issueRecordCredential, toW3C } from '@/lib/identity/credentials';
import { RecordError } from '@/lib/mrv/records';
import { memberContext } from '@/lib/nursery/route';
import { requireRateLimit } from '@/lib/security/route-guard';
import { readJsonBody, InputError } from '@/lib/security/input';

/**
 * /api/identity/credentials (Ecosystem PRD v1.1 §4.17)
 * GET ?recordId= — public: the credentials issued for a record (W3C format).
 * POST { recordId, issuedAt, signer, signature } — a CFA admin/verifier
 *   stores the credential their wallet signed; the server re-checks it.
 */
export async function GET(req: Request) {
  const recordId = new URL(req.url).searchParams.get('recordId')?.trim() ?? '';
  if (!/^[a-z0-9]{8,40}$/i.test(recordId)) return NextResponse.json({ error: 'recordId is required' }, { status: 400 });
  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ credentials: [], db: false });
  const rows = await prisma.verifiableCredential.findMany({ where: { recordId }, orderBy: { issuedAt: 'desc' } }).catch(() => []);
  return NextResponse.json({ credentials: rows.map((r) => ({ id: r.id, status: r.status, issuedAt: r.issuedAt, signer: r.signerAddress, w3c: toW3C(r) })) });
}

export async function POST(req: Request) {
  const limited = await requireRateLimit(req, [{ scope: 'ip', limit: 20, windowMs: 60_000 }]);
  if (!limited.ok) return limited.response;
  let body: Record<string, unknown>;
  try { body = ((await readJsonBody(req)) ?? {}) as Record<string, unknown>; } catch (e) {
    return NextResponse.json({ error: e instanceof InputError ? e.message : 'Invalid JSON body' }, { status: 400 });
  }
  const ctx = await memberContext(req);
  if (!ctx.ok) return ctx.response;
  try {
    const vc = await issueRecordCredential(ctx.prisma, ctx.cfa, ctx.member, {
      recordId: String(body.recordId ?? ''), issuedAt: String(body.issuedAt ?? ''), signer: String(body.signer ?? ''), signature: String(body.signature ?? ''),
    });
    return NextResponse.json({ ok: true, credential: toW3C(vc), id: vc.id });
  } catch (e) {
    if (e instanceof RecordError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('[identity/credentials] issue failed', e);
    return NextResponse.json({ error: 'Could not store the credential.' }, { status: 500 });
  }
}

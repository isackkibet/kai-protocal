import { NextResponse } from 'next/server';
import { prepareRecordCredential } from '@/lib/identity/credentials';
import { RecordError } from '@/lib/mrv/records';
import { memberContext } from '@/lib/nursery/route';
import { readJsonBody, InputError } from '@/lib/security/input';

/**
 * POST /api/identity/credentials/prepare { recordId } — the EIP-712 message
 * a CFA admin/verifier signs in their own wallet to issue a
 * "VerifiedConservationRecord" credential. Nothing is stored yet.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = ((await readJsonBody(req)) ?? {}) as Record<string, unknown>; } catch (e) {
    return NextResponse.json({ error: e instanceof InputError ? e.message : 'Invalid JSON body' }, { status: 400 });
  }
  const ctx = await memberContext(req);
  if (!ctx.ok) return ctx.response;
  try {
    return NextResponse.json(await prepareRecordCredential(ctx.prisma, ctx.cfa, ctx.member, String(body.recordId ?? '')));
  } catch (e) {
    if (e instanceof RecordError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('[identity/credentials/prepare] failed', e);
    return NextResponse.json({ error: 'Could not prepare the credential.' }, { status: 500 });
  }
}

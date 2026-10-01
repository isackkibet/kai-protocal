import { NextResponse } from 'next/server';
import { revokeCredential } from '@/lib/identity/credentials';
import { RecordError } from '@/lib/mrv/records';
import { memberContext } from '@/lib/nursery/route';
import { readJsonBody, InputError } from '@/lib/security/input';

/** POST /api/identity/credentials/:id/revoke { reason } — CFA admins. Credentials are never deleted. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = ((await readJsonBody(req)) ?? {}) as Record<string, unknown>; } catch (e) {
    return NextResponse.json({ error: e instanceof InputError ? e.message : 'Invalid JSON body' }, { status: 400 });
  }
  const ctx = await memberContext(req);
  if (!ctx.ok) return ctx.response;
  try {
    const vc = await revokeCredential(ctx.prisma, ctx.cfa, ctx.member, id, String(body.reason ?? ''));
    return NextResponse.json({ ok: true, status: vc.status });
  } catch (e) {
    if (e instanceof RecordError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('[identity/credentials/:id/revoke] failed', e);
    return NextResponse.json({ error: 'Could not revoke.' }, { status: 500 });
  }
}

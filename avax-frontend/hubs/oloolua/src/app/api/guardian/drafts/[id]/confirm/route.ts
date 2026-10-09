import { NextResponse, type NextRequest } from 'next/server';
import { requireMember, toolStatus } from '@/lib/guardian/http';
import { confirmDraft } from '@/lib/guardian/records';

/**
 * confirm_activity_record: the only way a record is saved, and only on the
 * user's explicit yes. Idempotent: confirming twice returns the same record.
 * Never uses a prompt.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireMember(request);
  if ('response' in auth) return auth.response;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: 'Draft not found.' }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  const r = await confirmDraft(auth.viewer, id, body?.acknowledged === true);
  return r.ok ? NextResponse.json({ saved: r.value }) : NextResponse.json({ error: r.message }, { status: toolStatus(r.code) });
}

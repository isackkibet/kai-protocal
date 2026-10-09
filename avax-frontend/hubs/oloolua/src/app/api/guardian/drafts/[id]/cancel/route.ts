import { NextResponse, type NextRequest } from 'next/server';
import { requireMember, toolStatus } from '@/lib/guardian/http';
import { cancelDraft } from '@/lib/guardian/records';

/** Cancel a draft. Nothing is saved, and no prompt is used. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireMember(request);
  if ('response' in auth) return auth.response;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: 'Draft not found.' }, { status: 404 });
  const r = await cancelDraft(auth.viewer, id);
  return r.ok ? NextResponse.json({ draft: r.value }) : NextResponse.json({ error: r.message }, { status: toolStatus(r.code) });
}

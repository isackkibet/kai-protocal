import { NextResponse, type NextRequest } from 'next/server';
import { requireMember, toolStatus } from '@/lib/guardian/http';
import { createDraft, getOpenDraft } from '@/lib/guardian/records';
import { isActivityType } from '@/lib/guardian/constants';

/** The user's open draft, if any. */
export async function GET(request: NextRequest) {
  const auth = await requireMember(request);
  if ('response' in auth) return auth.response;
  return NextResponse.json({ draft: await getOpenDraft(auth.viewer) });
}

/** Start a draft from the Hub's structured form (no AI, no prompt used). */
export async function POST(request: NextRequest) {
  const auth = await requireMember(request);
  if ('response' in auth) return auth.response;
  const b = (await request.json().catch(() => ({}))) ?? {};
  const num = (v: unknown) => (v === '' || v === null || v === undefined ? undefined : Number(v));
  const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
  const r = await createDraft(auth.viewer, {
    type: isActivityType(b.type) ? b.type : undefined,
    quantity: num(b.quantity),
    date: text(b.date),
    species: text(b.species),
    seedbed: num(b.seedbed),
    toSeedbed: num(b.toSeedbed),
    destination: text(b.destination),
    notes: text(b.notes),
  }, { channel: 'form', requestText: 'Hub form' });
  return r.ok
    ? NextResponse.json({ draft: r.value.view, problem: r.value.problem })
    : NextResponse.json({ error: r.message }, { status: toolStatus(r.code) });
}

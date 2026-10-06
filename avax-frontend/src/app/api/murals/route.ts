import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/db';
import { canManageCatalogue, explainDbError, getNurseryCfa, getSessionMember } from '@/lib/nursery/db';
import { FieldError } from '@/lib/nursery/validate';
import { requireRateLimit } from '@/lib/security/route-guard';
import { createMural, listMurals, MAX_MURAL_IMAGE_BYTES } from '@/lib/murals/store';
import { MURAL_STATUSES, type MuralStatus } from '@/lib/murals/provenance';
import { muralCheckoutEnabled } from '@/lib/murals/checkout';
import { PUBLIC_READ_HEADERS } from '@/lib/hubs/hub-content';

/**
 * /api/murals
 * GET  — murals for sale (public; drafts are left out) and whether paying
 *        online is switched on (MURAL_CHECKOUT_ENABLED)
 * POST — a CFA admin adds a mural (multipart/form-data): title, artist,
 *        description?, sizeLabel?, priceKes, status?, recordIds (comma
 *        separated verified record ids), image? (JPEG/PNG/WebP, 3 MB)
 */
export async function GET() {
  const prisma = await getPrisma();
  // Public: the Oloolua website's Arts in Nature page reads this list too.
  if (!prisma) return NextResponse.json({ murals: [], checkout: muralCheckoutEnabled() }, { headers: PUBLIC_READ_HEADERS });
  try {
    return NextResponse.json({ murals: await listMurals(prisma), checkout: muralCheckoutEnabled() }, { headers: PUBLIC_READ_HEADERS });
  } catch (e) {
    console.error('[murals] list failed', e);
    return NextResponse.json({ murals: [], error: 'Could not load the murals.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const limited = await requireRateLimit(req, [{ scope: 'ip', limit: 20, windowMs: 60_000 }]);
  if (!limited.ok) return limited.response;
  if (Number(req.headers.get('content-length') ?? 0) > MAX_MURAL_IMAGE_BYTES + 64 * 1024) {
    return NextResponse.json({ error: 'The picture is larger than 3 MB.' }, { status: 413 });
  }
  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  try {
    const cfa = await getNurseryCfa(prisma);
    if (!cfa) return NextResponse.json({ error: 'The CFA is not set up yet.' }, { status: 503 });
    const session = await getSessionMember(prisma, req);
    if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });
    if (session.member.cfaId !== cfa.id || !canManageCatalogue(session.member)) {
      return NextResponse.json({ error: 'Only a CFA admin can add murals.' }, { status: 403 });
    }

    let form: FormData;
    try { form = await req.formData(); } catch { return NextResponse.json({ error: 'Send the mural as multipart/form-data.' }, { status: 400 }); }
    const str = (k: string, max: number) => String(form.get(k) ?? '').trim().slice(0, max);
    const statusRaw = str('status', 20) || 'available';
    const file = form.get('image');
    const mural = await createMural(prisma, cfa, session.member, {
      title: str('title', 120),
      artist: str('artist', 120),
      description: str('description', 2000) || null,
      sizeLabel: str('sizeLabel', 60) || null,
      priceKes: Number(str('priceKes', 12)),
      status: (MURAL_STATUSES as readonly string[]).includes(statusRaw) ? (statusRaw as MuralStatus) : 'available',
      recordIds: str('recordIds', 5000).split(',').map((s) => s.trim()).filter(Boolean),
      image: file instanceof File && file.size > 0 ? { bytes: new Uint8Array(await file.arrayBuffer()), declaredType: file.type } : null,
    });
    return NextResponse.json({ ok: true, mural }, { status: 201 });
  } catch (e) {
    if (e instanceof FieldError) return NextResponse.json({ error: e.message, field: e.field }, { status: 400 });
    const known = explainDbError(e);
    if (known) return NextResponse.json({ error: known.error }, { status: known.status });
    console.error('[murals] create failed', e);
    return NextResponse.json({ error: 'Could not save the mural. Please try again.' }, { status: 500 });
  }
}

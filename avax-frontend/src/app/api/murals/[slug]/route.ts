import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/db';
import { canManageCatalogue, getNurseryCfa, getSessionMember } from '@/lib/nursery/db';
import { getMuralDetail } from '@/lib/murals/store';
import { MURAL_STATUSES } from '@/lib/murals/provenance';

/**
 * GET   /api/murals/:slug — a mural and its provenance (public)
 * PATCH /api/murals/:slug { status } — a CFA admin marks it available,
 *       reserved, sold or draft
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const mural = await getMuralDetail(prisma, slug);
  if (!mural) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ mural });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });
  const cfa = await getNurseryCfa(prisma);
  const session = await getSessionMember(prisma, req);
  if (!session.ok) return NextResponse.json({ error: session.error }, { status: session.status });
  if (!cfa || session.member.cfaId !== cfa.id || !canManageCatalogue(session.member)) {
    return NextResponse.json({ error: 'Only a CFA admin can change a mural.' }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as { status?: string };
  if (!body.status || !(MURAL_STATUSES as readonly string[]).includes(body.status)) {
    return NextResponse.json({ error: 'status must be draft, available, reserved or sold.' }, { status: 400 });
  }
  const updated = await prisma.mural.updateMany({ where: { slug, cfaId: cfa.id }, data: { status: body.status } });
  if (updated.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

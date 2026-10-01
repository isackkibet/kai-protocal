import { NextResponse } from 'next/server';
import { canManageCatalogue, withMember } from '@/lib/nursery/db';
import { nurseryRead, nurseryWrite } from '@/lib/nursery/route';
import { metadata, text } from '@/lib/nursery/validate';

/**
 * /api/cfa/profile — the CFA itself (Kanuvari Tools & Agents PRD §4.1
 * get_cfa / update_cfa). GET is public; PATCH is for CFA admins.
 *
 * The CFA's name is how the app finds it (NURSERY_CFA_NAME), so it can't be
 * renamed here; location, description and metadata can.
 */
export async function GET() {
  return nurseryRead('cfa/profile', async ({ prisma, cfa }) => {
    const [members, nurseries, species, records] = await Promise.all([
      prisma.cfaMember.groupBy({ by: ['role'], where: { cfaId: cfa.id, status: 'active' }, _count: { _all: true } }),
      prisma.nurseryLocation.count({ where: { cfaId: cfa.id } }),
      prisma.species.count(),
      prisma.conservationRecord.groupBy({ by: ['verificationStatus'], where: { forestId: cfa.id }, _count: { _all: true } }),
    ]);
    return NextResponse.json({
      cfa: { id: cfa.id, name: cfa.name, location: cfa.location, description: cfa.description, metadata: cfa.metadata, createdAt: cfa.createdAt },
      counts: {
        members: Object.fromEntries(members.map((m) => [m.role, m._count._all])),
        nurseries,
        species,
        records: Object.fromEntries(records.map((r) => [r.verificationStatus, r._count._all])),
      },
    });
  }, { cfa: null });
}

export async function PATCH(req: Request) {
  return nurseryWrite(req, 'cfa/profile', async ({ prisma, cfa, member, body }) => {
    if (!canManageCatalogue(member)) return NextResponse.json({ error: 'Only a CFA admin can edit the CFA profile.' }, { status: 403 });
    if ('name' in body) return NextResponse.json({ error: 'The CFA name cannot be changed here.', field: 'name' }, { status: 400 });

    const data: { location?: string; description?: string | null; metadata?: object } = {};
    if ('location' in body) data.location = text(body, 'location', { required: true })!;
    if ('description' in body) data.description = text(body, 'description', { max: 4000 });
    if ('metadata' in body) data.metadata = { ...(cfa.metadata as object), ...metadata(body) };
    if (!Object.keys(data).length) return NextResponse.json({ error: 'Nothing to change.' }, { status: 400 });

    const updated = await withMember(prisma, member.id, (tx) => tx.cfa.update({ where: { id: cfa.id }, data }));
    return NextResponse.json({ ok: true, cfa: updated });
  });
}

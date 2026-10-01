import { NextResponse } from 'next/server';
import { canManageCatalogue, withMember } from '@/lib/nursery/db';
import { nurseryWrite } from '@/lib/nursery/route';
import { coordinate, text } from '@/lib/nursery/validate';

/**
 * PATCH /api/cfa/locations/:id { name?, description?, latitude?, longitude? }
 * — CFA admins edit a nursery (Kanuvari Tools & Agents PRD §4.2
 * update_nursery). Name stays unique within the CFA (database rule).
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: locationId } = await params;
  return nurseryWrite(req, 'cfa/locations/:id', async ({ prisma, cfa, member, body }) => {
    if (!canManageCatalogue(member)) return NextResponse.json({ error: 'Only a CFA admin can edit nurseries.' }, { status: 403 });
    const location = await prisma.nurseryLocation.findFirst({ where: { id: locationId, cfaId: cfa.id } });
    if (!location) return NextResponse.json({ error: 'Nursery not found.' }, { status: 404 });

    const data: { name?: string; description?: string | null; latitude?: number | null; longitude?: number | null } = {};
    if ('name' in body) data.name = text(body, 'name', { required: true })!;
    if ('description' in body) data.description = text(body, 'description', { max: 2000 });
    if ('latitude' in body) data.latitude = coordinate(body, 'latitude');
    if ('longitude' in body) data.longitude = coordinate(body, 'longitude');
    if (!Object.keys(data).length) return NextResponse.json({ error: 'Nothing to change.' }, { status: 400 });

    const updated = await withMember(prisma, member.id, (tx) => tx.nurseryLocation.update({ where: { id: location.id }, data }));
    return NextResponse.json({ ok: true, location: updated });
  });
}

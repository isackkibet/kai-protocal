import { NextResponse } from 'next/server';
import { canManageCatalogue, withMember } from '@/lib/nursery/db';
import { nurseryRead, nurseryWrite } from '@/lib/nursery/route';
import { coordinate, metadata, text } from '@/lib/nursery/validate';

/**
 * /api/cfa/locations — places inside the nursery, e.g. "Main Nursery",
 * "Section A" (Kanuvari nursery DB: `nursery_locations`). Names are unique
 * within the CFA; GPS is optional and range-checked. POST is for CFA admins.
 */
export async function GET() {
  return nurseryRead('cfa/locations', async ({ prisma, cfa }) => {
    const locations = await prisma.nurseryLocation.findMany({
      where: { cfaId: cfa.id },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, description: true, latitude: true, longitude: true },
    });
    return NextResponse.json({ locations });
  }, { locations: [] });
}

export async function POST(req: Request) {
  return nurseryWrite(req, 'cfa/locations', async ({ prisma, cfa, member, body }) => {
    if (!canManageCatalogue(member)) {
      return NextResponse.json({ error: 'Only a CFA admin can add nursery locations.' }, { status: 403 });
    }
    const name = text(body, 'name', { required: true })!;
    const description = text(body, 'description', { max: 2000 });
    const latitude = coordinate(body, 'latitude');
    const longitude = coordinate(body, 'longitude');
    const meta = metadata(body);

    const location = await withMember(prisma, member.id, (tx) =>
      tx.nurseryLocation.create({
        data: { cfaId: cfa.id, name, description, latitude, longitude, metadata: meta as object, createdBy: member.id },
      }),
    );
    return NextResponse.json({ ok: true, location });
  });
}

import { NextResponse } from 'next/server';
import { canManageCatalogue, withMember } from '@/lib/nursery/db';
import { nurseryRead, nurseryWrite } from '@/lib/nursery/route';
import { metadata, text } from '@/lib/nursery/validate';

/**
 * /api/cfa/species — the shared species catalogue (Kanuvari nursery DB:
 * `species`). Members pick species from this list instead of typing them.
 * GET is public; POST is for CFA admins, so the catalogue stays clean.
 */
export async function GET() {
  return nurseryRead('cfa/species', async ({ prisma }) => {
    const species = await prisma.species.findMany({
      orderBy: { commonName: 'asc' },
      select: { id: true, commonName: true, scientificName: true, localName: true, description: true },
    });
    return NextResponse.json({ species });
  }, { species: [] });
}

export async function POST(req: Request) {
  return nurseryWrite(req, 'cfa/species', async ({ prisma, member, body }) => {
    if (!canManageCatalogue(member)) {
      return NextResponse.json({ error: 'Only a CFA admin can add species to the catalogue.' }, { status: 403 });
    }
    const commonName = text(body, 'commonName', { required: true })!;
    const scientificName = text(body, 'scientificName', { required: true })!;
    const localName = text(body, 'localName');
    const description = text(body, 'description', { max: 2000 });
    const meta = metadata(body);

    const species = await withMember(prisma, member.id, (tx) =>
      tx.species.create({
        data: { commonName, scientificName, localName, description, metadata: meta as object, createdBy: member.id },
      }),
    );
    return NextResponse.json({ ok: true, species });
  });
}

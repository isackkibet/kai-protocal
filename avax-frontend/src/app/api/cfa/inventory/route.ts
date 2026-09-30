import { NextResponse } from 'next/server';
import { withMember } from '@/lib/nursery/db';
import { nurseryRead, nurseryWrite, toDate } from '@/lib/nursery/route';
import { count, day, id, metadata, text } from '@/lib/nursery/validate';

/**
 * /api/cfa/inventory — seedling batches, the core nursery table
 * (Kanuvari nursery DB: `seedling_inventory`). One row per batch.
 * GET lists batches; POST adds a new batch (status in_inventory).
 * Planting a batch is POST /api/cfa/planting.
 */
export async function GET() {
  return nurseryRead('cfa/inventory', async ({ prisma, cfa }) => {
    const batches = await prisma.seedlingBatch.findMany({
      where: { cfaId: cfa.id },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        species: { select: { commonName: true, scientificName: true } },
        location: { select: { name: true } },
      },
    });
    return NextResponse.json({ batches });
  }, { batches: [] });
}

export async function POST(req: Request) {
  return nurseryWrite(req, 'cfa/inventory', async ({ prisma, cfa, member, body }) => {
    const speciesId = id(body, 'speciesId', { required: true })!;
    const locationId = id(body, 'locationId', { required: true })!;
    const quantity = count(body, 'quantity', { required: true, min: 1 })!;
    const dateReceived = day(body, 'dateReceived');
    const source = text(body, 'source');
    const notes = text(body, 'notes', { max: 2000 });
    const meta = metadata(body);

    const [species, location] = await Promise.all([
      prisma.species.findUnique({ where: { id: speciesId }, select: { id: true } }),
      prisma.nurseryLocation.findUnique({ where: { id: locationId }, select: { cfaId: true } }),
    ]);
    if (!species) return NextResponse.json({ error: 'Unknown species.' }, { status: 404 });
    if (!location || location.cfaId !== cfa.id) return NextResponse.json({ error: 'Unknown nursery location.' }, { status: 404 });

    const batch = await withMember(prisma, member.id, (tx) =>
      tx.seedlingBatch.create({
        data: {
          cfaId: cfa.id,
          speciesId,
          locationId,
          quantity,
          status: 'in_inventory',
          dateReceived: toDate(dateReceived),
          source,
          notes,
          metadata: meta as object,
          createdBy: member.id,
          updatedBy: member.id,
        },
      }),
    );
    return NextResponse.json({ ok: true, batch });
  });
}

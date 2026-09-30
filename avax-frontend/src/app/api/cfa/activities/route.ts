import { NextResponse } from 'next/server';
import { withMember } from '@/lib/nursery/db';
import { nurseryRead, nurseryWrite, toDate } from '@/lib/nursery/route';
import { ACTIVITY_TYPES, count, day, id, metadata, oneOf, text } from '@/lib/nursery/validate';

/**
 * /api/cfa/activities — log of nursery work: watering, weeding, mulching,
 * pruning, pest control, transplanting, distribution, planting, other
 * (Kanuvari nursery DB: `nursery_activities`). performed_by is always the
 * signed-in member. Planting is also logged automatically by /api/cfa/planting.
 */
export async function GET() {
  return nurseryRead('cfa/activities', async ({ prisma, cfa }) => {
    const activities = await prisma.nurseryActivity.findMany({
      where: { cfaId: cfa.id },
      orderBy: [{ activityDate: 'desc' }, { createdAt: 'desc' }],
      take: 50,
      include: { location: { select: { name: true } } },
    });
    return NextResponse.json({ activities });
  }, { activities: [] });
}

export async function POST(req: Request) {
  return nurseryWrite(req, 'cfa/activities', async ({ prisma, cfa, member, body }) => {
    const activityType = oneOf(body, 'activityType', ACTIVITY_TYPES, { required: true })!;
    const locationId = id(body, 'locationId', { required: true })!;
    const inventoryId = id(body, 'inventoryId');
    const activityDate = day(body, 'activityDate') ?? new Date().toISOString().slice(0, 10);
    const quantityAffected = count(body, 'quantityAffected');
    const description = text(body, 'description', { max: 2000 });
    const meta = metadata(body);

    const location = await prisma.nurseryLocation.findUnique({ where: { id: locationId }, select: { cfaId: true } });
    if (!location || location.cfaId !== cfa.id) return NextResponse.json({ error: 'Unknown nursery location.' }, { status: 404 });
    if (inventoryId) {
      const batch = await prisma.seedlingBatch.findUnique({ where: { id: inventoryId }, select: { cfaId: true } });
      if (!batch || batch.cfaId !== cfa.id) return NextResponse.json({ error: 'Unknown batch.' }, { status: 404 });
    }

    const activity = await withMember(prisma, member.id, (tx) =>
      tx.nurseryActivity.create({
        data: {
          cfaId: cfa.id,
          locationId,
          inventoryId,
          activityType,
          activityDate: toDate(activityDate)!,
          quantityAffected,
          description,
          performedBy: member.id,
          metadata: meta as object,
        },
      }),
    );
    return NextResponse.json({ ok: true, activity });
  });
}

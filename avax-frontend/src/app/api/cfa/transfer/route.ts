import { NextResponse } from 'next/server';
import { inventoryPermissionError, withMember } from '@/lib/nursery/db';
import { nurseryWrite, toDate } from '@/lib/nursery/route';
import { FieldError, count, day, id, text } from '@/lib/nursery/validate';

/**
 * /api/cfa/transfer — move seedlings out of a nursery batch
 * (Kanuvari Tools & Agents PRD §4.4 record_seedling_transfer).
 *
 * POST { inventoryId, quantity, toLocationId?, destination?, transferDate?, notes? }
 *   - toLocationId: another nursery of this CFA. The seedlings become a new
 *     in_inventory batch there (metadata.transferred_from links them back).
 *   - destination: somewhere outside the CFA (a school, a partner). The
 *     seedlings are marked `transferred` and leave the nursery counts.
 * Exactly one of the two. Moving part of a batch splits it, so totals always
 * add up. Each transfer is logged as a nursery activity (kind: 'transfer').
 */
export async function POST(req: Request) {
  return nurseryWrite(req, 'cfa/transfer', async ({ prisma, cfa, member, body }) => {
    const notAllowed = inventoryPermissionError(member, cfa);
    if (notAllowed) return NextResponse.json({ error: notAllowed }, { status: 403 });
    const inventoryId = id(body, 'inventoryId', { required: true })!;
    const quantity = count(body, 'quantity', { required: true, min: 1 })!;
    const toLocationId = id(body, 'toLocationId');
    const destination = text(body, 'destination', { max: 255 });
    const transferDate = day(body, 'transferDate') ?? new Date().toISOString().slice(0, 10);
    const notes = text(body, 'notes', { max: 2000 });
    if (!toLocationId === !destination) {
      throw new FieldError('toLocationId', 'Choose either another nursery of this CFA or an outside destination.');
    }

    const result = await withMember(prisma, member.id, async (tx) => {
      // Lock the batch so a planting, loss and transfer can't take the same seedlings.
      await tx.$queryRaw`SELECT id FROM seedling_inventory WHERE id = ${inventoryId}::uuid FOR UPDATE`;
      const batch = await tx.seedlingBatch.findUnique({ where: { id: inventoryId }, include: { location: true } });
      if (!batch || batch.cfaId !== cfa.id) return { error: 'Unknown batch.', status: 404 } as const;
      if (batch.status !== 'in_inventory') return { error: `This batch is already ${batch.status.replace('_', ' ')}.`, status: 409 } as const;
      if (quantity > batch.quantity) return { error: `Only ${batch.quantity} seedlings are left in this batch.`, status: 400 } as const;

      let target: { id: string; name: string } | null = null;
      if (toLocationId) {
        if (toLocationId === batch.locationId) return { error: 'The seedlings are already in that nursery.', status: 400 } as const;
        target = await tx.nurseryLocation.findFirst({ where: { id: toLocationId, cfaId: cfa.id }, select: { id: true, name: true } });
        if (!target) return { error: 'Unknown destination nursery.', status: 404 } as const;
      }

      const whole = quantity === batch.quantity;
      const moveMeta = { transferred_from: { batch: batch.id, location: batch.location.name }, transfer_date: transferDate };
      let moved;
      if (target) {
        // Internal: the seedlings stay in inventory, now at the other nursery.
        if (whole) {
          moved = await tx.seedlingBatch.update({
            where: { id: batch.id },
            data: { locationId: target.id, metadata: { ...(batch.metadata as object), ...moveMeta }, updatedBy: member.id },
          });
        } else {
          await tx.seedlingBatch.update({ where: { id: batch.id }, data: { quantity: batch.quantity - quantity, updatedBy: member.id } });
          moved = await tx.seedlingBatch.create({
            data: {
              cfaId: cfa.id, speciesId: batch.speciesId, locationId: target.id, quantity, status: 'in_inventory',
              dateReceived: batch.dateReceived, source: batch.source, notes: notes ?? batch.notes,
              metadata: { ...(batch.metadata as object), split_from: batch.id, ...moveMeta },
              createdBy: member.id, updatedBy: member.id,
            },
          });
        }
      } else {
        // External: the seedlings leave the CFA's nurseries.
        const outMeta = { ...moveMeta, destination };
        if (whole) {
          moved = await tx.seedlingBatch.update({
            where: { id: batch.id },
            data: { status: 'transferred', metadata: { ...(batch.metadata as object), ...outMeta }, updatedBy: member.id },
          });
        } else {
          await tx.seedlingBatch.update({ where: { id: batch.id }, data: { quantity: batch.quantity - quantity, updatedBy: member.id } });
          moved = await tx.seedlingBatch.create({
            data: {
              cfaId: cfa.id, speciesId: batch.speciesId, locationId: batch.locationId, quantity, status: 'transferred',
              dateReceived: batch.dateReceived, source: batch.source, notes: notes ?? batch.notes,
              metadata: { ...(batch.metadata as object), split_from: batch.id, ...outMeta },
              createdBy: member.id, updatedBy: member.id,
            },
          });
        }
      }

      const to = target ? target.name : destination!;
      await tx.nurseryActivity.create({
        data: {
          cfaId: cfa.id,
          locationId: batch.locationId,
          inventoryId: moved.id,
          activityType: target ? 'other' : 'distribution',
          activityDate: toDate(transferDate)!,
          quantityAffected: quantity,
          description: `Transferred ${quantity} from ${batch.location.name} to ${to}${notes ? `: ${notes}` : ''}`,
          performedBy: member.id,
          metadata: { kind: 'transfer', to, internal: !!target },
        },
      });
      return { moved } as const;
    });

    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true, batch: result.moved });
  });
}

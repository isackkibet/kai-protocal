import { NextResponse } from 'next/server';
import { LOSS_REASONS } from '@/lib/nursery/agent-logic';
import { withMember } from '@/lib/nursery/db';
import { nurseryWrite, toDate } from '@/lib/nursery/route';
import { count, day, id, oneOf, text } from '@/lib/nursery/validate';

/**
 * /api/cfa/loss — record seedlings lost in the nursery (Kanuvari Tools &
 * Agents PRD §4.4 record_seedling_loss).
 *
 * POST { inventoryId, quantity, reason, lossDate?, notes? }. Losing the whole
 * batch marks it `dead`; losing part of it splits the batch (the rest stays
 * in_inventory) so totals always add up. Each loss is also logged as a
 * nursery activity with metadata { kind: 'loss', reason }, so it shows in the
 * inventory history. Losses after planting are recorded by survival checks
 * (/api/cfa/survival) instead.
 */
export async function POST(req: Request) {
  return nurseryWrite(req, 'cfa/loss', async ({ prisma, cfa, member, body }) => {
    const inventoryId = id(body, 'inventoryId', { required: true })!;
    const quantity = count(body, 'quantity', { required: true, min: 1 })!;
    const reason = oneOf(body, 'reason', LOSS_REASONS, { required: true })!;
    const lossDate = day(body, 'lossDate') ?? new Date().toISOString().slice(0, 10);
    const notes = text(body, 'notes', { max: 2000 });

    const result = await withMember(prisma, member.id, async (tx) => {
      // Lock the batch so a planting and a loss can't take the same seedlings.
      await tx.$queryRaw`SELECT id FROM seedling_inventory WHERE id = ${inventoryId}::uuid FOR UPDATE`;
      const batch = await tx.seedlingBatch.findUnique({ where: { id: inventoryId } });
      if (!batch || batch.cfaId !== cfa.id) return { error: 'Unknown batch.', status: 404 } as const;
      if (batch.status !== 'in_inventory') return { error: `This batch is already ${batch.status.replace('_', ' ')}.`, status: 409 } as const;
      if (quantity > batch.quantity) return { error: `Only ${batch.quantity} seedlings are left in this batch.`, status: 400 } as const;

      const lostMeta = { loss_reason: reason, loss_date: lossDate };
      let lost;
      if (quantity === batch.quantity) {
        lost = await tx.seedlingBatch.update({
          where: { id: batch.id },
          data: { status: 'dead', metadata: { ...(batch.metadata as object), ...lostMeta }, updatedBy: member.id },
        });
      } else {
        await tx.seedlingBatch.update({ where: { id: batch.id }, data: { quantity: batch.quantity - quantity, updatedBy: member.id } });
        lost = await tx.seedlingBatch.create({
          data: {
            cfaId: batch.cfaId,
            speciesId: batch.speciesId,
            locationId: batch.locationId,
            quantity,
            status: 'dead',
            dateReceived: batch.dateReceived,
            source: batch.source,
            notes: notes ?? batch.notes,
            metadata: { ...(batch.metadata as object), split_from: batch.id, ...lostMeta },
            createdBy: member.id,
            updatedBy: member.id,
          },
        });
      }

      await tx.nurseryActivity.create({
        data: {
          cfaId: batch.cfaId,
          locationId: batch.locationId,
          inventoryId: lost.id,
          activityType: 'other',
          activityDate: toDate(lossDate)!,
          quantityAffected: quantity,
          description: `Seedlings lost (${reason})${notes ? `: ${notes}` : ''}`,
          performedBy: member.id,
          metadata: { kind: 'loss', reason },
        },
      });
      return { lost } as const;
    });

    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true, batch: result.lost });
  });
}

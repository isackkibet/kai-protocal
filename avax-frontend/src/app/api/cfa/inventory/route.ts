import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { verifyPrivyUserId } from '@/lib/privy-server';
import { getOrCreateDefaultForest, getMemberForPrivyUser } from '@/lib/cfa';

/**
 * /api/cfa/inventory  —  GET / POST
 *
 * Day-to-day nursery stock movement (KAI Nuvari PRD §5 "Nursery inventory"):
 * seedlings ordered / planted / sold. Adjusts the species' quantity fields
 * so the CFA dashboard summary stays accurate without a separate reconcile
 * step.
 */
export async function GET() {
  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ entries: [], db: false });

  const forest = await getOrCreateDefaultForest();
  if (!forest) return NextResponse.json({ entries: [], db: false });

  const entries = await prisma.nurseryInventoryEntry.findMany({
    where: { forestId: forest.id },
    orderBy: { occurredAt: 'desc' },
    take: 50,
    include: { species: { select: { name: true } } },
  });

  return NextResponse.json({ entries });
}

const VALID_TYPES = new Set(['ORDERED', 'PLANTED', 'SOLD']);

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const activityType = String(body.activityType ?? '').toUpperCase();
  const quantity = Math.max(0, Number(body.quantity) || 0);
  const speciesId = body.speciesId ? String(body.speciesId).trim() : null;
  const note = body.note ? String(body.note).trim() : null;

  if (!VALID_TYPES.has(activityType)) {
    return NextResponse.json({ error: 'activityType must be ORDERED, PLANTED, or SOLD' }, { status: 400 });
  }
  if (quantity <= 0) {
    return NextResponse.json({ error: 'quantity must be positive' }, { status: 400 });
  }

  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });

  const forest = await getOrCreateDefaultForest();
  if (!forest) return NextResponse.json({ error: 'database unavailable' }, { status: 503 });

  let species = null;
  if (speciesId) {
    species = await prisma.treeSpecies.findUnique({ where: { id: speciesId } });
    if (!species || species.forestId !== forest.id) {
      return NextResponse.json({ error: 'Unknown species' }, { status: 404 });
    }
  }

  const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
  const member = await getMemberForPrivyUser(privyUserId);

  try {
    const entry = await prisma.nurseryInventoryEntry.create({
      data: {
        forestId: forest.id,
        speciesId,
        activityType: activityType as 'ORDERED' | 'PLANTED' | 'SOLD',
        quantity,
        note,
        submittedById: member?.id ?? null,
      },
    });

    if (species) {
      const delta: Record<string, number> = {
        ORDERED: quantity, // arrives into available stock
        SOLD: -quantity, // leaves available stock
        PLANTED: -quantity, // leaves available stock, tracked via quantityPlanted too
      };
      await prisma.treeSpecies.update({
        where: { id: species.id },
        data: {
          quantityAvailable: { increment: delta[activityType] },
          ...(activityType === 'SOLD' ? { quantityForSale: { decrement: Math.min(quantity, species.quantityForSale) } } : {}),
          ...(activityType === 'PLANTED' ? { quantityPlanted: { increment: quantity } } : {}),
        },
      });
    }

    return NextResponse.json({ ok: true, entry });
  } catch (e: any) {
    console.error('[cfa/inventory] failed', e);
    return NextResponse.json({ error: 'Failed to record inventory activity' }, { status: 500 });
  }
}

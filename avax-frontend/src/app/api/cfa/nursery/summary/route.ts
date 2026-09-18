import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { getOrCreateDefaultForest } from '@/lib/cfa';

/**
 * /api/cfa/nursery/summary  —  GET
 *
 * Powers the CFA dashboard summary cards (KAI Nuvari PRD §6): trees planted,
 * trees in nursery, species available/for sale, survival rate, plus a merged
 * recent-activity feed. Deliberately returns rollups, not raw tables — the
 * PRD is explicit the dashboard should not be "a huge database table."
 */
export async function GET() {
  const prisma = await getPrisma();
  if (!prisma) return NextResponse.json({ db: false });

  const forest = await getOrCreateDefaultForest();
  if (!forest) return NextResponse.json({ db: false });

  try {
    const [species, survivalRecords, inventoryEntries, plantingRecords] = await Promise.all([
    prisma.treeSpecies.findMany({ where: { forestId: forest.id } }),
    prisma.survivalRecord.findMany({ where: { forestId: forest.id }, select: { survivalRate: true } }),
    prisma.nurseryInventoryEntry.findMany({
      where: { forestId: forest.id },
      orderBy: { occurredAt: 'desc' },
      take: 8,
      include: { species: { select: { name: true } } },
    }),
    prisma.plantingRecord.findMany({
      where: { forestId: forest.id },
      orderBy: { plantedAt: 'desc' },
      take: 8,
      include: { species: { select: { name: true } } },
    }),
  ]);

  const treesPlanted = species.reduce((s, sp) => s + sp.quantityPlanted, 0);
  const treesInNursery = species.reduce((s, sp) => s + sp.quantityAvailable, 0);
  const speciesAvailable = species.filter((sp) => sp.quantityAvailable > 0).length;
  const speciesForSale = species.filter((sp) => sp.quantityForSale > 0).length;
  const survivalRate =
    survivalRecords.length > 0
      ? survivalRecords.reduce((s, r) => s + r.survivalRate, 0) / survivalRecords.length
      : null;

  const recentActivity = [
    ...inventoryEntries.map((e) => ({
      id: e.id,
      kind: 'inventory' as const,
      label: `${e.activityType === 'ORDERED' ? 'Ordered' : e.activityType === 'SOLD' ? 'Sold' : 'Planted'} ${e.quantity} ${e.species?.name ?? 'seedlings'}`,
      at: e.occurredAt,
    })),
    ...plantingRecords.map((r) => ({
      id: r.id,
      kind: 'planting' as const,
      label: `Planted ${r.numberPlanted} ${r.species.name}${r.activity ? ` — ${r.activity}` : ''}`,
      at: r.plantedAt,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 8);

  return NextResponse.json({
    forest: { id: forest.id, name: forest.name },
    stats: {
      treesPlanted,
      treesInNursery,
      speciesAvailable,
      speciesForSale,
      survivalRate,
    },
    recentActivity,
    species: species.map((sp) => ({
      id: sp.id,
      name: sp.name,
      quantityAvailable: sp.quantityAvailable,
      quantityPlanted: sp.quantityPlanted,
      quantityForSale: sp.quantityForSale,
    })),
  });
  } catch (e) {
    console.error('[cfa/nursery/summary] database unavailable', e);
    return NextResponse.json({ db: false });
  }
}

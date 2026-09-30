import { NextResponse } from 'next/server';
import { nurseryRead } from '@/lib/nursery/route';

/**
 * /api/cfa/nursery/summary — everything the nursery screen shows, in one call.
 *
 * Totals come from the database views (Kanuvari nursery DB §6):
 * v_nursery_dashboard and v_inventory_by_status, so the app never
 * re-implements the counting. Also returns the lists the forms pick from.
 */
interface DashboardRow {
  total_seedlings: bigint | number;
  species_count: bigint | number;
  in_nursery: bigint | number;
  planted: bigint | number;
  avg_survival_pct: string | null;
  activity_count: bigint | number;
}

const num = (v: bigint | number | string | null | undefined) => (v == null ? 0 : Number(v));

export async function GET() {
  return nurseryRead('cfa/nursery/summary', async ({ prisma, cfa }) => {
    const [dash] = await prisma.$queryRaw<DashboardRow[]>`
      SELECT total_seedlings, species_count, in_nursery, planted, avg_survival_pct::text, activity_count
      FROM v_nursery_dashboard WHERE cfa_id = ${cfa.id}::uuid`;
    const byStatus = await prisma.$queryRaw<{ status: string; total: bigint; batches: bigint }[]>`
      SELECT status::text, total, batches FROM v_inventory_by_status WHERE cfa_id = ${cfa.id}::uuid`;

    const [species, locations, batches, activities] = await Promise.all([
      prisma.species.findMany({ orderBy: { commonName: 'asc' }, select: { id: true, commonName: true, scientificName: true, localName: true } }),
      prisma.nurseryLocation.findMany({ where: { cfaId: cfa.id }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
      prisma.seedlingBatch.findMany({
        where: { cfaId: cfa.id },
        orderBy: { updatedAt: 'desc' },
        take: 100,
        select: {
          id: true, quantity: true, status: true, dateReceived: true, plantingDate: true, source: true,
          species: { select: { commonName: true } },
          location: { select: { name: true } },
        },
      }),
      prisma.nurseryActivity.findMany({
        where: { cfaId: cfa.id },
        orderBy: [{ activityDate: 'desc' }, { createdAt: 'desc' }],
        take: 10,
        select: { id: true, activityType: true, activityDate: true, quantityAffected: true, description: true, inventoryId: true },
      }),
    ]);

    // Planted batches link to their public MRV record.
    const plantedIds = batches.filter((b) => b.status === 'planted').map((b) => b.id);
    const records = plantedIds.length
      ? await prisma.conservationRecord.findMany({
          where: { sourceTable: 'seedling_inventory', sourceId: { in: plantedIds } },
          select: { id: true, sourceId: true },
        })
      : [];
    const verifyId = new Map(records.map((r) => [r.sourceId, r.id]));

    return NextResponse.json({
      cfa: { id: cfa.id, name: cfa.name },
      stats: {
        totalSeedlings: num(dash?.total_seedlings),
        inNursery: num(dash?.in_nursery),
        planted: num(dash?.planted),
        speciesCount: num(dash?.species_count),
        avgSurvivalPct: dash?.avg_survival_pct != null ? Number(dash.avg_survival_pct) : null,
        activityCount: num(dash?.activity_count),
      },
      byStatus: byStatus.map((r) => ({ status: r.status, total: num(r.total), batches: num(r.batches) })),
      species,
      locations,
      batches: batches.map((b) => ({ ...b, verifyId: verifyId.get(b.id) ?? null })),
      activities,
    });
  }, { stats: null, byStatus: [], species: [], locations: [], batches: [], activities: [] });
}

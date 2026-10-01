import type { Cfa, PrismaClient } from '@prisma/client';
import { buildPlantingData, createConservationRecord, PLANTING_SCHEMA, RecordError, SURVIVAL_SCHEMA, type SurvivalRecordData } from './records.ts';

/**
 * Turns an operational nursery row into its conservation (MRV) record —
 * PRD §4.9 submit_for_verification. Idempotent: a row that already has a
 * record returns that record (conservation_records is unique per source).
 *
 *   seedling_inventory (a planted batch) → planting/v1
 *   survival_observations                → survival/v1
 */
export const SUBMITTABLE_SOURCES = ['seedling_inventory', 'survival_observations'] as const;
export type SubmittableSource = (typeof SUBMITTABLE_SOURCES)[number];

export async function recordForSource(prisma: PrismaClient, cfa: Cfa, sourceTable: SubmittableSource, sourceId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(sourceId)) throw new RecordError('Unknown row.', 404);
  const forest = { id: cfa.id, name: cfa.name, locationRegion: cfa.location };

  if (sourceTable === 'seedling_inventory') {
    const batch = await prisma.seedlingBatch.findFirst({ where: { id: sourceId, cfaId: cfa.id }, include: { species: true } });
    if (!batch) throw new RecordError('Batch not found.', 404);
    if (batch.status !== 'planted' || !batch.plantingDate) throw new RecordError('Only planted batches become planting records.', 409);
    // The member who planted it: the one who created this planted row.
    const submitter = await prisma.cfaMember.findUnique({ where: { id: batch.createdBy }, select: { id: true, name: true } });
    return createConservationRecord(prisma, {
      forestId: cfa.id,
      recordType: 'PLANTING',
      schemaVersion: PLANTING_SCHEMA,
      data: buildPlantingData({
        forest,
        species: { id: batch.species.id, name: `${batch.species.commonName} (${batch.species.scientificName})` },
        quantity: batch.quantity,
        plantedAt: batch.plantingDate,
        activity: batch.notes,
        memberId: submitter?.id ?? null,
        submitterName: submitter?.name ?? null,
      }),
      sourceTable,
      sourceId,
      memberId: submitter?.id ?? null,
    });
  }

  const obs = await prisma.survivalObservation.findFirst({
    where: { id: sourceId, batch: { cfaId: cfa.id } },
    include: { batch: { include: { species: true } } },
  });
  if (!obs) throw new RecordError('Survival check not found.', 404);
  const submitter = await prisma.cfaMember.findUnique({ where: { id: obs.observedBy }, select: { id: true, name: true } });
  const data: SurvivalRecordData = {
    schema: SURVIVAL_SCHEMA,
    recordType: 'SURVIVAL_CHECK',
    cfa: { id: cfa.id, name: cfa.name, region: cfa.location },
    species: { id: obs.batch.species.id, name: `${obs.batch.species.commonName} (${obs.batch.species.scientificName})` },
    batchId: obs.inventoryId,
    initialQuantity: obs.initialQuantity,
    aliveQuantity: obs.aliveQuantity,
    deadQuantity: obs.deadQuantity,
    observedOn: obs.observationDate.toISOString().slice(0, 10),
    notes: obs.notes,
    submittedBy: { memberId: submitter?.id ?? null, name: submitter?.name ?? null },
  };
  return createConservationRecord(prisma, {
    forestId: cfa.id,
    recordType: 'SURVIVAL_CHECK',
    schemaVersion: SURVIVAL_SCHEMA,
    data,
    sourceTable,
    sourceId,
    memberId: submitter?.id ?? null,
  });
}

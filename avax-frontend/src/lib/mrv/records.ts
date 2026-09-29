import type { Prisma, PrismaClient } from '@prisma/client';
import { hashRecord } from './canonical.ts';

/**
 * Conservation record service (Canuvari MRV PRD §4.1–§4.2, §6.1).
 *
 * The only code allowed to write conservation_records / record_versions.
 * API routes pass record *data* in; statuses are never taken from a caller —
 * verificationStatus / anchorStatus change only in the trusted Guardian and
 * Avalanche integrations (not built yet, so every record stays SUBMITTED /
 * NOT_ANCHORED until they are).
 */

type Db = PrismaClient | Prisma.TransactionClient;

/** Records under review or verified are frozen: data under audit can't change. */
const CORRECTABLE_STATUSES = new Set(['SUBMITTED', 'REJECTED']);

// ── planting/v1 ───────────────────────────────────────────────────────────────

export const PLANTING_SCHEMA = 'planting/v1';

export interface PlantingRecordData {
  schema: typeof PLANTING_SCHEMA;
  recordType: 'PLANTING';
  cfa: { id: string; name: string; region: string };
  species: { id: string; name: string };
  quantity: number;
  /** ISO 8601 timestamp of when the planting happened. */
  plantedAt: string;
  activity: string | null;
  submittedBy: { memberId: string | null; name: string | null };
}

/**
 * Builds the canonical planting/v1 document from an operational planting
 * event. Only fields that describe the real-world event go in — no row
 * timestamps or ids that would change without the event changing.
 */
export function buildPlantingData(input: {
  forest: { id: string; name: string; locationRegion: string };
  species: { id: string; name: string };
  quantity: number;
  plantedAt: Date;
  activity: string | null;
  memberId: string | null;
  submitterName: string | null;
}): PlantingRecordData {
  return {
    schema: PLANTING_SCHEMA,
    recordType: 'PLANTING',
    cfa: { id: input.forest.id, name: input.forest.name, region: input.forest.locationRegion },
    species: { id: input.species.id, name: input.species.name },
    quantity: input.quantity,
    plantedAt: input.plantedAt.toISOString(),
    activity: input.activity,
    submittedBy: { memberId: input.memberId, name: input.submitterName },
  };
}

/** Returns a list of problems; empty means the document is valid planting/v1. */
export function validatePlantingData(data: unknown): string[] {
  const problems: string[] = [];
  const d = data as Partial<PlantingRecordData> | null;
  if (!d || typeof d !== 'object') return ['record data must be an object'];
  if (d.schema !== PLANTING_SCHEMA) problems.push(`schema must be "${PLANTING_SCHEMA}"`);
  if (d.recordType !== 'PLANTING') problems.push('recordType must be "PLANTING"');
  if (!d.cfa?.id || !d.cfa?.name) problems.push('cfa.id and cfa.name are required');
  if (!d.species?.id || !d.species?.name) problems.push('species.id and species.name are required');
  if (!Number.isInteger(d.quantity) || (d.quantity as number) <= 0) problems.push('quantity must be a positive whole number');
  if (typeof d.plantedAt !== 'string' || Number.isNaN(Date.parse(d.plantedAt))) problems.push('plantedAt must be an ISO 8601 date');
  if (d.activity !== null && typeof d.activity !== 'string') problems.push('activity must be a string or null');
  if (!d.submittedBy || typeof d.submittedBy !== 'object') problems.push('submittedBy is required');
  return problems;
}

const VALIDATORS: Record<string, (data: unknown) => string[]> = {
  [PLANTING_SCHEMA]: validatePlantingData,
};

function assertValid(schemaVersion: string, data: unknown) {
  const validate = VALIDATORS[schemaVersion];
  if (!validate) throw new RecordError(`Unknown record schema "${schemaVersion}"`, 400);
  const problems = validate(data);
  if (problems.length) throw new RecordError(`Invalid ${schemaVersion} record: ${problems.join('; ')}`, 400);
}

export class RecordError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// ── create / correct ──────────────────────────────────────────────────────────

/**
 * Creates a record and its version 1 atomically. Idempotent per source row:
 * a second call for the same (sourceTable, sourceId) returns the existing
 * record instead of creating a duplicate.
 */
export async function createConservationRecord(
  prisma: PrismaClient,
  input: {
    forestId: string;
    recordType: string;
    schemaVersion: string;
    methodology?: string | null;
    data: object;
    sourceTable?: string;
    sourceId?: string;
    memberId?: string | null;
  },
) {
  assertValid(input.schemaVersion, input.data);
  const dataHash = hashRecord(input.data);

  if (input.sourceTable && input.sourceId) {
    const existing = await prisma.conservationRecord.findUnique({
      where: { sourceTable_sourceId: { sourceTable: input.sourceTable, sourceId: input.sourceId } },
    });
    if (existing) return existing;
  }

  try {
    return await createRecordRow(prisma, input, dataHash);
  } catch (e) {
    // Two requests for the same source row raced past the lookup above.
    if ((e as { code?: string })?.code === 'P2002' && input.sourceTable && input.sourceId) {
      const existing = await prisma.conservationRecord.findUnique({
        where: { sourceTable_sourceId: { sourceTable: input.sourceTable, sourceId: input.sourceId } },
      });
      if (existing) return existing;
    }
    throw e;
  }
}

function createRecordRow(
  prisma: PrismaClient,
  input: Parameters<typeof createConservationRecord>[1],
  dataHash: string,
) {
  return prisma.conservationRecord.create({
    data: {
      forestId: input.forestId,
      recordType: input.recordType,
      schemaVersion: input.schemaVersion,
      methodology: input.methodology ?? null,
      currentVersion: 1,
      dataHash,
      sourceTable: input.sourceTable ?? null,
      sourceId: input.sourceId ?? null,
      submittedByMemberId: input.memberId ?? null,
      versions: {
        create: {
          version: 1,
          data: input.data as Prisma.InputJsonValue,
          dataHash,
          previousHash: null,
          reason: 'initial submission',
          createdByMemberId: input.memberId ?? null,
        },
      },
    },
  });
}

/**
 * Adds a correction as version n+1 — the original is never modified
 * (PRD §4.2). The new version's previousHash is version n's dataHash.
 * Refused once a record is under review or verified.
 */
export async function appendRecordVersion(
  prisma: PrismaClient,
  recordId: string,
  input: { data: object; reason: string; memberId?: string | null },
) {
  const reason = input.reason?.trim();
  if (!reason) throw new RecordError('A reason is required for every correction', 400);

  return prisma.$transaction(async (tx) => {
    // Row lock so two corrections can't both become version n+1.
    await tx.$queryRaw`SELECT id FROM conservation_records WHERE id = ${recordId} FOR UPDATE`;
    const record = await tx.conservationRecord.findUnique({ where: { id: recordId } });
    if (!record) throw new RecordError('Record not found', 404);
    if (!CORRECTABLE_STATUSES.has(record.verificationStatus)) {
      throw new RecordError(`Record is ${record.verificationStatus} and can no longer be corrected`, 409);
    }

    assertValid(record.schemaVersion, input.data);
    const dataHash = hashRecord(input.data);
    if (dataHash === record.dataHash) throw new RecordError('Correction is identical to the current version', 409);

    const version = record.currentVersion + 1;
    await tx.recordVersion.create({
      data: {
        recordId,
        version,
        data: input.data as Prisma.InputJsonValue,
        dataHash,
        previousHash: record.dataHash,
        reason,
        createdByMemberId: input.memberId ?? null,
      },
    });

    // A corrected record starts verification over; a REJECTED record
    // becomes SUBMITTED again with its fixed data.
    return tx.conservationRecord.update({
      where: { id: recordId },
      data: { currentVersion: version, dataHash, verificationStatus: 'SUBMITTED' },
    });
  });
}

// ── integrity check ───────────────────────────────────────────────────────────

export interface IntegrityReport {
  recordId: string;
  ok: boolean;
  versions: { version: number; storedHash: string; recomputedHash: string; hashMatches: boolean; chainMatches: boolean }[];
  problems: string[];
}

/**
 * Recomputes every version's SHA-256 from its stored JSON and walks the
 * previousHash chain (PRD §4.1 tamper detection). Any edit to stored data —
 * e.g. 500 seedlings changed to 900 — shows up as a hash mismatch.
 */
export async function checkRecordIntegrity(db: Db, recordId: string): Promise<IntegrityReport | null> {
  const record = await db.conservationRecord.findUnique({
    where: { id: recordId },
    include: { versions: { orderBy: { version: 'asc' } } },
  });
  if (!record) return null;

  const problems: string[] = [];
  const versions = record.versions.map((v, i) => {
    const recomputedHash = hashRecord(v.data);
    const hashMatches = recomputedHash === v.dataHash;
    const expectedPrevious = i === 0 ? null : record.versions[i - 1].dataHash;
    const chainMatches = v.previousHash === expectedPrevious;
    if (v.version !== i + 1) problems.push(`version numbers are not contiguous at position ${i + 1} (found v${v.version})`);
    if (!hashMatches) problems.push(`v${v.version}: stored data no longer matches its hash (tampered or corrupted)`);
    if (!chainMatches) problems.push(`v${v.version}: previousHash does not match v${v.version - 1}'s hash`);
    return { version: v.version, storedHash: v.dataHash, recomputedHash, hashMatches, chainMatches };
  });

  const latest = record.versions[record.versions.length - 1];
  if (!latest) problems.push('record has no versions');
  else {
    if (record.currentVersion !== latest.version) problems.push(`record says v${record.currentVersion} but the latest stored version is v${latest.version}`);
    if (record.dataHash !== latest.dataHash) problems.push('record fingerprint does not match its latest version');
  }

  return { recordId, ok: problems.length === 0, versions, problems };
}

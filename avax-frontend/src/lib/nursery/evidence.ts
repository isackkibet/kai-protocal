import { createHash } from 'node:crypto';
import type { Cfa, CfaMember, PrismaClient } from '@prisma/client';
import { withMember } from './db';
import { cleanFileName, evidenceProblems, sniffMime, type EvidenceEntity } from './evidence-rules';
import { DUPLICATE_BITS, hammingHex } from './quality-rules';
import { FieldError } from './validate';

/**
 * Evidence storage (Kanuvari Tools & Agents PRD §4.8 upload_evidence,
 * get_evidence, hash_evidence). Files are kept in Postgres (evidence_files),
 * separate from their audited metadata row (evidence). Every file gets a
 * SHA-256 fingerprint computed HERE from the bytes received — never taken
 * from the client — so anyone holding the file can prove it is the same one.
 */

export function sha256OfBytes(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/** The thing the evidence is attached to must exist in this CFA. */
async function entityBelongsToCfa(prisma: PrismaClient, cfaId: string, type: EvidenceEntity, id: string): Promise<boolean> {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  switch (type) {
    case 'seedling_inventory':
      return uuid && !!(await prisma.seedlingBatch.findFirst({ where: { id, cfaId }, select: { id: true } }));
    case 'nursery_activities':
      return uuid && !!(await prisma.nurseryActivity.findFirst({ where: { id, cfaId }, select: { id: true } }));
    case 'survival_observations':
      return uuid && !!(await prisma.survivalObservation.findFirst({ where: { id, batch: { cfaId } }, select: { id: true } }));
    case 'conservation_records':
      return !!(await prisma.conservationRecord.findFirst({ where: { id, forestId: cfaId }, select: { id: true } }));
  }
}

export async function saveEvidence(
  prisma: PrismaClient,
  cfa: Cfa,
  member: CfaMember,
  input: {
    entityType: EvidenceEntity; entityId: string; bytes: Uint8Array; declaredType: string; fileName: string; caption: string | null;
    /** 64-bit perceptual hash (16 hex) computed by the browser for photos. A hint for duplicate detection only. */
    dhash?: string | null;
  },
) {
  const fileName = cleanFileName(input.fileName);
  const problems = evidenceProblems({ bytes: input.bytes, declaredType: input.declaredType, fileName });
  if (problems.length) throw new FieldError('file', problems.join(' '));
  if (!(await entityBelongsToCfa(prisma, cfa.id, input.entityType, input.entityId))) {
    throw new FieldError('entityId', 'That record was not found in this CFA.');
  }

  const sha256 = sha256OfBytes(input.bytes);
  const duplicate = await prisma.evidence.findUnique({
    where: { entityType_entityId_sha256: { entityType: input.entityType, entityId: input.entityId, sha256 } },
    select: { id: true },
  });
  if (duplicate) throw new FieldError('file', 'This exact file is already attached here.');

  // Ecosystem PRD §4.12 detect_duplicate_images: a photo that looks like one
  // already attached elsewhere in this CFA (re-saved, resized) is flagged for
  // the verifier, not refused. The perceptual hash comes from the browser, so
  // it is only a hint; the SHA-256 above is the server's own.
  const dhash = input.dhash && /^[0-9a-f]{16}$/.test(input.dhash) ? input.dhash : null;
  let duplicateOf: { evidenceId: string; entityType: string; entityId: string; bitsDifferent: number } | null = null;
  if (dhash) {
    const recent = await prisma.$queryRaw<{ id: string; entity_type: string; entity_id: string; dhash: string }[]>`
      SELECT id::text, entity_type, entity_id, metadata->>'dhash' AS dhash FROM evidence
      WHERE cfa_id = ${cfa.id}::uuid AND metadata ? 'dhash' ORDER BY created_at DESC LIMIT 500`;
    for (const r of recent) {
      if (r.entity_type === input.entityType && r.entity_id === input.entityId) continue;
      const bits = hammingHex(dhash, r.dhash);
      if (bits <= DUPLICATE_BITS && (!duplicateOf || bits < duplicateOf.bitsDifferent)) {
        duplicateOf = { evidenceId: r.id, entityType: r.entity_type, entityId: r.entity_id, bitsDifferent: bits };
      }
    }
  }

  return withMember(prisma, member.id, async (tx) => {
    const evidence = await tx.evidence.create({
      data: {
        cfaId: cfa.id,
        entityType: input.entityType,
        entityId: input.entityId,
        fileName,
        mimeType: sniffMime(input.bytes)!,
        sizeBytes: input.bytes.length,
        sha256,
        caption: input.caption,
        metadata: { ...(dhash ? { dhash } : {}), ...(duplicateOf ? { duplicateOf } : {}) },
        createdBy: member.id,
      },
    });
    await tx.evidenceFile.create({ data: { evidenceId: evidence.id, content: Buffer.from(input.bytes) } });
    return evidence;
  });
}

export async function listEvidence(prisma: PrismaClient, cfaId: string, entityType: EvidenceEntity, entityId: string) {
  const rows = await prisma.evidence.findMany({
    where: { cfaId, entityType, entityId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, fileName: true, mimeType: true, sizeBytes: true, sha256: true, caption: true, createdAt: true, createdBy: true },
  });
  return rows.map((r) => ({ ...r, url: `/api/cfa/evidence/${r.id}` }));
}

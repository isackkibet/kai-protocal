import type { CfaMember, PrismaClient } from '@prisma/client';
import { checkRecordIntegrity, RecordError } from './records.ts';

/**
 * Human verification of conservation records (Kanuvari Tools & Agents PRD
 * §4.9, §6.4, §5.3). A CFA verifier (or admin) reviews a submitted record
 * and approves it, rejects it, or sends it back for correction. Every
 * decision is stored in verification_reviews (append-only) with the exact
 * version and fingerprint that was reviewed.
 *
 * Lifecycle:
 *   SUBMITTED → UNDER_REVIEW → VERIFIED | REJECTED | CORRECTION_REQUIRED
 *   CORRECTION_REQUIRED / REJECTED → (submitter adds a corrected version) → SUBMITTED
 *   VERIFIED → anchored on Avalanche (lib/mrv/anchor.ts)
 */

export const DECISIONS = ['UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'CORRECTION_REQUIRED'] as const;
export type Decision = (typeof DECISIONS)[number];

/** Statuses a record is waiting in for a verifier. */
export const QUEUE_STATUSES = ['SUBMITTED', 'UNDER_REVIEW'] as const;

/**
 * Whether `decision` may be applied to a record in `current` status.
 * Returns an explanation when it may not. Pure, for tests.
 */
export function transitionError(current: string, decision: Decision): string | null {
  if (decision === 'UNDER_REVIEW') {
    return current === 'SUBMITTED' ? null : `Only a submitted record can be taken under review (this one is ${current}).`;
  }
  if (current === 'SUBMITTED' || current === 'UNDER_REVIEW') return null;
  return `This record is ${current}; it is not waiting for a decision.`;
}

/**
 * Who may decide: an active verifier or admin of the record's CFA, and never
 * on a record they submitted themselves (no self-verification). Pure.
 */
export function reviewerError(
  member: Pick<CfaMember, 'id' | 'role' | 'status' | 'cfaId'> | null,
  record: { forestId: string; submittedByMemberId: string | null },
): string | null {
  if (!member) return 'Only CFA members can review records.';
  if (member.status !== 'active') return `Your CFA membership is ${member.status}.`;
  if (member.cfaId !== record.forestId) return 'This record belongs to another CFA.';
  if (member.role !== 'verifier' && member.role !== 'admin') return 'Only a CFA verifier or admin can review records.';
  if (record.submittedByMemberId && record.submittedByMemberId === member.id) {
    return 'You submitted this record, so someone else must verify it.';
  }
  return null;
}

/**
 * Applies one decision atomically: row-locks the record, checks the
 * transition, refuses to verify data whose fingerprint no longer matches,
 * stores the review and updates the status.
 *
 * `expectedVersion` (what the verifier was looking at) stops a decision on a
 * record that was corrected in the meantime.
 */
export async function reviewRecord(
  prisma: PrismaClient,
  input: { recordId: string; member: CfaMember; decision: Decision; reason?: string | null; expectedVersion?: number | null },
) {
  const reason = input.reason?.trim() || null;
  if ((input.decision === 'REJECTED' || input.decision === 'CORRECTION_REQUIRED') && !reason) {
    throw new RecordError('Say why: a rejection or correction request needs a reason.', 400);
  }

  // Integrity is checked before taking the lock (it reads every version).
  if (input.decision === 'VERIFIED') {
    const integrity = await checkRecordIntegrity(prisma, input.recordId);
    if (!integrity) throw new RecordError('Record not found', 404);
    if (!integrity.ok) {
      throw new RecordError(`This record failed its integrity check and cannot be verified: ${integrity.problems.join('; ')}`, 409);
    }
  }

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM conservation_records WHERE id = ${input.recordId} FOR UPDATE`;
    const record = await tx.conservationRecord.findUnique({ where: { id: input.recordId } });
    if (!record) throw new RecordError('Record not found', 404);

    const who = reviewerError(input.member, record);
    if (who) throw new RecordError(who, 403);
    const how = transitionError(record.verificationStatus, input.decision);
    if (how) throw new RecordError(how, 409);
    if (input.expectedVersion != null && input.expectedVersion !== record.currentVersion) {
      throw new RecordError(`The record changed while you were reviewing it (now version ${record.currentVersion}). Reload and review again.`, 409);
    }

    const review = await tx.verificationReview.create({
      data: {
        recordId: record.id,
        recordVersion: record.currentVersion,
        dataHash: record.dataHash,
        decision: input.decision,
        reason,
        reviewerId: input.member.id,
      },
    });
    const updated = await tx.conservationRecord.update({
      where: { id: record.id },
      data: { verificationStatus: input.decision },
    });
    return { record: updated, review };
  });
}

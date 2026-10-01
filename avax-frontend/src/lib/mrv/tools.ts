import { fail, matchSpecies, ok, speciesLabel, type NurseryPlan, type ToolResult } from '@/lib/nursery/agent-logic';
import { actingMember, context, isFail } from '@/lib/nursery/tools';
import { listAnchorBatches, verifyRecordAnchor } from './anchor';
import { checkRecordIntegrity } from './records';
import { QUEUE_STATUSES, reviewerError, transitionError, type Decision } from './verification';

/**
 * Verification Agent tools (Kanuvari Tools & Agents PRD §5.3, §4.8-§4.11).
 * The agent helps a human verifier: it lists the queue, lays out a record
 * (data, versions, integrity, evidence, history, inventory context, unusual
 * numbers) and drafts a decision. The decision itself is only taken when the
 * verifier presses Confirm — the agent never approves anything.
 */

/** PRD §4.9 get_verification_queue */
export async function getVerificationQueue(privyUserId: string | null) {
  const tool = 'get_verification_queue';
  const c = await context(tool);
  if (isFail(c)) return c;
  const member = await actingMember(tool, c.prisma, c.cfa, privyUserId);
  if (isFail(member)) return member;
  const canReview = member.role === 'verifier' || member.role === 'admin';
  const [queue, mine] = await Promise.all([
    canReview
      ? c.prisma.conservationRecord.findMany({
          where: { forestId: c.cfa.id, verificationStatus: { in: [...QUEUE_STATUSES] }, NOT: { submittedByMemberId: member.id } },
          orderBy: { createdAt: 'asc' }, take: 25,
          select: { id: true, recordType: true, verificationStatus: true, createdAt: true, versions: { orderBy: { version: 'desc' }, take: 1, select: { data: true } } },
        })
      : Promise.resolve([]),
    c.prisma.conservationRecord.findMany({
      where: { forestId: c.cfa.id, submittedByMemberId: member.id, verificationStatus: { in: ['CORRECTION_REQUIRED', 'REJECTED'] } },
      select: { id: true, recordType: true, verificationStatus: true },
    }),
  ]);
  const brief = (d: unknown) => {
    const x = (d ?? {}) as Record<string, unknown>;
    const species = (x.species as { name?: string } | undefined)?.name;
    return x.recordType === 'SURVIVAL_CHECK'
      ? `${x.aliveQuantity}/${x.initialQuantity} ${species} alive on ${x.observedOn}`
      : `${x.quantity} ${species} planted ${String(x.plantedAt ?? '').slice(0, 10)}`;
  };
  return ok(tool, {
    canReview,
    waiting: queue.map((r) => ({ recordId: r.id, type: r.recordType, status: r.verificationStatus, submitted: r.createdAt.toISOString().slice(0, 10), what: brief(r.versions[0]?.data) })),
    myRecordsNeedingAction: mine,
    note: canReview ? 'Your own submissions are not in your queue (no self-verification).' : 'Only CFA verifiers and admins review records.',
  });
}

/**
 * PRD §4.9 review_record: everything a verifier needs, plus deterministic
 * flags (PRD §5.3 "highlight unusual quantities"). Flags are hints for the
 * human, not a decision.
 */
export async function reviewRecordDetails(recordId: string) {
  const tool = 'review_record';
  const c = await context(tool);
  if (isFail(c)) return c;
  const record = await c.prisma.conservationRecord.findFirst({
    where: { id: recordId.trim(), forestId: c.cfa.id },
    include: { versions: { orderBy: { version: 'asc' } }, reviews: { orderBy: { createdAt: 'asc' } } },
  });
  if (!record) return fail(tool, 'NOT_FOUND', 'No record with that id in this CFA.');
  const latest = record.versions[record.versions.length - 1];
  const data = (latest?.data ?? {}) as Record<string, unknown>;
  const [integrity, evidence] = await Promise.all([
    checkRecordIntegrity(c.prisma, record.id),
    c.prisma.evidence.findMany({
      where: { cfaId: c.cfa.id, OR: [{ entityType: 'conservation_records', entityId: record.id }, ...(record.sourceTable && record.sourceId ? [{ entityType: record.sourceTable, entityId: record.sourceId }] : [])] },
      select: { fileName: true, mimeType: true, sha256: true, caption: true },
    }),
  ]);

  const flags: string[] = [];
  if (!integrity?.ok) flags.push(`INTEGRITY FAILED: ${integrity?.problems.join('; ')}`);
  if (!evidence.length) flags.push('No photo or document is attached.');
  if (record.versions.length > 1) flags.push(`Corrected ${record.versions.length - 1} time(s); compare the versions.`);
  if (record.recordType === 'PLANTING') {
    const qty = Number(data.quantity);
    const speciesId = (data.species as { id?: string } | undefined)?.id;
    if (speciesId) {
      const typical = await c.prisma.seedlingBatch.aggregate({ where: { cfaId: c.cfa.id, speciesId, status: 'planted' }, _avg: { quantity: true }, _count: true });
      const avg = typical._avg.quantity ?? 0;
      if (typical._count > 2 && avg > 0 && qty > avg * 3) flags.push(`Quantity ${qty} is over 3x the usual planting of this species (average ${Math.round(avg)}).`);
    }
    if (Date.parse(String(data.plantedAt)) > Date.now() + 86_400_000) flags.push('Planting date is in the future.');
  }
  if (record.recordType === 'SURVIVAL_CHECK') {
    const initial = Number(data.initialQuantity), alive = Number(data.aliveQuantity), dead = Number(data.deadQuantity);
    if (alive + dead < initial) flags.push(`${initial - alive - dead} seedlings are neither alive nor dead in this check (unaccounted).`);
    if (initial > 0 && alive / initial < 0.5) flags.push(`Low survival: ${Math.round((alive / initial) * 100)}%.`);
  }

  const reviewers = new Map((await c.prisma.cfaMember.findMany({ where: { id: { in: record.reviews.map((r) => r.reviewerId) } }, select: { id: true, name: true } })).map((m) => [m.id, m.name]));
  return ok(tool, {
    recordId: record.id, type: record.recordType, status: record.verificationStatus, anchor: record.anchorStatus,
    currentVersion: record.currentVersion, fingerprint: record.dataHash,
    data,
    versions: record.versions.map((v) => ({ version: v.version, reason: v.reason, at: v.createdAt.toISOString().slice(0, 10) })),
    integrityOk: integrity?.ok ?? false,
    evidence,
    history: record.reviews.map((r) => ({ decision: r.decision, reason: r.reason, by: reviewers.get(r.reviewerId) ?? 'verifier', at: r.createdAt.toISOString().slice(0, 10) })),
    flags,
    page: `/verify/${record.id}`,
    note: 'Flags are hints. The human verifier decides.',
  });
}

/** PRD §4.9 approve_record / reject_record / request_correction (+ start review). */
export async function prepareDecision(
  privyUserId: string | null,
  input: { recordId: string; decision: Decision; reason?: string },
): Promise<ToolResult<NurseryPlan>> {
  const tool = input.decision === 'VERIFIED' ? 'approve_record' : input.decision === 'REJECTED' ? 'reject_record'
    : input.decision === 'CORRECTION_REQUIRED' ? 'request_correction' : 'start_review';
  const c = await context(tool);
  if (isFail(c)) return c;
  const member = await actingMember(tool, c.prisma, c.cfa, privyUserId);
  if (isFail(member)) return member;
  const record = await c.prisma.conservationRecord.findFirst({ where: { id: input.recordId.trim(), forestId: c.cfa.id } });
  if (!record) return fail(tool, 'NOT_FOUND', 'No record with that id in this CFA.');
  const who = reviewerError(member, record);
  if (who) return fail(tool, 'FORBIDDEN', who);
  const how = transitionError(record.verificationStatus, input.decision);
  if (how) return fail(tool, 'CONFLICT', how);
  const reason = input.reason?.trim();
  if ((input.decision === 'REJECTED' || input.decision === 'CORRECTION_REQUIRED') && !reason) {
    return fail(tool, 'MISSING_INFORMATION', 'Ask the verifier for the reason; it is shown to the submitter.');
  }
  if (input.decision === 'VERIFIED') {
    const integrity = await checkRecordIntegrity(c.prisma, record.id);
    if (!integrity?.ok) return fail(tool, 'VALIDATION_FAILED', 'This record failed its integrity check and cannot be approved.');
  }
  const verb = { VERIFIED: 'Approve (VERIFIED)', REJECTED: 'Reject', CORRECTION_REQUIRED: 'Send back for correction', UNDER_REVIEW: 'Start reviewing' }[input.decision];
  return ok(tool, {
    kind: 'nursery', name: tool, method: 'POST', endpoint: `/api/mrv/records/${record.id}/review`,
    body: { decision: input.decision, reason: reason ?? null, expectedVersion: record.currentVersion },
    summary: `${verb} ${record.recordType.toLowerCase().replace('_', ' ')} record ${record.id} (version ${record.currentVersion})${reason ? ` — "${reason.slice(0, 200)}"` : ''}.`,
    assumptions: [],
  });
}

/** PRD §4.9 submit_for_verification for a planted batch / survival check that has no record yet. */
export async function prepareSubmitForVerification(
  privyUserId: string | null, input: { kind: 'planting' | 'survival'; species: string },
): Promise<ToolResult<NurseryPlan>> {
  const tool = 'submit_for_verification';
  const c = await context(tool);
  if (isFail(c)) return c;
  const member = await actingMember(tool, c.prisma, c.cfa, privyUserId);
  if (isFail(member)) return member;
  const catalogue = await c.prisma.species.findMany();
  const m = matchSpecies(input.species, catalogue);
  if (m.status !== 'exact') return fail(tool, 'INVALID_SPECIES', `Which species? "${input.species}" is not an exact catalogue match.`, catalogue.map(speciesLabel));
  const sourceTable = input.kind === 'planting' ? 'seedling_inventory' : 'survival_observations';
  const rows = input.kind === 'planting'
    ? (await c.prisma.seedlingBatch.findMany({ where: { cfaId: c.cfa.id, speciesId: m.species.id, status: 'planted' }, orderBy: { plantingDate: 'desc' }, take: 20 }))
        .map((b) => ({ id: b.id, label: `${b.quantity} planted ${b.plantingDate?.toISOString().slice(0, 10)}` }))
    : (await c.prisma.survivalObservation.findMany({ where: { batch: { cfaId: c.cfa.id, speciesId: m.species.id } }, orderBy: { observationDate: 'desc' }, take: 20 }))
        .map((o) => ({ id: o.id, label: `${o.aliveQuantity}/${o.initialQuantity} alive on ${o.observationDate.toISOString().slice(0, 10)}` }));
  const existing = new Set((await c.prisma.conservationRecord.findMany({ where: { sourceTable, sourceId: { in: rows.map((r) => r.id) } }, select: { sourceId: true } })).map((r) => r.sourceId));
  const pending = rows.filter((r) => !existing.has(r.id));
  if (!pending.length) return fail(tool, 'NOT_FOUND', `Every ${input.kind} of ${m.species.commonName} is already submitted (or there are none).`);
  if (pending.length > 1) return fail(tool, 'MISSING_INFORMATION', 'Several are not submitted yet; submit them from the verification desk (/mrv), or say which one.', pending.map((p) => p.label));
  return ok(tool, {
    kind: 'nursery', name: tool, method: 'POST', endpoint: '/api/mrv/submit',
    body: { sourceTable, sourceId: pending[0].id },
    summary: `Submit ${m.species.commonName} ${input.kind} (${pending[0].label}) for verification.`,
    assumptions: [],
  });
}

/** PRD §4.8 get_evidence (names and SHA-256 fingerprints, not the files). */
export async function getEvidenceForRecord(recordId: string) {
  const tool = 'get_evidence';
  const c = await context(tool);
  if (isFail(c)) return c;
  const record = await c.prisma.conservationRecord.findFirst({ where: { id: recordId.trim(), forestId: c.cfa.id }, select: { id: true, sourceTable: true, sourceId: true } });
  if (!record) return fail(tool, 'NOT_FOUND', 'No record with that id in this CFA.');
  const evidence = await c.prisma.evidence.findMany({
    where: { cfaId: c.cfa.id, OR: [{ entityType: 'conservation_records', entityId: record.id }, ...(record.sourceTable && record.sourceId ? [{ entityType: record.sourceTable, entityId: record.sourceId }] : [])] },
    select: { fileName: true, mimeType: true, sizeBytes: true, sha256: true, caption: true, createdAt: true },
  });
  return ok(tool, { evidence, note: evidence.length ? 'sha256 is the file fingerprint (hash_evidence).' : 'Nothing attached. Photos are added with the "Photo" button on /nursery or /mrv.' });
}

/** PRD §4.11 anchoring status + verify_onchain_anchor. */
export async function getAnchoring(recordId?: string) {
  const tool = recordId ? 'verify_onchain_anchor' : 'get_anchor_batches';
  const c = await context(tool);
  if (isFail(c)) return c;
  if (recordId?.trim()) {
    const check = await verifyRecordAnchor(c.prisma, recordId.trim());
    if (!check) return fail(tool, 'NOT_FOUND', 'No record with that id.');
    return ok(tool, check);
  }
  const list = await listAnchorBatches(c.prisma, c.cfa.id);
  return ok(tool, {
    verifiedWaiting: list.verifiedWaiting,
    batches: list.batches.map((b) => ({ id: b.id, status: b.status, recordCount: b.recordCount, merkleRoot: b.merkleRoot, txHash: b.txHash, anchoredAt: b.anchoredAt })),
    note: 'Anchoring is done on /mrv by an admin or verifier, who signs the Fuji transaction in their own wallet.',
  });
}

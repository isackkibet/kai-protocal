import { checkRecordIntegrity } from '@/lib/mrv/records';
import { canReadAudit } from './db';
import { fail, ok } from './agent-logic';
import { integrityScore, volumeOutliers, type Anomaly } from './compliance-rules';
import { getQualityMetrics, reconcileInventory } from './quality';
import { actingMember, context, isFail } from './tools';

/**
 * Audit & Compliance Agent tools (Ecosystem PRD v1.1 §5.8): read-only.
 * They report what the data and the audit log show, flag anomalies for a
 * person to review, and never change a record.
 */

const STALE_DAYS = 14;

async function auditor(tool: string, privyUserId: string | null) {
  const c = await context(tool);
  if (isFail(c)) return c;
  const member = await actingMember(tool, c.prisma, c.cfa, privyUserId);
  if (isFail(member)) return member;
  if (!canReadAudit(member)) return fail(tool, 'FORBIDDEN', 'Only CFA admins, auditors and verifiers can run compliance checks.');
  return c;
}

/** PRD §5.8: unusual volume, inventory swings, stale unverified records, and more. */
export async function detectAnomalies(privyUserId: string | null) {
  const tool = 'detect_anomalies';
  const c = await auditor(tool, privyUserId);
  if (isFail(c)) return c;
  const anomalies: Anomaly[] = [];
  const since = new Date(Date.now() - STALE_DAYS * 86_400_000);

  const stale = await c.prisma.conservationRecord.findMany({
    where: { forestId: c.cfa.id, verificationStatus: { in: ['SUBMITTED', 'UNDER_REVIEW'] }, createdAt: { lt: since } },
    select: { id: true }, take: 50,
  });
  if (stale.length) anomalies.push({ kind: 'stale_unverified', severity: 'medium', count: stale.length, detail: `Waiting for verification for more than ${STALE_DAYS} days.`, examples: stale.slice(0, 5).map((r) => r.id) });

  const records = await c.prisma.conservationRecord.findMany({ where: { forestId: c.cfa.id }, select: { id: true }, take: 300, orderBy: { createdAt: 'desc' } });
  const broken: string[] = [];
  for (const r of records) {
    const check = await checkRecordIntegrity(c.prisma, r.id);
    if (check && !check.ok) broken.push(r.id);
  }
  if (broken.length) anomalies.push({ kind: 'integrity_failure', severity: 'high', count: broken.length, detail: 'Stored data no longer matches its SHA-256 fingerprint (possible tampering).', examples: broken.slice(0, 5) });

  // Seedlings are only ever split, planted, lost or moved; a count that goes UP was edited.
  const increases = await c.prisma.$queryRaw<{ entity_id: string; old_q: number; new_q: number; at: Date }[]>`
    SELECT entity_id::text, (old_data->>'quantity')::int AS old_q, (new_data->>'quantity')::int AS new_q, created_at AS at
    FROM audit_logs WHERE entity_type = 'seedling_inventory' AND action = 'UPDATE'
      AND new_data->>'cfa_id' = ${c.cfa.id} AND (new_data->>'quantity')::int > (old_data->>'quantity')::int
    ORDER BY created_at DESC LIMIT 50`;
  if (increases.length) anomalies.push({ kind: 'inventory_increase', severity: 'high', count: increases.length, detail: 'A batch count went up after it was recorded. Normal work never increases a batch.', examples: increases.slice(0, 5).map((x) => `${x.entity_id}: ${x.old_q} → ${x.new_q}`) });

  const recon = await reconcileInventory();
  if (recon.success && !recon.data!.isReconciled) anomalies.push({ kind: 'inventory_not_reconciled', severity: 'high', count: recon.data!.discrepancies.length, detail: 'Batches do not add up to what was first recorded.', examples: recon.data!.discrepancies.slice(0, 5).map((d) => `${d.batchId}: ${d.difference > 0 ? '+' : ''}${d.difference}`) });

  const perDay = await c.prisma.$queryRaw<{ day: string; count: number }[]>`
    SELECT to_char(created_at, 'YYYY-MM-DD') AS day, COUNT(*)::int AS count FROM audit_logs
    WHERE created_at > now() - interval '90 days' GROUP BY 1 ORDER BY 1`;
  const spikes = volumeOutliers(perDay);
  if (spikes.length) anomalies.push({ kind: 'unusual_volume', severity: 'low', count: spikes.length, detail: 'Days with far more changes than usual (bulk entry, or something to check).', examples: spikes.slice(0, 5).map((d) => `${d.day}: ${d.count} changes`) });

  const stuck = await c.prisma.anchorBatch.findMany({ where: { cfaId: c.cfa.id, status: 'PENDING', createdAt: { lt: new Date(Date.now() - 86_400_000) } }, select: { id: true } });
  if (stuck.length) anomalies.push({ kind: 'anchor_pending', severity: 'low', count: stuck.length, detail: 'An anchor batch has waited more than a day for its wallet transaction.', examples: stuck.map((b) => b.id) });

  const [{ n: dupPhotos }] = await c.prisma.$queryRaw<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM evidence WHERE cfa_id = ${c.cfa.id}::uuid AND metadata ? 'duplicateOf'`;
  if (dupPhotos) anomalies.push({ kind: 'reused_photos', severity: 'medium', count: dupPhotos, detail: 'Photos that look like ones attached to other records.', examples: [] });

  return ok(tool, { anomalies, checked: { records: records.length, auditDays: perDay.length }, note: 'These are flags for a person to review, not findings of wrongdoing.' });
}

/** PRD §5.8 compliance report: totals, verified/anchored %, anomalies, integrity score. */
export async function generateComplianceReport(privyUserId: string | null, filters: { from?: string; to?: string } = {}) {
  const tool = 'generate_compliance_report';
  const c = await auditor(tool, privyUserId);
  if (isFail(c)) return c;
  const [quality, anomalies] = await Promise.all([getQualityMetrics(filters), detectAnomalies(privyUserId)]);
  if (!quality.success) return { ...quality, metadata: { ...quality.metadata, tool } };
  if (!anomalies.success) return { ...anomalies, metadata: { ...anomalies.metadata, tool } };
  const q = quality.data!;
  const a = anomalies.data!.anomalies;
  const integrityFailures = a.find((x) => x.kind === 'integrity_failure')?.count ?? 0;
  const { score, breakdown } = integrityScore({
    records: q.totalSubmissions, integrityFailures, verifiedPct: q.verifiedPct, anchoredPct: q.anchoredPct,
    evidencePct: q.withPhotoEvidencePct, reconciled: q.inventoryReconciled, anomalies: a,
  });
  const credentials = await c.prisma.verifiableCredential.count({ where: { cfaId: c.cfa.id, status: 'active' } });
  return ok(tool, {
    cfa: c.cfa.name, period: q.period, generatedAt: new Date().toISOString(),
    totals: { records: q.totalSubmissions, waitingForReview: q.waitingForReview, sentBack: q.sentBackForCorrection, activeCredentials: credentials },
    verifiedPct: q.verifiedPct, anchoredPct: q.anchoredPct, withEvidencePct: q.withPhotoEvidencePct,
    dataIntegrityScore: score, scoreBreakdown: breakdown, anomalies: a,
    exports: 'CSV / JSON: Manage the CFA → Audit log. Each record\'s proof: /verify/<record id>.',
  });
}

/** PRD §5.8 "confirm chain of custody for a figure": every step behind one record, in time order. */
export async function chainOfCustody(privyUserId: string | null, recordId: string) {
  const tool = 'chain_of_custody';
  const c = await auditor(tool, privyUserId);
  if (isFail(c)) return c;
  const record = await c.prisma.conservationRecord.findFirst({
    where: { id: recordId.trim(), forestId: c.cfa.id },
    include: { versions: { orderBy: { version: 'asc' } }, reviews: { orderBy: { createdAt: 'asc' } }, anchorLinks: { include: { batch: true } } },
  });
  if (!record) return fail(tool, 'NOT_FOUND', 'No record with that id in this CFA.');
  const ids = new Set<string>([...record.reviews.map((r) => r.reviewerId), ...record.versions.map((v) => v.createdByMemberId ?? '').filter(Boolean)]);
  const sourceAudit = record.sourceId && /^[0-9a-f-]{36}$/i.test(record.sourceId)
    ? await c.prisma.auditLog.findMany({ where: { entityId: record.sourceId }, orderBy: { createdAt: 'asc' } })
    : [];
  sourceAudit.forEach((a) => ids.add(a.userId));
  const evidence = await c.prisma.evidence.findMany({
    where: { cfaId: c.cfa.id, OR: [{ entityType: 'conservation_records', entityId: record.id }, ...(record.sourceTable && record.sourceId ? [{ entityType: record.sourceTable, entityId: record.sourceId }] : [])] },
    select: { fileName: true, sha256: true, createdAt: true, createdBy: true },
  });
  evidence.forEach((e) => ids.add(e.createdBy));
  const credentials = await c.prisma.verifiableCredential.findMany({ where: { recordId: record.id }, select: { id: true, credentialType: true, signerAddress: true, status: true, issuedAt: true, issuedBy: true } });
  credentials.forEach((v) => ids.add(v.issuedBy));
  const names = new Map((await c.prisma.cfaMember.findMany({ where: { id: { in: [...ids] } }, select: { id: true, name: true } })).map((m) => [m.id, m.name]));
  const who = (id: string | null | undefined) => (id ? names.get(id) ?? 'unknown member' : 'system');

  const events = [
    ...sourceAudit.map((a) => ({ at: a.createdAt, step: `${a.action === 'CREATE' ? 'Recorded' : 'Changed'} in the nursery (${a.entityType})`, by: who(a.userId), detail: a.action === 'UPDATE' ? `status ${(a.oldData as Record<string, unknown>)?.status} → ${(a.newData as Record<string, unknown>)?.status}` : `${(a.newData as Record<string, unknown>)?.quantity ?? ''} seedlings` })),
    ...record.versions.map((v) => ({ at: v.createdAt, step: `Record version ${v.version}`, by: who(v.createdByMemberId), detail: `${v.reason ?? ''} · SHA-256 ${v.dataHash.slice(0, 16)}…` })),
    ...evidence.map((e) => ({ at: e.createdAt, step: 'Evidence attached', by: who(e.createdBy), detail: `${e.fileName} · SHA-256 ${e.sha256.slice(0, 16)}…` })),
    ...record.reviews.map((r) => ({ at: r.createdAt, step: `Verification: ${r.decision}`, by: who(r.reviewerId), detail: `${r.reason ?? ''} (version ${r.recordVersion})` })),
    ...credentials.map((v) => ({ at: v.issuedAt, step: `Credential issued (${v.credentialType})`, by: who(v.issuedBy), detail: `signed by ${v.signerAddress} · ${v.status}` })),
    ...record.anchorLinks.filter((l) => l.batch.anchoredAt).map((l) => ({ at: l.batch.anchoredAt!, step: 'Anchored on Avalanche Fuji', by: l.batch.anchoredFrom ?? 'wallet', detail: `tx ${l.batch.txHash} · root ${l.batch.merkleRoot.slice(0, 16)}…` })),
  ].sort((x, y) => x.at.getTime() - y.at.getTime()).map((e) => ({ ...e, at: e.at.toISOString() }));

  const integrity = await checkRecordIntegrity(c.prisma, record.id);
  return ok(tool, {
    recordId: record.id, type: record.recordType, status: record.verificationStatus, anchor: record.anchorStatus,
    integrityOk: integrity?.ok ?? false, events, publicProof: `/verify/${record.id}`,
  });
}

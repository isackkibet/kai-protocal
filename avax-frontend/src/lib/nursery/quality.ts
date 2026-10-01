import { canReadAudit } from './db';
import { cleanQuantity, fail, matchByName, matchSpecies, ok, speciesLabel } from './agent-logic';
import { cleanDate, reconcileFamilies, validateDateRange, validateTreeCountVsArea } from './quality-rules';
import { actingMember, context, generateNurseryReport, getConservationMetrics, isFail } from './tools';
import { LOSS_REASONS } from './agent-logic';

/**
 * Data quality, reports and audit tools (Ecosystem PRD v1.1 §4.2-§4.3,
 * §4.6-§4.7, §4.10, §4.12). Read-only: nothing here writes.
 */

const kenyaToday = () => new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10);
const iso = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null);
/** The planting site is kept in the planting note as "Planted at <site>". */
const siteOf = (note: string | null | undefined) => note?.match(/^Planted at ([^.]+)/i)?.[1]?.trim() ?? null;

// ── get_nursery / get_species (§4.2, §4.3) ───────────────────────────────────

export async function getNursery(name: string) {
  const tool = 'get_nursery';
  const c = await context(tool);
  if (isFail(c)) return c;
  const locations = await c.prisma.nurseryLocation.findMany({ where: { cfaId: c.cfa.id } });
  const m = matchByName(name, locations);
  if (!('item' in m)) return fail(tool, 'NOT_FOUND', `No nursery "${name}".`, locations.map((l) => l.name));
  const l = m.item;
  const stock = await c.prisma.seedlingBatch.groupBy({ by: ['status'], where: { locationId: l.id }, _sum: { quantity: true } });
  return ok(tool, {
    name: l.name, description: l.description, latitude: l.latitude?.toString() ?? null, longitude: l.longitude?.toString() ?? null,
    areaHectares: (l.metadata as Record<string, unknown>)?.area_hectares ?? null,
    seedlings: Object.fromEntries(stock.map((s) => [s.status, s._sum.quantity ?? 0])),
  });
}

export async function getSpecies(name: string) {
  const tool = 'get_species';
  const c = await context(tool);
  if (isFail(c)) return c;
  const m = matchSpecies(name, await c.prisma.species.findMany());
  if (m.status !== 'exact') {
    return fail(tool, 'INVALID_SPECIES', `"${name}" is not an exact catalogue match.`, m.status === 'none' ? [] : m.candidates.map(speciesLabel));
  }
  const s = m.species;
  const stock = await c.prisma.seedlingBatch.groupBy({ by: ['status'], where: { speciesId: s.id, cfaId: c.cfa.id }, _sum: { quantity: true } });
  return ok(tool, {
    commonName: s.commonName, scientificName: s.scientificName, localName: s.localName, description: s.description,
    seedlings: Object.fromEntries(stock.map((x) => [x.status, x._sum.quantity ?? 0])),
  });
}

// ── validate / clean (§4.6, §4.12) ───────────────────────────────────────────

/** §4.6 clean_conservation_data: "500 trees" → 500, "jana" → a date, "akacia" → a catalogue suggestion. */
export async function cleanConservationData(input: { quantity?: string; date?: string; species?: string }) {
  const tool = 'clean_conservation_data';
  const today = kenyaToday();
  const out: Record<string, unknown> = {};
  const notes: string[] = [];
  if (input.quantity != null) {
    const q = cleanQuantity(input.quantity);
    out.quantity = q?.quantity ?? null;
    out.unit = q?.unit ?? null;
    if (!q) notes.push(`"${input.quantity}" is not a whole number of seedlings.`);
  }
  if (input.date != null) {
    out.date = cleanDate(input.date, today);
    if (!out.date) notes.push(`"${input.date}" is not a date I can read; use 2026-09-30 or 30/09/2026.`);
  }
  if (input.species != null) {
    const c = await context(tool);
    if (isFail(c)) return c;
    const m = matchSpecies(input.species, await c.prisma.species.findMany());
    out.species = m.status === 'exact' ? speciesLabel(m.species) : null;
    if (m.status === 'suggest' || m.status === 'ambiguous') notes.push(`Species: did you mean ${m.candidates.map(speciesLabel).join(' or ')}?`);
    if (m.status === 'none') notes.push(`"${input.species}" is not in the catalogue.`);
  }
  return ok(tool, { cleaned: out, notes, note: 'Cleaning never saves anything; it only shows the standard form.' });
}

/**
 * §4.6 validate_conservation_data: every deterministic check on a record
 * BEFORE it is drafted. Errors block; warnings need the user's attention.
 */
export async function validateConservationData(input: {
  kind: 'addition' | 'planting' | 'loss' | 'survival' | 'transfer';
  species?: string; quantity?: number; date?: string; nursery?: string; site?: string; reason?: string;
  areaHectares?: number; initialQuantity?: number; surviving?: number;
}) {
  const tool = 'validate_conservation_data';
  const c = await context(tool);
  if (isFail(c)) return c;
  const errors: string[] = [];
  const warnings: string[] = [];
  const today = kenyaToday();

  let speciesId: string | null = null;
  if (!input.species) errors.push('Species is missing.');
  else {
    const m = matchSpecies(input.species, await c.prisma.species.findMany());
    if (m.status === 'exact') speciesId = m.species.id;
    else errors.push(m.status === 'none' ? `"${input.species}" is not in the catalogue.` : `"${input.species}" needs confirming: ${m.candidates.map(speciesLabel).join(' or ')}.`);
  }
  if (input.kind !== 'survival') {
    if (input.quantity == null) errors.push('Quantity is missing.');
    else if (!Number.isInteger(input.quantity) || input.quantity <= 0) errors.push('Quantity must be a whole number above zero.');
    else if (input.quantity > 1_000_000) errors.push('Quantity is larger than any plausible batch.');
  } else if (input.initialQuantity != null && input.surviving != null && input.surviving > input.initialQuantity) {
    errors.push('More seedlings surviving than were planted.');
  }
  if (input.kind === 'planting') {
    if (!input.site?.trim()) errors.push('Planting site is missing.');
    if (!input.date) errors.push('Planting date is missing.');
  }
  if (input.kind === 'loss' && !(LOSS_REASONS as readonly string[]).includes(input.reason ?? '')) errors.push(`Loss reason is missing (${LOSS_REASONS.join(', ')}).`);
  if (input.date) {
    const d = cleanDate(input.date, today) ?? input.date;
    const r = validateDateRange({ startDate: d, activityType: input.kind === 'planting' ? 'planting' : null, today });
    if (!r.ok) errors.push(r.reason!);
    else if (r.reason) warnings.push(r.reason);
  }
  if (input.nursery?.trim()) {
    const locations = await c.prisma.nurseryLocation.findMany({ where: { cfaId: c.cfa.id }, select: { id: true, name: true } });
    if (!('item' in matchByName(input.nursery, locations))) errors.push(`No nursery called "${input.nursery}".`);
  }
  if (input.quantity && input.areaHectares) {
    const r = validateTreeCountVsArea(input.quantity, input.areaHectares, input.kind === 'planting' ? 'planting' : 'nursery');
    if (r.flaggedReason) (r.isPlausible ? warnings : errors).push(r.flaggedReason);
  }
  if ((input.quantity ?? 0) > 1_000) warnings.push('More than 1,000 seedlings: please add a photo as evidence after saving (camera button on the batch).');
  // Round numbers typed by voice ("50" vs "500") are a common slip on big plantings.
  if (input.quantity && input.quantity >= 100 && input.quantity % 100 === 0 && input.kind === 'planting') {
    warnings.push(`Confirm the number: ${input.quantity} (not ${input.quantity / 10} or ${input.quantity * 10})?`);
  }

  // Duplicate: the same species, quantity and date already recorded.
  if (speciesId && input.quantity && input.date) {
    const d = cleanDate(input.date, today);
    if (d) {
      const day = new Date(`${d}T00:00:00Z`);
      const dup = input.kind === 'planting'
        ? await c.prisma.seedlingBatch.findFirst({ where: { cfaId: c.cfa.id, speciesId, quantity: input.quantity, status: 'planted', plantingDate: day } })
        : input.kind === 'addition'
          ? await c.prisma.seedlingBatch.findFirst({ where: { cfaId: c.cfa.id, speciesId, quantity: input.quantity, dateReceived: day } })
          : null;
      if (dup) warnings.push(`A ${input.kind} of ${input.quantity} of this species on ${d} is already recorded. Is this a duplicate?`);
    }
  }
  return ok(tool, { valid: errors.length === 0, errors, warnings });
}

// ── reconcile_inventory, quality metrics (§4.12) ─────────────────────────────

export async function reconcileInventory() {
  const tool = 'reconcile_inventory';
  const c = await context(tool);
  if (isFail(c)) return c;
  const rows = await c.prisma.$queryRaw<{ id: string; quantity: number; split_from: string | null }[]>`
    SELECT id::text, quantity, metadata->>'split_from' AS split_from FROM seedling_inventory WHERE cfa_id = ${c.cfa.id}::uuid`;
  const created = await c.prisma.$queryRaw<{ id: string; quantity: number }[]>`
    SELECT entity_id::text AS id, (new_data->>'quantity')::int AS quantity FROM audit_logs
    WHERE entity_type = 'seedling_inventory' AND action = 'CREATE'
      AND new_data->>'cfa_id' = ${c.cfa.id} AND (new_data->'metadata'->>'split_from') IS NULL`;
  const result = reconcileFamilies(rows.map((r) => ({ id: r.id, quantity: r.quantity, splitFrom: r.split_from })), new Map(created.map((r) => [r.id, r.quantity])));
  return ok(tool, {
    ...result,
    method: 'Each batch as first recorded (audit log) must equal what it is now plus every part split from it by planting, loss or transfer.',
  });
}

export async function getQualityMetrics(filters: { from?: string; to?: string } = {}) {
  const tool = 'get_quality_metrics';
  const c = await context(tool);
  if (isFail(c)) return c;
  const range = filters.from || filters.to
    ? { createdAt: { ...(filters.from ? { gte: new Date(`${filters.from}T00:00:00Z`) } : {}), ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59Z`) } : {}) } }
    : {};
  const records = await c.prisma.conservationRecord.findMany({
    where: { forestId: c.cfa.id, ...range },
    select: { id: true, verificationStatus: true, anchorStatus: true, currentVersion: true, sourceTable: true, sourceId: true },
  });
  const evidenceKeys = new Set((await c.prisma.evidence.findMany({ where: { cfaId: c.cfa.id }, select: { entityType: true, entityId: true } })).map((e) => `${e.entityType}:${e.entityId}`));
  const [{ n: duplicatePhotos }] = await c.prisma.$queryRaw<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM evidence WHERE cfa_id = ${c.cfa.id}::uuid AND metadata ? 'duplicateOf'`;
  const n = records.length;
  const pct = (k: number) => (n ? Math.round((k / n) * 1000) / 10 : null);
  const by = (s: string) => records.filter((r) => r.verificationStatus === s).length;
  const withEvidence = records.filter((r) => evidenceKeys.has(`conservation_records:${r.id}`) || (r.sourceTable && evidenceKeys.has(`${r.sourceTable}:${r.sourceId}`))).length;
  const recon = await reconcileInventory();
  return ok(tool, {
    period: { from: filters.from ?? 'start', to: filters.to ?? 'today' },
    totalSubmissions: n,
    verifiedPct: pct(by('VERIFIED')), rejectedPct: pct(by('REJECTED')),
    waitingForReview: by('SUBMITTED') + by('UNDER_REVIEW'), sentBackForCorrection: by('CORRECTION_REQUIRED'),
    correctedPct: pct(records.filter((r) => r.currentVersion > 1).length),
    withPhotoEvidencePct: pct(withEvidence),
    anchoredPct: pct(records.filter((r) => r.anchorStatus === 'ANCHORED').length),
    possibleDuplicatePhotos: duplicatePhotos,
    inventoryReconciled: recon.success ? recon.data!.isReconciled : null,
  });
}

// ── activities (§4.12) ────────────────────────────────────────────────────────

export async function listActivities(filters: { site?: string; nursery?: string; type?: string; from?: string; to?: string; limit?: number }) {
  const tool = filters.site ? 'list_activities_by_site' : 'list_activities_by_cfa';
  const c = await context(tool);
  if (isFail(c)) return c;
  let locationId: string | undefined;
  if (filters.nursery?.trim()) {
    const locations = await c.prisma.nurseryLocation.findMany({ where: { cfaId: c.cfa.id }, select: { id: true, name: true } });
    const m = matchByName(filters.nursery, locations);
    if (!('item' in m)) return fail(tool, 'NOT_FOUND', `No nursery "${filters.nursery}".`, locations.map((l) => l.name));
    locationId = m.item.id;
  }
  const rows = await c.prisma.nurseryActivity.findMany({
    where: {
      cfaId: c.cfa.id,
      ...(locationId ? { locationId } : {}),
      ...(filters.type ? { activityType: filters.type as never } : {}),
      ...(filters.site ? { description: { contains: filters.site.trim(), mode: 'insensitive' } } : {}),
      ...(filters.from || filters.to ? { activityDate: { ...(filters.from ? { gte: new Date(`${filters.from}T00:00:00Z`) } : {}), ...(filters.to ? { lte: new Date(`${filters.to}T00:00:00Z`) } : {}) } } : {}),
    },
    orderBy: [{ activityDate: 'desc' }, { createdAt: 'desc' }],
    take: Math.min(Math.max(filters.limit ?? 25, 1), 100),
    include: { location: { select: { name: true } }, batch: { select: { species: { select: { commonName: true } } } } },
  });
  return ok(tool, {
    count: rows.length,
    activities: rows.map((a) => ({
      activityId: a.id, date: iso(a.activityDate), type: a.activityType, quantity: a.quantityAffected,
      species: a.batch?.species.commonName ?? null, nursery: a.location.name, site: siteOf(a.description), notes: a.description,
    })),
  });
}

export async function getActivityDetail(activityId: string) {
  const tool = 'get_activity_detail';
  const c = await context(tool);
  if (isFail(c)) return c;
  if (!/^[0-9a-f-]{36}$/i.test(activityId.trim())) return fail(tool, 'INVALID_INPUT', 'That is not an activity id.');
  const a = await c.prisma.nurseryActivity.findFirst({
    where: { id: activityId.trim(), cfaId: c.cfa.id },
    include: { location: { select: { name: true } }, batch: { include: { species: true } } },
  });
  if (!a) return fail(tool, 'NOT_FOUND', 'No activity with that id.');
  const by = await c.prisma.cfaMember.findUnique({ where: { id: a.performedBy }, select: { name: true } });
  const evidence = await c.prisma.evidence.findMany({
    where: { cfaId: c.cfa.id, OR: [{ entityType: 'nursery_activities', entityId: a.id }, ...(a.inventoryId ? [{ entityType: 'seedling_inventory', entityId: a.inventoryId }] : [])] },
    select: { fileName: true, sha256: true, caption: true, metadata: true },
  });
  const record = a.inventoryId
    ? await c.prisma.conservationRecord.findFirst({ where: { sourceTable: 'seedling_inventory', sourceId: a.inventoryId }, include: { reviews: { orderBy: { createdAt: 'desc' }, take: 3 } } })
    : null;
  const issues: string[] = [];
  if (!evidence.length) issues.push('No photo or document.');
  if (evidence.some((e) => (e.metadata as Record<string, unknown>)?.duplicateOf)) issues.push('A photo looks like one already used elsewhere.');
  if (a.activityType === 'planting' && !siteOf(a.description)) issues.push('No planting site recorded.');
  return ok(tool, {
    activityId: a.id, type: a.activityType, date: iso(a.activityDate), quantity: a.quantityAffected, nursery: a.location.name,
    site: siteOf(a.description), notes: a.description, recordedBy: by?.name ?? null, metadata: a.metadata,
    batch: a.batch ? { species: speciesLabel(a.batch.species), quantity: a.batch.quantity, status: a.batch.status } : null,
    evidence: evidence.map((e) => ({ fileName: e.fileName, sha256: e.sha256, caption: e.caption })),
    verification: record ? { recordId: record.id, status: record.verificationStatus, notes: record.reviews.map((r) => `${r.decision}${r.reason ? `: ${r.reason}` : ''}`) } : null,
    qualityIssues: issues,
  });
}

// ── reports (§4.7) ────────────────────────────────────────────────────────────

export async function generateSiteReport(site: string) {
  const tool = 'generate_site_report';
  const c = await context(tool);
  if (isFail(c)) return c;
  const planted = await c.prisma.seedlingBatch.findMany({
    where: { cfaId: c.cfa.id, status: 'planted', notes: { contains: site.trim(), mode: 'insensitive' } },
    include: { species: { select: { commonName: true } }, observations: { orderBy: { observationDate: 'desc' }, take: 1 } },
  });
  const atSite = planted.filter((b) => siteOf(b.notes)?.toLowerCase().includes(site.trim().toLowerCase()));
  if (!atSite.length) {
    const sites = [...new Set((await c.prisma.seedlingBatch.findMany({ where: { cfaId: c.cfa.id, status: 'planted' }, select: { notes: true } })).map((b) => siteOf(b.notes)).filter(Boolean))] as string[];
    return fail(tool, 'NOT_FOUND', `Nothing is recorded as planted at "${site}".`, sites);
  }
  const bySpecies: Record<string, number> = {};
  for (const b of atSite) bySpecies[b.species.commonName] = (bySpecies[b.species.commonName] ?? 0) + b.quantity;
  const checked = atSite.filter((b) => b.observations[0]);
  const initial = checked.reduce((a, b) => a + b.observations[0].initialQuantity, 0);
  const alive = checked.reduce((a, b) => a + b.observations[0].aliveQuantity, 0);
  const records = await c.prisma.conservationRecord.findMany({ where: { sourceTable: 'seedling_inventory', sourceId: { in: atSite.map((b) => b.id) } }, select: { verificationStatus: true, anchorStatus: true } });
  return ok(tool, {
    site: siteOf(atSite[0].notes),
    plantings: atSite.length,
    totalPlanted: atSite.reduce((a, b) => a + b.quantity, 0),
    bySpecies,
    firstPlanted: iso(atSite.map((b) => b.plantingDate!).sort((x, y) => x.getTime() - y.getTime())[0]),
    lastPlanted: iso(atSite.map((b) => b.plantingDate!).sort((x, y) => y.getTime() - x.getTime())[0]),
    survival: checked.length ? { batchesChecked: checked.length, alive, of: initial, ratePct: Math.round((alive / initial) * 1000) / 10 } : 'No survival checks at this site yet.',
    verification: { verified: records.filter((r) => r.verificationStatus === 'VERIFIED').length, anchored: records.filter((r) => r.anchorStatus === 'ANCHORED').length, records: records.length },
  });
}

export async function generateCfaReport(filters: { from?: string; to?: string } = {}) {
  const tool = 'generate_cfa_report';
  const c = await context(tool);
  if (isFail(c)) return c;
  const [members, nurseries, nursery, metrics, quality] = await Promise.all([
    c.prisma.cfaMember.groupBy({ by: ['role'], where: { cfaId: c.cfa.id, status: 'active' }, _count: { _all: true } }),
    c.prisma.nurseryLocation.count({ where: { cfaId: c.cfa.id } }),
    generateNurseryReport(filters),
    getConservationMetrics(),
    getQualityMetrics(filters),
  ]);
  const sites = [...new Set((await c.prisma.seedlingBatch.findMany({ where: { cfaId: c.cfa.id, status: 'planted' }, select: { notes: true } })).map((b) => siteOf(b.notes)).filter(Boolean))];
  return ok(tool, {
    cfa: { name: c.cfa.name, location: c.cfa.location },
    period: { from: filters.from ?? 'start', to: filters.to ?? 'today' },
    team: Object.fromEntries(members.map((m) => [m.role, m._count._all])),
    nurseries, plantingSites: sites,
    conservation: metrics.success ? metrics.data : null,
    activityInPeriod: nursery.success ? (nursery.data as { inPeriod?: unknown } | undefined)?.inPeriod ?? null : null,
    dataQuality: quality.success ? quality.data : null,
  });
}

// ── audit (§4.10, §4.12) ──────────────────────────────────────────────────────

export async function getAuditHistory(privyUserId: string | null, filters: { entityType?: string; entityId?: string; limit?: number }) {
  const tool = 'get_audit_history';
  const c = await context(tool);
  if (isFail(c)) return c;
  const member = await actingMember(tool, c.prisma, c.cfa, privyUserId);
  if (isFail(member)) return member;
  if (!canReadAudit(member)) return fail(tool, 'FORBIDDEN', 'Only CFA admins, auditors and verifiers can read the audit history.');
  const rows = await c.prisma.auditLog.findMany({
    where: { ...(filters.entityType ? { entityType: filters.entityType } : {}), ...(filters.entityId && /^[0-9a-f-]{36}$/i.test(filters.entityId) ? { entityId: filters.entityId } : {}) },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(filters.limit ?? 20, 1), 50),
  });
  const names = new Map((await c.prisma.cfaMember.findMany({ where: { id: { in: [...new Set(rows.map((r) => r.userId))] } }, select: { id: true, name: true } })).map((m) => [m.id, m.name]));
  // Changed fields only: the full rows can hold members' contact details.
  const changed = (o: unknown, n: unknown) => {
    const a = (o ?? {}) as Record<string, unknown>, b = (n ?? {}) as Record<string, unknown>;
    return Object.keys({ ...a, ...b }).filter((k) => !['updated_at', 'email', 'phone', 'auth_user_id'].includes(k) && JSON.stringify(a[k]) !== JSON.stringify(b[k]))
      .map((k) => ({ field: k, before: a[k] ?? null, after: b[k] ?? null }));
  };
  return ok(tool, {
    events: rows.map((r) => ({ at: r.createdAt.toISOString(), by: names.get(r.userId) ?? 'unknown', action: r.action, entity: r.entityType, entityId: r.entityId, changes: changed(r.oldData, r.newData).slice(0, 8) })),
    export: 'Admins and auditors can download the full log as CSV or JSON: Manage the CFA → Download audit log.',
  });
}

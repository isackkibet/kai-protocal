import type { Cfa, CfaMember, PrismaClient, Species } from '@prisma/client';
import { getPrisma } from '@/lib/db/db';
import { getNurseryCfa } from './db';
import { ACTIVITY_TYPES, FieldError, day, type ActivityTypeValue } from './validate';
import {
  LOSS_REASONS, fail, matchByName, matchSpecies, ok, pickBatch, speciesLabel, summarizeInventory,
  type LossReason, type NurseryPlan, type ToolResult,
} from './agent-logic';

export type { NurseryPlan } from './agent-logic';

/**
 * Nursery tool layer (Kanuvari Tools & Agents PRD §4). Plain functions that
 * work without any AI: an agent, an API route or a script can call them.
 * Every one returns the standard ToolResult (PRD §7.1).
 *
 * READ tools query the database directly.
 *
 * WRITE tools are "prepare_*": they resolve names to ids, validate everything
 * and return a NurseryPlan — a draft the user confirms with a button. The
 * confirmed draft is POSTed by the user's own browser to the existing
 * /api/cfa/* route, which checks the login and CFA membership again,
 * re-validates, writes through withMember() (so the audit trigger records
 * who acted) and creates the MRV record. So the path is always
 * Agent → Tool → Authorization → Database (PRD §3.5); an agent can never
 * write on its own.
 */

type Ctx = { prisma: PrismaClient; cfa: Cfa };

async function context(tool: string): Promise<Ctx | ToolResult<never>> {
  const prisma = await getPrisma();
  if (!prisma) return fail(tool, 'DATABASE_ERROR', 'The database is not available right now.');
  const cfa = await getNurseryCfa(prisma);
  if (!cfa) return fail(tool, 'NOT_FOUND', 'The nursery database is not set up yet.');
  return { prisma, cfa };
}
const isFail = (x: unknown): x is ToolResult<never> => !!x && typeof x === 'object' && 'success' in x;

const iso = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null);

// ── Resolution helpers ────────────────────────────────────────────────────────

async function resolveSpecies(tool: string, prisma: PrismaClient, name: string): Promise<Species | ToolResult<never>> {
  const catalogue = await prisma.species.findMany();
  if (!catalogue.length) return fail(tool, 'INVALID_SPECIES', 'The species catalogue is empty. A CFA admin adds species on the /nursery page.');
  const m = matchSpecies(name, catalogue);
  if (m.status === 'exact') return m.species;
  if (m.status === 'ambiguous') {
    return fail(tool, 'INVALID_SPECIES', `More than one species is called "${name}". Ask the user which one.`, m.candidates.map(speciesLabel));
  }
  if (m.status === 'suggest') {
    return fail(tool, 'INVALID_SPECIES', `"${name}" is not in the catalogue. Ask the user to confirm one of these before continuing.`, m.candidates.map(speciesLabel));
  }
  return fail(tool, 'INVALID_SPECIES', `"${name}" is not in the species catalogue. A CFA admin can add it on /nursery.`, catalogue.slice(0, 15).map(speciesLabel));
}

async function resolveNursery(
  tool: string, prisma: PrismaClient, cfa: Cfa, name: string | undefined, assumptions: string[],
): Promise<{ id: string; name: string } | ToolResult<never>> {
  const locations = await prisma.nurseryLocation.findMany({ where: { cfaId: cfa.id }, select: { id: true, name: true }, orderBy: { name: 'asc' } });
  if (!locations.length) return fail(tool, 'NOT_FOUND', 'No nursery has been registered yet. A CFA admin adds one on /nursery.');
  if (!name?.trim()) {
    if (locations.length === 1) {
      assumptions.push(`Nursery: ${locations[0].name} (the only one registered)`);
      return locations[0];
    }
    return fail(tool, 'MISSING_INFORMATION', 'Which nursery? Ask the user.', locations.map((l) => l.name));
  }
  const m = matchByName(name, locations);
  if ('item' in m) return m.item;
  return fail(tool, 'NOT_FOUND', `There is no nursery called "${name}". Ask the user which one.`, m.options.map((l) => l.name));
}

/** The signed-in user's active CFA membership — required for any write. */
async function actingMember(tool: string, prisma: PrismaClient, cfa: Cfa, privyUserId: string | null): Promise<CfaMember | ToolResult<never>> {
  if (!privyUserId) return fail(tool, 'UNAUTHORIZED', 'The user must sign in before recording nursery data.');
  const member = await prisma.cfaMember.findUnique({ where: { authUserId: privyUserId } });
  if (!member || member.cfaId !== cfa.id) return fail(tool, 'FORBIDDEN', 'Only CFA members can record nursery data. They can join on /nursery.');
  if (member.status !== 'active') return fail(tool, 'FORBIDDEN', `This CFA membership is ${member.status}.`);
  return member;
}

/** Date from the agent: "YYYY-MM-DD", not in the future. */
function checkDate(tool: string, field: string, value: string | undefined, required: boolean): string | null | ToolResult<never> {
  try {
    return day({ [field]: value }, field, { required });
  } catch (e) {
    if (e instanceof FieldError) return fail(tool, required && !value ? 'MISSING_INFORMATION' : 'INVALID_INPUT', e.message);
    throw e;
  }
}

function checkQuantity(tool: string, quantity: number): ToolResult<never> | null {
  if (!Number.isInteger(quantity) || quantity <= 0) return fail(tool, 'INVALID_QUANTITY', 'The quantity must be a whole number above zero.');
  if (quantity > 1_000_000) return fail(tool, 'INVALID_QUANTITY', 'That quantity is larger than any plausible batch. Ask the user to check it.');
  return null;
}

// ── READ tools ────────────────────────────────────────────────────────────────

/** PRD §4.2 list_nurseries */
export async function listNurseries() {
  const tool = 'list_nurseries';
  const c = await context(tool);
  if (isFail(c)) return c;
  const [locations, counts] = await Promise.all([
    c.prisma.nurseryLocation.findMany({ where: { cfaId: c.cfa.id }, orderBy: { name: 'asc' }, select: { id: true, name: true, description: true } }),
    c.prisma.seedlingBatch.groupBy({ by: ['locationId'], where: { cfaId: c.cfa.id, status: 'in_inventory' }, _sum: { quantity: true } }),
  ]);
  const available = new Map(counts.map((r) => [r.locationId, r._sum.quantity ?? 0]));
  return ok(tool, {
    cfa: c.cfa.name,
    nurseries: locations.map((l) => ({ name: l.name, description: l.description, seedlingsAvailable: available.get(l.id) ?? 0 })),
  });
}

/** PRD §4.3 search_species */
export async function searchSpecies(query: string) {
  const tool = 'search_species';
  const c = await context(tool);
  if (isFail(c)) return c;
  const catalogue = await c.prisma.species.findMany({ orderBy: { commonName: 'asc' } });
  const q = query.trim().toLowerCase();
  const hits = q
    ? catalogue.filter((s) => [s.commonName, s.scientificName, s.localName ?? ''].some((n) => n.toLowerCase().includes(q)))
    : catalogue;
  const m = hits.length ? null : matchSpecies(query, catalogue);
  const suggestions = m && (m.status === 'suggest' || m.status === 'ambiguous') ? m.candidates : [];
  return ok(tool, {
    matches: hits.slice(0, 30).map((s) => ({ commonName: s.commonName, scientificName: s.scientificName, localName: s.localName })),
    didYouMean: suggestions.map(speciesLabel),
    catalogueSize: catalogue.length,
  });
}

/** PRD §4.3 validate_species_name */
export async function validateSpeciesName(name: string) {
  const tool = 'validate_species_name';
  const c = await context(tool);
  if (isFail(c)) return c;
  const m = matchSpecies(name, await c.prisma.species.findMany());
  if (m.status === 'exact') return ok(tool, { valid: true, species: speciesLabel(m.species) });
  if (m.status === 'none') return ok(tool, { valid: false, suggestions: [], note: 'Not in the catalogue.' });
  return ok(tool, {
    valid: false,
    suggestions: m.candidates.map(speciesLabel),
    note: m.status === 'ambiguous' ? 'Several species match; ask which one.' : 'Possible typo; ask the user to confirm.',
  });
}

/** PRD §4.4 get_seedling_inventory: {available, planted, lost, total} per species. */
export async function getSeedlingInventory(filters: { species?: string; nursery?: string }) {
  const tool = 'get_seedling_inventory';
  const c = await context(tool);
  if (isFail(c)) return c;
  const where: { cfaId: string; speciesId?: string; locationId?: string } = { cfaId: c.cfa.id };
  if (filters.species?.trim()) {
    const s = await resolveSpecies(tool, c.prisma, filters.species);
    if (isFail(s)) return s;
    where.speciesId = s.id;
  }
  if (filters.nursery?.trim()) {
    const n = await resolveNursery(tool, c.prisma, c.cfa, filters.nursery, []);
    if (isFail(n)) return n;
    where.locationId = n.id;
  }
  const grouped = await c.prisma.seedlingBatch.groupBy({ by: ['speciesId', 'status'], where, _sum: { quantity: true } });
  const species = await c.prisma.species.findMany({ where: { id: { in: [...new Set(grouped.map((g) => g.speciesId))] } } });
  const name = new Map(species.map((s) => [s.id, speciesLabel(s)]));
  const bySpecies = summarizeInventory(grouped.map((g) => ({ species: name.get(g.speciesId) ?? 'unknown', status: g.status, quantity: g._sum.quantity ?? 0 })));
  const sum = (k: 'available' | 'planted' | 'lost' | 'total') => bySpecies.reduce((a, r) => a + r[k], 0);
  return ok(tool, {
    bySpecies,
    totals: { available: sum('available'), planted: sum('planted'), lost: sum('lost'), total: sum('total') },
    note: bySpecies.length ? 'Recorded figures from the database.' : 'No seedlings are recorded for this filter.',
  });
}

/**
 * PRD §4.4 get_inventory_history: seedlings added (from the audit log, which
 * keeps the original batch size) plus every nursery activity, newest first.
 */
export async function getInventoryHistory(filters: { species?: string; nursery?: string; limit?: number }) {
  const tool = 'get_inventory_history';
  const c = await context(tool);
  if (isFail(c)) return c;
  let speciesId: string | undefined;
  let locationId: string | undefined;
  if (filters.species?.trim()) {
    const s = await resolveSpecies(tool, c.prisma, filters.species);
    if (isFail(s)) return s;
    speciesId = s.id;
  }
  if (filters.nursery?.trim()) {
    const n = await resolveNursery(tool, c.prisma, c.cfa, filters.nursery, []);
    if (isFail(n)) return n;
    locationId = n.id;
  }
  const limit = Math.min(Math.max(filters.limit ?? 20, 1), 50);

  const added = await c.prisma.$queryRaw<{ at: Date; quantity: number; species_id: string; location_id: string; source: string | null }[]>`
    SELECT a.created_at AS at, (a.new_data->>'quantity')::int AS quantity, a.new_data->>'species_id' AS species_id,
           a.new_data->>'location_id' AS location_id, a.new_data->>'source' AS source
    FROM audit_logs a
    WHERE a.entity_type = 'seedling_inventory' AND a.action = 'CREATE'
      AND a.new_data->>'cfa_id' = ${c.cfa.id}
      AND a.new_data->>'status' = 'in_inventory'
      AND (a.new_data->'metadata'->>'split_from') IS NULL
    ORDER BY a.created_at DESC LIMIT ${limit}`;
  const activities = await c.prisma.nurseryActivity.findMany({
    where: { cfaId: c.cfa.id, ...(locationId ? { locationId } : {}), ...(speciesId ? { batch: { speciesId } } : {}) },
    orderBy: [{ activityDate: 'desc' }, { createdAt: 'desc' }],
    take: limit,
    include: { location: { select: { name: true } }, batch: { select: { species: { select: { commonName: true } } } } },
  });
  const speciesNames = new Map((await c.prisma.species.findMany({ select: { id: true, commonName: true } })).map((s) => [s.id, s.commonName]));
  const locationNames = new Map((await c.prisma.nurseryLocation.findMany({ where: { cfaId: c.cfa.id }, select: { id: true, name: true } })).map((l) => [l.id, l.name]));

  const events = [
    ...added
      .filter((a) => (!speciesId || a.species_id === speciesId) && (!locationId || a.location_id === locationId))
      .map((a) => ({ date: iso(a.at), event: 'added', quantity: a.quantity, species: speciesNames.get(a.species_id) ?? null, nursery: locationNames.get(a.location_id) ?? null, note: a.source })),
    ...activities.map((a) => {
      const m = (a.metadata ?? {}) as Record<string, unknown>;
      return {
        date: iso(a.activityDate),
        event: m.kind === 'loss' ? `lost (${String(m.reason ?? 'unknown')})` : a.activityType,
        quantity: a.quantityAffected,
        species: a.batch?.species.commonName ?? null,
        nursery: a.location.name,
        note: a.description,
      };
    }),
  ].sort((x, y) => String(y.date).localeCompare(String(x.date))).slice(0, limit);
  return ok(tool, { events, note: events.length ? 'Recorded events, newest first.' : 'Nothing has been recorded yet.' });
}

/** PRD §4.6 search_conservation_records (nursery activities with filters). */
export async function searchConservationRecords(filters: { activityType?: string; from?: string; to?: string; nursery?: string; limit?: number }) {
  const tool = 'search_conservation_records';
  const c = await context(tool);
  if (isFail(c)) return c;
  const from = checkDate(tool, 'from', filters.from, false);
  if (isFail(from)) return from;
  const to = checkDate(tool, 'to', filters.to, false);
  if (isFail(to)) return to;
  if (filters.activityType && !(ACTIVITY_TYPES as readonly string[]).includes(filters.activityType)) {
    return fail(tool, 'INVALID_INPUT', 'Unknown activity type.', [...ACTIVITY_TYPES]);
  }
  let locationId: string | undefined;
  if (filters.nursery?.trim()) {
    const n = await resolveNursery(tool, c.prisma, c.cfa, filters.nursery, []);
    if (isFail(n)) return n;
    locationId = n.id;
  }
  const rows = await c.prisma.nurseryActivity.findMany({
    where: {
      cfaId: c.cfa.id,
      ...(filters.activityType ? { activityType: filters.activityType as ActivityTypeValue } : {}),
      ...(locationId ? { locationId } : {}),
      ...(from || to ? { activityDate: { ...(from ? { gte: new Date(`${from}T00:00:00Z`) } : {}), ...(to ? { lte: new Date(`${to}T00:00:00Z`) } : {}) } } : {}),
    },
    orderBy: [{ activityDate: 'desc' }, { createdAt: 'desc' }],
    take: Math.min(Math.max(filters.limit ?? 25, 1), 100),
    include: { location: { select: { name: true } }, batch: { select: { species: { select: { commonName: true } } } } },
  });
  return ok(tool, {
    count: rows.length,
    records: rows.map((a) => ({
      date: iso(a.activityDate), type: a.activityType, quantity: a.quantityAffected,
      species: a.batch?.species.commonName ?? null, nursery: a.location.name, notes: a.description,
    })),
  });
}

/**
 * PRD §4.6 get_conservation_metrics. Surviving = alive count of the latest
 * survival check of each planted batch; survival_rate = surviving / planted
 * for the batches that have been checked.
 */
export async function getConservationMetrics() {
  const tool = 'get_conservation_metrics';
  const c = await context(tool);
  if (isFail(c)) return c;
  const totals = await c.prisma.seedlingBatch.groupBy({ by: ['status'], where: { cfaId: c.cfa.id }, _sum: { quantity: true } });
  const t = (s: string) => totals.find((r) => r.status === s)?._sum.quantity ?? 0;
  const latest = await c.prisma.$queryRaw<{ initial: number; alive: number; batches: number }[]>`
    SELECT COALESCE(SUM(initial_quantity), 0)::int AS initial, COALESCE(SUM(alive_quantity), 0)::int AS alive, COUNT(*)::int AS batches
    FROM (
      SELECT DISTINCT ON (o.inventory_id) o.initial_quantity, o.alive_quantity
      FROM survival_observations o JOIN seedling_inventory i ON i.id = o.inventory_id
      WHERE i.cfa_id = ${c.cfa.id}::uuid
      ORDER BY o.inventory_id, o.observation_date DESC, o.created_at DESC
    ) last_check`;
  const s = latest[0] ?? { initial: 0, alive: 0, batches: 0 };
  return ok(tool, {
    total_seedlings: totals.reduce((a, r) => a + (r._sum.quantity ?? 0), 0),
    in_nursery: t('in_inventory'),
    total_planted: t('planted'),
    lost: t('dead'),
    total_surviving: s.alive,
    survival_rate: s.initial ? Math.round((s.alive / s.initial) * 1000) / 1000 : null,
    survival_checked_batches: s.batches,
    note: s.initial ? 'survival_rate is surviving / planted for batches with a survival check.' : 'No survival checks recorded yet, so there is no survival rate.',
  });
}

/** PRD §4.7 generate_nursery_report: one period's additions, planting, losses and work. */
export async function generateNurseryReport(filters: { from?: string; to?: string }) {
  const tool = 'generate_nursery_report';
  const from = checkDate(tool, 'from', filters.from, false);
  if (isFail(from)) return from;
  const to = checkDate(tool, 'to', filters.to, false);
  if (isFail(to)) return to;
  const [inventory, metrics, activities, history] = await Promise.all([
    getSeedlingInventory({}),
    getConservationMetrics(),
    searchConservationRecords({ from: from ?? undefined, to: to ?? undefined, limit: 100 }),
    getInventoryHistory({ limit: 50 }),
  ]);
  for (const r of [inventory, metrics, activities, history]) if (!r.success) return { ...r, metadata: { ...r.metadata, tool } };
  const inRange = (d: string | null) => !!d && (!from || d >= from) && (!to || d <= to);
  const events = history.data!.events.filter((e) => inRange(e.date));
  const byType: Record<string, number> = {};
  for (const a of activities.data!.records) byType[a.type] = (byType[a.type] ?? 0) + 1;
  const sumOf = (pred: (e: (typeof events)[number]) => boolean) => events.filter(pred).reduce((a, e) => a + (e.quantity ?? 0), 0);
  return ok(tool, {
    period: { from: from ?? 'start', to: to ?? 'today' },
    currentInventory: inventory.data!.bySpecies,
    metrics: metrics.data,
    inPeriod: {
      seedlingsAdded: sumOf((e) => e.event === 'added'),
      seedlingsPlanted: sumOf((e) => e.event === 'planting'),
      seedlingsLost: sumOf((e) => e.event.startsWith('lost')),
      activitiesByType: byType,
    },
  });
}

// ── WRITE tools: prepare a plan, the user confirms ────────────────────────────

/** PRD §4.4 record_seedling_addition */
export async function prepareSeedlingAddition(
  privyUserId: string | null,
  input: { species: string; quantity: number; nursery?: string; dateReceived?: string; source?: string },
): Promise<ToolResult<NurseryPlan>> {
  const tool = 'record_seedling_addition';
  const c = await context(tool);
  if (isFail(c)) return c;
  const member = await actingMember(tool, c.prisma, c.cfa, privyUserId);
  if (isFail(member)) return member;
  const bad = checkQuantity(tool, input.quantity);
  if (bad) return bad;
  const date = checkDate(tool, 'dateReceived', input.dateReceived, false);
  if (isFail(date)) return date;
  const species = await resolveSpecies(tool, c.prisma, input.species);
  if (isFail(species)) return species;
  const assumptions: string[] = [];
  const nursery = await resolveNursery(tool, c.prisma, c.cfa, input.nursery, assumptions);
  if (isFail(nursery)) return nursery;
  return ok(tool, {
    kind: 'nursery', name: tool, endpoint: '/api/cfa/inventory',
    body: { speciesId: species.id, locationId: nursery.id, quantity: input.quantity, dateReceived: date, source: input.source?.trim() || null },
    summary: `Add ${input.quantity} ${speciesLabel(species)} seedlings to ${nursery.name}${date ? `, received ${date}` : ''}${input.source ? ` from ${input.source}` : ''}.`,
    assumptions,
  });
}

/** Oldest in-nursery batch of this species (and nursery) big enough for `quantity`. */
async function batchFor(tool: string, c: Ctx, speciesId: string, locationId: string, quantity: number, verb: string) {
  const batches = await c.prisma.seedlingBatch.findMany({
    where: { cfaId: c.cfa.id, speciesId, locationId, status: 'in_inventory' },
    select: { id: true, quantity: true, status: true, createdAt: true },
  });
  const available = batches.reduce((a, b) => a + b.quantity, 0);
  if (!available) return fail(tool, 'INVALID_QUANTITY', `There are no seedlings of this species in that nursery to ${verb}.`);
  const batch = pickBatch(batches, quantity);
  if (batch) return batch;
  if (quantity > available) return fail(tool, 'INVALID_QUANTITY', `Only ${available} are in the nursery, fewer than ${quantity}.`);
  const largest = Math.max(...batches.map((b) => b.quantity));
  return fail(tool, 'INVALID_QUANTITY', `${available} are in the nursery but split across batches; the largest batch has ${largest}. Record it in parts of at most ${largest}.`);
}

/** PRD §4.4 record_seedling_planting (site and date are required: PRD §11.3 test 1). */
export async function prepareSeedlingPlanting(
  privyUserId: string | null,
  input: { species: string; quantity: number; site: string; plantingDate: string; nursery?: string; notes?: string },
): Promise<ToolResult<NurseryPlan>> {
  const tool = 'record_seedling_planting';
  const c = await context(tool);
  if (isFail(c)) return c;
  const member = await actingMember(tool, c.prisma, c.cfa, privyUserId);
  if (isFail(member)) return member;
  const bad = checkQuantity(tool, input.quantity);
  if (bad) return bad;
  if (!input.site?.trim()) return fail(tool, 'MISSING_INFORMATION', 'Where were they planted? Ask the user for the planting site.');
  const date = checkDate(tool, 'plantingDate', input.plantingDate, true);
  if (isFail(date)) return date;
  const species = await resolveSpecies(tool, c.prisma, input.species);
  if (isFail(species)) return species;
  const assumptions: string[] = [];
  const nursery = await resolveNursery(tool, c.prisma, c.cfa, input.nursery, assumptions);
  if (isFail(nursery)) return nursery;
  const batch = await batchFor(tool, c, species.id, nursery.id, input.quantity, 'plant');
  if (isFail(batch)) return batch;
  const site = input.site.trim().slice(0, 200);
  return ok(tool, {
    kind: 'nursery', name: tool, endpoint: '/api/cfa/planting',
    body: { inventoryId: batch.id, plantingDate: date, quantity: input.quantity, notes: `Planted at ${site}${input.notes ? `. ${input.notes.trim()}` : ''}`.slice(0, 2000) },
    summary: `Plant ${input.quantity} ${speciesLabel(species)} from ${nursery.name} at ${site} on ${date}.`,
    assumptions,
  });
}

/** PRD §4.4 record_seedling_loss */
export async function prepareSeedlingLoss(
  privyUserId: string | null,
  input: { species: string; quantity: number; reason: string; lossDate?: string; nursery?: string; notes?: string },
): Promise<ToolResult<NurseryPlan>> {
  const tool = 'record_seedling_loss';
  const c = await context(tool);
  if (isFail(c)) return c;
  const member = await actingMember(tool, c.prisma, c.cfa, privyUserId);
  if (isFail(member)) return member;
  const bad = checkQuantity(tool, input.quantity);
  if (bad) return bad;
  if (!(LOSS_REASONS as readonly string[]).includes(input.reason)) {
    return fail(tool, 'MISSING_INFORMATION', 'Why were they lost? Ask the user.', [...LOSS_REASONS]);
  }
  const date = checkDate(tool, 'lossDate', input.lossDate, false);
  if (isFail(date)) return date;
  const species = await resolveSpecies(tool, c.prisma, input.species);
  if (isFail(species)) return species;
  const assumptions: string[] = [];
  const nursery = await resolveNursery(tool, c.prisma, c.cfa, input.nursery, assumptions);
  if (isFail(nursery)) return nursery;
  const batch = await batchFor(tool, c, species.id, nursery.id, input.quantity, 'record as lost');
  if (isFail(batch)) return batch;
  const when = date ?? new Date().toISOString().slice(0, 10);
  if (!date) assumptions.push(`Date: ${when} (today)`);
  return ok(tool, {
    kind: 'nursery', name: tool, endpoint: '/api/cfa/loss',
    body: { inventoryId: batch.id, quantity: input.quantity, reason: input.reason as LossReason, lossDate: when, notes: input.notes?.trim() || null },
    summary: `Record ${input.quantity} ${speciesLabel(species)} seedlings in ${nursery.name} as lost (${input.reason}) on ${when}.`,
    assumptions,
  });
}

/** PRD §4.5 record_nursery_activity */
export async function prepareNurseryActivity(
  privyUserId: string | null,
  input: { activityType: string; activityDate?: string; nursery?: string; quantity?: number; notes?: string },
): Promise<ToolResult<NurseryPlan>> {
  const tool = 'record_nursery_activity';
  const c = await context(tool);
  if (isFail(c)) return c;
  const member = await actingMember(tool, c.prisma, c.cfa, privyUserId);
  if (isFail(member)) return member;
  if (input.activityType === 'planting') {
    return fail(tool, 'INVALID_INPUT', 'Planting moves seedlings out of the nursery: use record_seedling_planting instead.');
  }
  if (!(ACTIVITY_TYPES as readonly string[]).includes(input.activityType)) {
    return fail(tool, 'INVALID_INPUT', 'Unknown activity type. Ask the user which one.', ACTIVITY_TYPES.filter((a) => a !== 'planting'));
  }
  if (input.quantity != null) {
    const bad = checkQuantity(tool, input.quantity);
    if (bad) return bad;
  }
  const date = checkDate(tool, 'activityDate', input.activityDate, false);
  if (isFail(date)) return date;
  const assumptions: string[] = [];
  const nursery = await resolveNursery(tool, c.prisma, c.cfa, input.nursery, assumptions);
  if (isFail(nursery)) return nursery;
  const when = date ?? new Date().toISOString().slice(0, 10);
  if (!date) assumptions.push(`Date: ${when} (today)`);
  return ok(tool, {
    kind: 'nursery', name: tool, endpoint: '/api/cfa/activities',
    body: { activityType: input.activityType, locationId: nursery.id, activityDate: when, quantityAffected: input.quantity ?? null, description: input.notes?.trim() || null },
    summary: `Log ${input.activityType.replace('_', ' ')} at ${nursery.name} on ${when}${input.quantity ? ` (${input.quantity} seedlings)` : ''}.`,
    assumptions,
  });
}

/** PRD §4.5 record_survival_audit: on the latest planted batch of the species. */
export async function prepareSurvivalAudit(
  privyUserId: string | null,
  input: { species: string; surviving: number; observationDate?: string; nursery?: string; notes?: string },
): Promise<ToolResult<NurseryPlan>> {
  const tool = 'record_survival_audit';
  const c = await context(tool);
  if (isFail(c)) return c;
  const member = await actingMember(tool, c.prisma, c.cfa, privyUserId);
  if (isFail(member)) return member;
  if (!Number.isInteger(input.surviving) || input.surviving < 0) return fail(tool, 'INVALID_QUANTITY', 'The surviving count must be a whole number, zero or more.');
  const date = checkDate(tool, 'observationDate', input.observationDate, false);
  if (isFail(date)) return date;
  const species = await resolveSpecies(tool, c.prisma, input.species);
  if (isFail(species)) return species;
  const assumptions: string[] = [];
  let locationId: string | undefined;
  if (input.nursery?.trim()) {
    const n = await resolveNursery(tool, c.prisma, c.cfa, input.nursery, assumptions);
    if (isFail(n)) return n;
    locationId = n.id;
  }
  const batch = await c.prisma.seedlingBatch.findFirst({
    where: { cfaId: c.cfa.id, speciesId: species.id, status: 'planted', ...(locationId ? { locationId } : {}) },
    orderBy: [{ plantingDate: 'desc' }, { createdAt: 'desc' }],
  });
  if (!batch) return fail(tool, 'NOT_FOUND', `No planted ${species.commonName} batch is recorded yet, so there is nothing to check.`);
  if (input.surviving > batch.quantity) {
    return fail(tool, 'INVALID_QUANTITY', `The latest planted ${species.commonName} batch had ${batch.quantity} seedlings; ${input.surviving} cannot be surviving.`);
  }
  const when = date ?? new Date().toISOString().slice(0, 10);
  if (!date) assumptions.push(`Date: ${when} (today)`);
  assumptions.push(`Batch: ${batch.quantity} ${species.commonName} planted ${iso(batch.plantingDate)}`);
  const dead = batch.quantity - input.surviving;
  return ok(tool, {
    kind: 'nursery', name: tool, endpoint: '/api/cfa/survival',
    body: { inventoryId: batch.id, observationDate: when, initialQuantity: batch.quantity, aliveQuantity: input.surviving, deadQuantity: dead, notes: input.notes?.trim() || null },
    summary: `Survival check on ${when}: ${input.surviving} of ${batch.quantity} ${species.commonName} alive (${Math.round((input.surviving / batch.quantity) * 1000) / 10}%).`,
    assumptions,
  });
}

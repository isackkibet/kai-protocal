/**
 * Read access to Guardian data (PRD B4, B6, B7, B11). Server-only.
 * Every figure here is read or derived from the database; nothing is stored
 * as a counter and nothing is invented. Aggregates count Verified records
 * only, and report Confirmed-but-unverified separately (B6).
 */

import { sql } from '@/lib/db';
import { NURSERY_ID } from './schema';
import type { ActivityType, RecordStatus } from './constants';

export interface NurserySummary {
  nurseryName: string;
  location: string | null;
  readyStockVerified: number;
  readyStockPendingNet: number;
  capacity: number | null;
  speciesCount: number;
  activeSeedbeds: number;
  baseline: { asOf: string; source: string; status: string } | null;
}

export async function nurserySummary(): Promise<NurserySummary> {
  const [n] = (await sql`SELECT name, location, capacity FROM guardian_nurseries WHERE id = ${NURSERY_ID}`) as {
    name: string; location: string | null; capacity: number | null;
  }[];
  const [stock] = (await sql`
    SELECT
      COALESCE(SUM(CASE WHEN t.direction = 'in' THEN t.quantity ELSE -t.quantity END)
        FILTER (WHERE t.activity_id IS NULL OR a.status = 'verified'), 0)::int AS verified,
      COALESCE(SUM(CASE WHEN t.direction = 'in' THEN t.quantity ELSE -t.quantity END)
        FILTER (WHERE a.status = 'confirmed'), 0)::int AS pending
    FROM guardian_inventory_txns t
    LEFT JOIN guardian_activities a ON a.id = t.activity_id
    WHERE t.nursery_id = ${NURSERY_ID}
  `) as { verified: number; pending: number }[];
  const [counts] = (await sql`
    SELECT
      (SELECT COUNT(*)::int FROM guardian_species WHERE nursery_id = ${NURSERY_ID} AND status = 'active') AS species,
      (SELECT COUNT(*)::int FROM guardian_seedbeds WHERE nursery_id = ${NURSERY_ID} AND status = 'active') AS beds
  `) as { species: number; beds: number }[];
  const [base] = (await sql`
    SELECT to_char(as_of, 'YYYY-MM-DD') AS as_of, source, status FROM guardian_baseline
    WHERE nursery_id = ${NURSERY_ID} AND metric = 'ready_stock'
  `) as { as_of: string; source: string; status: string }[];

  return {
    nurseryName: n?.name ?? 'Nursery',
    location: n?.location ?? null,
    readyStockVerified: stock?.verified ?? 0,
    readyStockPendingNet: stock?.pending ?? 0,
    capacity: n?.capacity ?? null,
    speciesCount: counts?.species ?? 0,
    activeSeedbeds: counts?.beds ?? 0,
    baseline: base ? { asOf: base.as_of, source: base.source, status: base.status } : null,
  };
}

export interface SeedbedRow {
  id: string;
  bedNumber: number;
  method: string | null;
  manager: string | null;
  capacityMax: number | null;
  /** Verified bed-level stock; null when nothing has been recorded against this bed. */
  currentStock: number | null;
  status: string;
}

export async function seedbeds(): Promise<SeedbedRow[]> {
  const rows = (await sql`
    SELECT b.id, b.bed_number, b.method, u.name AS manager, b.capacity_max, b.status,
      (SELECT SUM(CASE WHEN t.direction = 'in' THEN t.quantity ELSE -t.quantity END)::int
         FROM guardian_inventory_txns t JOIN guardian_activities a ON a.id = t.activity_id
        WHERE t.seedbed_id = b.id AND a.status = 'verified') AS current_stock
    FROM guardian_seedbeds b
    LEFT JOIN guardian_users u ON u.id = b.manager_id
    WHERE b.nursery_id = ${NURSERY_ID}
    ORDER BY b.bed_number
  `) as { id: string; bed_number: number; method: string | null; manager: string | null; capacity_max: number | null; status: string; current_stock: number | null }[];
  return rows.map((r) => ({
    id: r.id, bedNumber: r.bed_number, method: r.method, manager: r.manager,
    capacityMax: r.capacity_max, currentStock: r.current_stock, status: r.status,
  }));
}

export async function species(): Promise<{ id: string; name: string; scientificName: string | null }[]> {
  const rows = (await sql`
    SELECT id, name, scientific_name FROM guardian_species
    WHERE nursery_id = ${NURSERY_ID} AND status = 'active' ORDER BY name
  `) as { id: string; name: string; scientific_name: string | null }[];
  return rows.map((r) => ({ id: r.id, name: r.name, scientificName: r.scientific_name }));
}

export interface ActivityRow {
  id: string;
  type: ActivityType;
  date: string;
  quantity: number;
  species: string | null;
  seedbed: number | null;
  toSeedbed: number | null;
  destination: string | null;
  notes: string | null;
  recordedBy: string;
  recordedById: string;
  status: RecordStatus;
  version: number;
  supersedesId: string | null;
  correctionReason: string | null;
  reviewedBy: string | null;
  reviewReason: string | null;
  createdAt: string;
}

export async function activities(filter: {
  from?: string; to?: string; type?: ActivityType; status?: RecordStatus | 'any'; limit?: number; id?: string;
} = {}): Promise<ActivityRow[]> {
  const status = filter.status ?? 'any';
  const rows = (await sql`
    SELECT a.id, a.type, to_char(a.activity_date, 'YYYY-MM-DD') AS date, a.quantity,
      s.name AS species, b1.bed_number AS seedbed, b2.bed_number AS to_seedbed, a.destination, a.notes,
      u.name AS recorded_by, a.recorded_by AS recorded_by_id, a.status, a.version, a.supersedes_id,
      a.correction_reason, r.name AS reviewed_by, a.review_reason, a.created_at
    FROM guardian_activities a
    JOIN guardian_users u ON u.id = a.recorded_by
    LEFT JOIN guardian_users r ON r.id = a.reviewed_by
    LEFT JOIN guardian_species s ON s.id = a.species_id
    LEFT JOIN guardian_seedbeds b1 ON b1.id = a.seedbed_id
    LEFT JOIN guardian_seedbeds b2 ON b2.id = a.to_seedbed_id
    WHERE a.nursery_id = ${NURSERY_ID}
      AND (${filter.id ?? null}::uuid IS NULL OR a.id = ${filter.id ?? null}::uuid)
      AND (${filter.from ?? null}::date IS NULL OR a.activity_date >= ${filter.from ?? null}::date)
      AND (${filter.to ?? null}::date IS NULL OR a.activity_date <= ${filter.to ?? null}::date)
      AND (${filter.type ?? null}::text IS NULL OR a.type = ${filter.type ?? null})
      AND (${status} = 'any' OR a.status = ${status})
    ORDER BY a.activity_date DESC, a.created_at DESC
    LIMIT ${Math.min(Math.max(filter.limit ?? 50, 1), 200)}
  `) as Record<string, unknown>[];
  return rows.map((r) => ({
    id: String(r.id), type: r.type as ActivityType, date: String(r.date), quantity: Number(r.quantity),
    species: (r.species as string) ?? null, seedbed: (r.seedbed as number) ?? null, toSeedbed: (r.to_seedbed as number) ?? null,
    destination: (r.destination as string) ?? null, notes: (r.notes as string) ?? null,
    recordedBy: String(r.recorded_by), recordedById: String(r.recorded_by_id), status: r.status as RecordStatus,
    version: Number(r.version), supersedesId: (r.supersedes_id as string) ?? null,
    correctionReason: (r.correction_reason as string) ?? null, reviewedBy: (r.reviewed_by as string) ?? null,
    reviewReason: (r.review_reason as string) ?? null, createdAt: new Date(String(r.created_at)).toISOString(),
  }));
}

export interface DiaryEntry {
  id: number;
  ts: string;
  actor: string | null;
  eventType: string;
  description: string;
  status: string;
  activityId: string | null;
}

export async function keeperDiary(filter: { query?: string; from?: string; to?: string; limit?: number } = {}): Promise<DiaryEntry[]> {
  const q = filter.query?.trim() ? `%${filter.query.trim().replace(/[%_\\]/g, (m) => `\\${m}`)}%` : null;
  const rows = (await sql`
    SELECT d.id, d.ts, u.name AS actor, d.event_type, d.description, d.status, d.activity_id
    FROM guardian_diary d
    LEFT JOIN guardian_users u ON u.id = d.actor_id
    WHERE (${q}::text IS NULL OR d.description ILIKE ${q} OR d.event_type ILIKE ${q} OR u.name ILIKE ${q})
      AND (${filter.from ?? null}::date IS NULL OR (d.ts AT TIME ZONE 'Africa/Nairobi')::date >= ${filter.from ?? null}::date)
      AND (${filter.to ?? null}::date IS NULL OR (d.ts AT TIME ZONE 'Africa/Nairobi')::date <= ${filter.to ?? null}::date)
    ORDER BY d.ts DESC
    LIMIT ${Math.min(Math.max(filter.limit ?? 30, 1), 200)}
  `) as { id: number; ts: string; actor: string | null; event_type: string; description: string; status: string; activity_id: string | null }[];
  return rows.map((r) => ({
    id: Number(r.id), ts: new Date(r.ts).toISOString(), actor: r.actor, eventType: r.event_type,
    description: r.description, status: r.status, activityId: r.activity_id,
  }));
}

export async function searchKnowledge(query: string, limit = 4): Promise<{ id: string; title: string; snippet: string; url: string | null }[]> {
  const q = query.trim().slice(0, 200);
  if (!q) return [];
  const rows = (await sql`
    SELECT id, title, url,
      ts_headline('english', body, websearch_to_tsquery('english', ${q}), 'MaxWords=45, MinWords=20') AS snippet,
      ts_rank(tsv, websearch_to_tsquery('english', ${q})) AS rank
    FROM guardian_knowledge
    WHERE tsv @@ websearch_to_tsquery('english', ${q})
    ORDER BY rank DESC
    LIMIT ${Math.min(Math.max(limit, 1), 8)}
  `) as { id: string; title: string; url: string | null; snippet: string }[];
  if (rows.length > 0) return rows.map(clean);
  // Fall back to any-word matching for short or conversational queries.
  const words = q.toLowerCase().match(/[a-z]{4,}/g)?.slice(0, 6) ?? [];
  if (words.length === 0) return [];
  const orQuery = words.join(' or ');
  return ((await sql`
    SELECT id, title, url,
      ts_headline('english', body, websearch_to_tsquery('english', ${orQuery}), 'MaxWords=45, MinWords=20') AS snippet
    FROM guardian_knowledge
    WHERE tsv @@ websearch_to_tsquery('english', ${orQuery})
    ORDER BY ts_rank(tsv, websearch_to_tsquery('english', ${orQuery})) DESC
    LIMIT ${Math.min(Math.max(limit, 1), 8)}
  `) as { id: string; title: string; url: string | null; snippet: string }[]).map(clean);
}

/** ts_headline marks matches with <b></b>; answers are plain text. */
function clean<T extends { snippet: string }>(row: T): T {
  return { ...row, snippet: row.snippet.replace(/<\/?b>/g, '').replace(/\s+/g, ' ').trim() };
}

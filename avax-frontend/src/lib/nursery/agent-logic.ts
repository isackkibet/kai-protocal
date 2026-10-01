/**
 * Pure logic for the nursery tools (Kanuvari Tools & Agents PRD §4, §7):
 * the standard tool result, species / nursery name matching, quantity
 * cleaning and inventory totals. No imports, so it runs under `node --test`.
 */

// ── Tool result standard (PRD §7.1, §7.2) ─────────────────────────────────────

export type ToolErrorCode =
  | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'INVALID_INPUT' | 'MISSING_INFORMATION'
  | 'INVALID_SPECIES' | 'INVALID_QUANTITY' | 'DUPLICATE_RECORD' | 'VALIDATION_FAILED'
  | 'CONFLICT' | 'DATABASE_ERROR';

export interface ToolResult<T> {
  success: boolean;
  data?: T;
  error?: { code: ToolErrorCode; message: string; options?: string[] };
  metadata: { timestamp: string; tool: string; version: string };
}

const VERSION = '1.0';
const meta = (tool: string) => ({ timestamp: new Date().toISOString(), tool, version: VERSION });

export function ok<T>(tool: string, data: T): ToolResult<T> {
  return { success: true, data, metadata: meta(tool) };
}

/** `options` lists choices the agent should offer the user (species, nurseries). */
export function fail(tool: string, code: ToolErrorCode, message: string, options?: string[]): ToolResult<never> {
  return { success: false, error: options?.length ? { code, message, options } : { code, message }, metadata: meta(tool) };
}

// ── Name matching ─────────────────────────────────────────────────────────────

/** Lower case, accents and punctuation removed, single spaces. */
export function normalizeName(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Edit distance (insert / delete / substitute), for typo matching. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const up = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = up;
    }
  }
  return prev[b.length];
}

/** "Seedlings" / plurals: "acacias" → "acacia", "seedlings" dropped. */
function stripNoise(s: string): string {
  return normalizeName(s)
    .replace(/\b(seedlings?|trees?|miche|miti|species)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(?<=[a-z]{3})s$/, '');
}

export interface SpeciesLike {
  id: string;
  commonName: string;
  scientificName: string;
  localName?: string | null;
}

export type SpeciesMatch<T extends SpeciesLike> =
  | { status: 'exact'; species: T }
  /** Several species share this name (e.g. two Acacias): the user must pick. */
  | { status: 'ambiguous'; candidates: T[] }
  /** Close but not exact ("Akacia"): the user must confirm. Never used silently. */
  | { status: 'suggest'; candidates: T[] }
  | { status: 'none' };

const label = (s: SpeciesLike) => `${s.commonName} (${s.scientificName})`;
export const speciesLabel = label;

/**
 * PRD §4.3 validate_species_name: exact match on common, scientific or local
 * name (case and plural insensitive; the genus alone also counts when it is
 * unique), otherwise fuzzy suggestions for the agent to confirm with the user.
 */
export function matchSpecies<T extends SpeciesLike>(input: string, catalogue: T[]): SpeciesMatch<T> {
  const q = stripNoise(input);
  if (!q) return { status: 'none' };
  const names = (s: T) => [s.commonName, s.scientificName, s.localName ?? '', label(s)].filter(Boolean).map(stripNoise);

  const exact = catalogue.filter((s) => names(s).includes(q));
  if (exact.length === 1) return { status: 'exact', species: exact[0] };
  if (exact.length > 1) return { status: 'ambiguous', candidates: exact };

  // "Acacia" against "Acacia tortilis": a whole first word of a name.
  const byWord = catalogue.filter((s) => names(s).some((n) => n.split(' ')[0] === q || n.split(' ').includes(q)));
  if (byWord.length === 1) return { status: 'exact', species: byWord[0] };
  if (byWord.length > 1) return { status: 'ambiguous', candidates: byWord };

  const scored = catalogue
    .map((s) => {
      const best = Math.min(...names(s).flatMap((n) => [n, ...n.split(' ')]).map((n) => levenshtein(q, n)));
      return { s, d: best };
    })
    // Allow ~1 typo per 3 letters, at least 1.
    .filter(({ d }) => d <= Math.max(1, Math.floor(q.length / 3)))
    .sort((a, b) => a.d - b.d)
    .slice(0, 5)
    .map(({ s }) => s);
  return scored.length ? { status: 'suggest', candidates: scored } : { status: 'none' };
}

export interface NamedLike { id: string; name: string }

/** Nursery / location by name: exact (normalised) or a single close match. */
export function matchByName<T extends NamedLike>(input: string, items: T[]): { item: T } | { options: T[] } {
  const q = normalizeName(input);
  const exact = items.filter((i) => normalizeName(i.name) === q);
  if (exact.length === 1) return { item: exact[0] };
  const partial = items.filter((i) => normalizeName(i.name).includes(q) || q.includes(normalizeName(i.name)));
  if (partial.length === 1) return { item: partial[0] };
  const close = items.filter((i) => levenshtein(q, normalizeName(i.name)) <= Math.max(1, Math.floor(q.length / 3)));
  if (close.length === 1) return { item: close[0] };
  return { options: items };
}

// ── Quantities (PRD §4.6 clean_conservation_data) ─────────────────────────────

/** "500 trees" → {500, "trees"}; "1,200" → 1200; "1.5k" → 1500. Null if not a whole positive number. */
export function cleanQuantity(raw: unknown): { quantity: number; unit: string } | null {
  if (typeof raw === 'number') return Number.isInteger(raw) && raw > 0 ? { quantity: raw, unit: 'seedlings' } : null;
  if (typeof raw !== 'string') return null;
  const m = raw.trim().toLowerCase().match(/^(\d{1,3}(?:[,\s]\d{3})+|\d+(?:\.\d+)?)\s*(k)?\s*([a-z ]*)$/);
  if (!m) return null;
  let n = Number(m[1].replace(/[,\s]/g, ''));
  if (m[2]) n *= 1000;
  if (!Number.isInteger(n) || n <= 0) return null;
  return { quantity: n, unit: m[3].trim() || 'seedlings' };
}

// ── Inventory totals (PRD §4.4 get_seedling_inventory) ────────────────────────

export interface InventoryRow {
  species: string;
  status: string;
  quantity: number;
}

export interface InventoryTotals {
  species: string;
  available: number;
  planted: number;
  lost: number;
  transferred: number;
  distributed: number;
  total: number;
}

/** Group batch rows by species into the PRD's {available, planted, lost, total}. */
export function summarizeInventory(rows: InventoryRow[]): InventoryTotals[] {
  const by = new Map<string, InventoryTotals>();
  for (const r of rows) {
    const t = by.get(r.species) ?? { species: r.species, available: 0, planted: 0, lost: 0, transferred: 0, distributed: 0, total: 0 };
    if (r.status === 'in_inventory') t.available += r.quantity;
    else if (r.status === 'planted') t.planted += r.quantity;
    else if (r.status === 'dead') t.lost += r.quantity;
    else if (r.status === 'transferred') t.transferred += r.quantity;
    else t.distributed += r.quantity; // sold, distributed
    t.total += r.quantity;
    by.set(r.species, t);
  }
  return [...by.values()].sort((a, b) => b.total - a.total);
}

/** Oldest in-nursery batch that holds at least `quantity` seedlings. */
export function pickBatch<T extends { quantity: number; status: string; createdAt: Date }>(batches: T[], quantity: number): T | null {
  return batches
    .filter((b) => b.status === 'in_inventory' && b.quantity >= quantity)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0] ?? null;
}

export const LOSS_REASONS = ['drought', 'disease', 'damage', 'pests', 'mortality', 'unknown'] as const;
export type LossReason = (typeof LOSS_REASONS)[number];

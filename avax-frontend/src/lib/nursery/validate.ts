/**
 * Input validation for nursery writes. Mirrors the database's CHECK rules
 * (prisma/sql/2026-09-30_oloolua_nursery.sql) so members get a clear message
 * before a write is attempted; the database still enforces every rule.
 *
 * Pure functions — no imports — so they run under `node --test`.
 */

export class FieldError extends Error {
  readonly field: string;
  constructor(field: string, message: string) {
    super(message);
    this.field = field;
  }
}

type Body = Record<string, unknown>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const INVENTORY_STATUSES = ['in_inventory', 'planted', 'transferred', 'dead', 'sold', 'distributed'] as const;
export const ACTIVITY_TYPES = [
  'watering', 'weeding', 'mulching', 'pruning', 'pest_control', 'transplanting', 'distribution', 'planting', 'other',
] as const;
export const MEMBER_ROLES = ['member', 'admin', 'verifier', 'auditor', 'partner'] as const;
export const MEMBER_STATUSES = ['active', 'inactive', 'suspended'] as const;
export type InventoryStatusValue = (typeof INVENTORY_STATUSES)[number];
export type ActivityTypeValue = (typeof ACTIVITY_TYPES)[number];

/** Largest plausible single batch/count — stops one request poisoning totals. */
export const MAX_QUANTITY = 1_000_000;

export function text(body: Body, field: string, opts: { required?: boolean; max?: number } = {}): string | null {
  const raw = body[field];
  if (raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '')) {
    if (opts.required) throw new FieldError(field, `${field} is required.`);
    return null;
  }
  if (typeof raw !== 'string') throw new FieldError(field, `${field} must be text.`);
  const v = raw.trim();
  const max = opts.max ?? 255;
  if (v.length > max) throw new FieldError(field, `${field} must be at most ${max} characters.`);
  return v;
}

export function count(body: Body, field: string, opts: { required?: boolean; min?: number } = {}): number | null {
  const raw = body[field];
  if (raw === undefined || raw === null || raw === '') {
    if (opts.required) throw new FieldError(field, `${field} is required.`);
    return null;
  }
  const n = typeof raw === 'number' ? raw : Number(raw);
  const min = opts.min ?? 0;
  if (!Number.isInteger(n)) throw new FieldError(field, `${field} must be a whole number.`);
  if (n < min) throw new FieldError(field, `${field} must be at least ${min}.`);
  if (n > MAX_QUANTITY) throw new FieldError(field, `${field} is larger than any plausible batch.`);
  return n;
}

export function id(body: Body, field: string, opts: { required?: boolean } = {}): string | null {
  const v = text(body, field, { required: opts.required, max: 36 });
  if (v !== null && !UUID_RE.test(v)) throw new FieldError(field, `${field} is not a valid id.`);
  return v;
}

/** A calendar date "YYYY-MM-DD". Future dates are refused unless allowed. */
export function day(
  body: Body,
  field: string,
  opts: { required?: boolean; allowFuture?: boolean; today?: string } = {},
): string | null {
  const v = text(body, field, { required: opts.required, max: 10 });
  if (v === null) return null;
  if (!DATE_RE.test(v) || Number.isNaN(Date.parse(`${v}T00:00:00Z`)) || new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) !== v) {
    throw new FieldError(field, `${field} must be a date like 2026-09-30.`);
  }
  // Compare to "today" with a day of slack for time zones (Kenya is UTC+3).
  const today = opts.today ?? new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10);
  if (!opts.allowFuture && v > today) throw new FieldError(field, `${field} cannot be in the future.`);
  return v;
}

export function oneOf<T extends string>(body: Body, field: string, allowed: readonly T[], opts: { required?: boolean } = {}): T | null {
  const v = text(body, field, { required: opts.required, max: 40 });
  if (v === null) return null;
  if (!(allowed as readonly string[]).includes(v)) throw new FieldError(field, `${field} must be one of: ${allowed.join(', ')}.`);
  return v as T;
}

export function coordinate(body: Body, field: 'latitude' | 'longitude'): number | null {
  const raw = body[field];
  if (raw === undefined || raw === null || raw === '') return null;
  const n = typeof raw === 'number' ? raw : Number(raw);
  const limit = field === 'latitude' ? 90 : 180;
  if (!Number.isFinite(n) || n < -limit || n > limit) throw new FieldError(field, `${field} must be between -${limit} and ${limit}.`);
  return n;
}

/** Optional JSON metadata: must be a plain object (as the database requires), kept small. */
export function metadata(body: Body, field = 'metadata'): Record<string, unknown> {
  const raw = body[field];
  if (raw === undefined || raw === null) return {};
  if (typeof raw !== 'object' || Array.isArray(raw)) throw new FieldError(field, `${field} must be a JSON object.`);
  if (JSON.stringify(raw).length > 8_000) throw new FieldError(field, `${field} is too large.`);
  return raw as Record<string, unknown>;
}

/** alive + dead must not exceed the initial count (database: check_quantity_sum). */
export function survivalCounts(body: Body) {
  const initialQuantity = count(body, 'initialQuantity', { required: true })!;
  const aliveQuantity = count(body, 'aliveQuantity', { required: true })!;
  const deadQuantity = count(body, 'deadQuantity', { required: true })!;
  if (aliveQuantity + deadQuantity > initialQuantity) {
    throw new FieldError('aliveQuantity', 'Alive plus dead seedlings cannot be more than the initial count.');
  }
  return { initialQuantity, aliveQuantity, deadQuantity };
}

/** Matches the database's generated column: alive / initial × 100, 2 decimals. */
export function survivalRate(initial: number, alive: number): number {
  return initial > 0 ? Math.round((alive / initial) * 10000) / 100 : 0;
}

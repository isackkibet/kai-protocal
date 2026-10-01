/**
 * Deterministic data-quality rules (Ecosystem PRD v1.1 §4.6, §4.12).
 * Pure — no imports — so they run under `node --test` and in the browser.
 */

export interface Check { ok: boolean; reason: string | null }

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const valid = (d: string) => DAY.test(d) && new Date(`${d}T00:00:00Z`).toISOString().slice(0, 10) === d;

/** §4.12 validate_date_range. `today` is the Kenya date (YYYY-MM-DD). */
export function validateDateRange(input: { startDate: string; endDate?: string | null; activityType?: string | null; today: string }): Check {
  const { startDate, endDate, activityType, today } = input;
  if (!valid(startDate)) return { ok: false, reason: 'The start date must be a real date like 2026-09-30.' };
  if (endDate && !valid(endDate)) return { ok: false, reason: 'The end date must be a real date like 2026-09-30.' };
  if (startDate > today || (endDate && endDate > today)) return { ok: false, reason: 'Dates cannot be in the future.' };
  if (endDate && endDate < startDate) return { ok: false, reason: 'The end date is before the start date.' };
  if (startDate < '2000-01-01') return { ok: false, reason: 'The date is before 2000; check the year.' };
  const days = endDate ? (Date.parse(endDate) - Date.parse(startDate)) / 86_400_000 : 0;
  if (activityType === 'planting' && days > 31) return { ok: false, reason: 'A single planting event should not span more than a month; record it as separate plantings.' };
  if (['watering', 'weeding', 'mulching', 'pruning', 'pest_control'].includes(activityType ?? '') && days > 7) {
    return { ok: false, reason: 'Routine nursery work is logged per day or week, not over a longer range.' };
  }
  const ageDays = (Date.parse(today) - Date.parse(startDate)) / 86_400_000;
  if (ageDays > 365) return { ok: true, reason: 'Valid, but more than a year old: confirm it is a late entry.' };
  return { ok: true, reason: null };
}

/**
 * §4.12 validate_tree_count_vs_area. Typical spacing: restoration planting
 * 400–1,600 trees/ha (2.5–5 m apart); above 2,500/ha is implausible for
 * field planting. Nursery beds hold far more (up to ~250,000 seedlings/ha).
 */
export function validateTreeCountVsArea(treeCount: number, areaHectares: number, context: 'planting' | 'nursery' = 'planting') {
  if (!(treeCount > 0) || !(areaHectares > 0)) return { isPlausible: false, densityPerHa: null as number | null, flaggedReason: 'Tree count and area must both be above zero.' };
  const density = treeCount / areaHectares;
  const max = context === 'planting' ? 2_500 : 250_000;
  const min = context === 'planting' ? 50 : 0;
  if (density > max) return { isPlausible: false, densityPerHa: Math.round(density), flaggedReason: `${Math.round(density).toLocaleString()} per hectare is more than the usual maximum of ${max.toLocaleString()} for ${context}. Check the count or the area.` };
  if (density < min) return { isPlausible: true, densityPerHa: Math.round(density), flaggedReason: `Only ${Math.round(density)} per hectare: plausible for enrichment planting, but check the area.` };
  return { isPlausible: true, densityPerHa: Math.round(density), flaggedReason: null };
}

/** "today", "yesterday", "30/09/2026", "30-9-2026", "2026-09-30" → YYYY-MM-DD (Kenya day/month order). */
export function cleanDate(raw: string, today: string): string | null {
  const s = raw.trim().toLowerCase();
  if (['today', 'leo'].includes(s)) return today;
  if (['yesterday', 'jana'].includes(s)) return new Date(Date.parse(today) - 86_400_000).toISOString().slice(0, 10);
  if (valid(s)) return s;
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) {
    const d = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    return valid(d) ? d : null;
  }
  return null;
}

/** Hamming distance of two 64-bit perceptual hashes (16 hex chars). */
export function hammingHex(a: string, b: string): number {
  if (!/^[0-9a-f]{16}$/.test(a) || !/^[0-9a-f]{16}$/.test(b)) return 64;
  let x = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let n = 0;
  while (x > BigInt(0)) { n += Number(x & BigInt(1)); x >>= BigInt(1); }
  return n;
}
/** Up to this many differing bits, two photos are treated as the same picture (re-saved, resized). */
export const DUPLICATE_BITS = 6;

export interface BatchRow { id: string; quantity: number; splitFrom: string | null }

/**
 * §4.12 reconcile_inventory. Every split (planting part of a batch, a loss,
 * a transfer) moves seedlings into a child row; nothing may appear or vanish.
 * For each original batch: original quantity (from the audit log) must equal
 * the current quantity of the batch plus all its descendants.
 */
export function reconcileFamilies(rows: BatchRow[], originals: Map<string, number>) {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const rootOf = (id: string): string => {
    let cur = byId.get(id);
    const seen = new Set<string>();
    while (cur?.splitFrom && byId.has(cur.splitFrom) && !seen.has(cur.id)) { seen.add(cur.id); cur = byId.get(cur.splitFrom); }
    return cur?.id ?? id;
  };
  const totals = new Map<string, number>();
  for (const r of rows) {
    const root = rootOf(r.id);
    totals.set(root, (totals.get(root) ?? 0) + r.quantity);
  }
  const discrepancies: { batchId: string; recorded: number; nowAccountedFor: number; difference: number }[] = [];
  let checked = 0;
  for (const [root, now] of totals) {
    const recorded = originals.get(root);
    if (recorded == null) continue; // no audit CREATE for it (should not happen)
    checked++;
    if (recorded !== now) discrepancies.push({ batchId: root, recorded, nowAccountedFor: now, difference: now - recorded });
  }
  return { isReconciled: discrepancies.length === 0, batchesChecked: checked, discrepancies };
}

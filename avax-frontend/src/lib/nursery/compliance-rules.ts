/**
 * Audit & Compliance scoring (Ecosystem PRD v1.1 §5.8). Pure — no imports —
 * so it runs under `node --test`. Anomalies are flags for a human; the score
 * summarises how much of the data can be relied on, with the reasons.
 */

export type Severity = 'low' | 'medium' | 'high';
export interface Anomaly { kind: string; severity: Severity; count: number; detail: string; examples: string[] }

/** Days whose count is far above normal: above mean + 3·sd and at least `min`. */
export function volumeOutliers(perDay: { day: string; count: number }[], min = 20) {
  if (perDay.length < 3) return perDay.filter((d) => d.count >= min * 3);
  const mean = perDay.reduce((a, d) => a + d.count, 0) / perDay.length;
  const sd = Math.sqrt(perDay.reduce((a, d) => a + (d.count - mean) ** 2, 0) / perDay.length);
  return perDay.filter((d) => d.count >= min && d.count > mean + 3 * sd);
}

export interface IntegrityInput {
  records: number;
  integrityFailures: number;
  verifiedPct: number | null;
  anchoredPct: number | null;
  evidencePct: number | null;
  reconciled: boolean | null;
  anomalies: Anomaly[];
}

/**
 * 0-100. Starts from what share of records are verified, anchored and backed
 * by evidence; tampering and unreconciled inventory weigh most. With no
 * records yet there is nothing to trust or distrust, so the score is null.
 */
export function integrityScore(i: IntegrityInput): { score: number | null; breakdown: { part: string; points: number; max: number }[] } {
  if (i.records === 0) return { score: null, breakdown: [] };
  const part = (name: string, pct: number | null, max: number) => ({ part: name, points: Math.round(((pct ?? 0) / 100) * max), max });
  const breakdown = [
    { part: 'Fingerprints intact', points: Math.round((1 - i.integrityFailures / i.records) * 30), max: 30 },
    part('Verified by a person', i.verifiedPct, 25),
    part('Anchored on Avalanche', i.anchoredPct, 15),
    part('Backed by photo / document', i.evidencePct, 15),
    { part: 'Inventory adds up', points: i.reconciled ? 15 : 0, max: 15 },
  ];
  const penalty = i.anomalies.reduce((a, x) => a + (x.severity === 'high' ? 10 : x.severity === 'medium' ? 4 : 1), 0);
  breakdown.push({ part: 'Open anomalies', points: -Math.min(penalty, 40), max: 0 });
  const score = Math.max(0, Math.min(100, breakdown.reduce((a, b) => a + b.points, 0)));
  return { score, breakdown };
}

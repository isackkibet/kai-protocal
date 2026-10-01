import { test } from 'node:test';
import assert from 'node:assert/strict';
import { integrityScore, volumeOutliers } from './compliance-rules.ts';

test('volume outliers', () => {
  const normal = Array.from({ length: 20 }, (_, i) => ({ day: `d${i}`, count: 4 + (i % 3) }));
  assert.deepEqual(volumeOutliers(normal), []);
  const spike = [...normal, { day: 'spike', count: 80 }];
  assert.deepEqual(volumeOutliers(spike).map((d) => d.day), ['spike']);
  assert.deepEqual(volumeOutliers([{ day: 'a', count: 10 }]), []);
  assert.deepEqual(volumeOutliers([{ day: 'a', count: 70 }]).map((d) => d.day), ['a']);
});

test('integrity score', () => {
  const perfect = integrityScore({ records: 10, integrityFailures: 0, verifiedPct: 100, anchoredPct: 100, evidencePct: 100, reconciled: true, anomalies: [] });
  assert.equal(perfect.score, 100);
  const tampered = integrityScore({ records: 10, integrityFailures: 5, verifiedPct: 100, anchoredPct: 100, evidencePct: 100, reconciled: false, anomalies: [{ kind: 'x', severity: 'high', count: 1, detail: '', examples: [] }] });
  assert.equal(tampered.score, 100 - 15 - 15 - 10);
  assert.equal(integrityScore({ records: 0, integrityFailures: 0, verifiedPct: null, anchoredPct: null, evidencePct: null, reconciled: true, anomalies: [] }).score, null);
  const many = integrityScore({ records: 1, integrityFailures: 0, verifiedPct: 0, anchoredPct: 0, evidencePct: 0, reconciled: true, anomalies: Array(9).fill({ kind: 'x', severity: 'high', count: 1, detail: '', examples: [] }) });
  assert.equal(many.score, 5); // 30 + 15 - 40 (penalty capped)
});

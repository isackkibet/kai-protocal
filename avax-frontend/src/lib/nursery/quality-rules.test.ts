import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanDate, hammingHex, reconcileFamilies, validateDateRange, validateTreeCountVsArea } from './quality-rules.ts';

const today = '2026-10-01';

test('date ranges', () => {
  assert.deepEqual(validateDateRange({ startDate: '2026-09-30', today }), { ok: true, reason: null });
  assert.equal(validateDateRange({ startDate: '2026-10-05', today }).ok, false);
  assert.equal(validateDateRange({ startDate: '2026-09-10', endDate: '2026-09-01', today }).ok, false);
  assert.equal(validateDateRange({ startDate: '2026-02-30', today }).ok, false);
  assert.equal(validateDateRange({ startDate: '1999-12-31', today }).ok, false);
  assert.equal(validateDateRange({ startDate: '2026-07-01', endDate: '2026-09-01', activityType: 'planting', today }).ok, false);
  assert.equal(validateDateRange({ startDate: '2026-09-01', endDate: '2026-09-20', activityType: 'watering', today }).ok, false);
  const old = validateDateRange({ startDate: '2025-01-01', today });
  assert.equal(old.ok, true);
  assert.match(old.reason!, /late entry/);
});

test('tree count vs area', () => {
  assert.equal(validateTreeCountVsArea(1100, 1).isPlausible, true);
  assert.equal(validateTreeCountVsArea(10_000, 1).isPlausible, false);
  assert.equal(validateTreeCountVsArea(10_000, 1, 'nursery').isPlausible, true);
  assert.equal(validateTreeCountVsArea(20, 1).isPlausible, true);
  assert.match(validateTreeCountVsArea(20, 1).flaggedReason!, /enrichment/);
  assert.equal(validateTreeCountVsArea(0, 1).isPlausible, false);
});

test('clean dates (English, Swahili, Kenyan day/month order)', () => {
  assert.equal(cleanDate('today', today), today);
  assert.equal(cleanDate('Jana', today), '2026-09-30');
  assert.equal(cleanDate('30/09/2026', today), '2026-09-30');
  assert.equal(cleanDate('1-9-2026', today), '2026-09-01');
  assert.equal(cleanDate('31/02/2026', today), null);
  assert.equal(cleanDate('soon', today), null);
});

test('perceptual hash distance', () => {
  assert.equal(hammingHex('ffffffffffffffff', 'ffffffffffffffff'), 0);
  assert.equal(hammingHex('ffffffffffffffff', 'fffffffffffffff0'), 4);
  assert.equal(hammingHex('0000000000000000', 'ffffffffffffffff'), 64);
  assert.equal(hammingHex('bad', 'ffffffffffffffff'), 64);
});

test('inventory reconciliation follows splits', () => {
  const rows = [
    { id: 'a', quantity: 650, splitFrom: null },
    { id: 'b', quantity: 200, splitFrom: 'a' }, // transferred
    { id: 'c', quantity: 100, splitFrom: 'a' }, // given away
    { id: 'd', quantity: 50, splitFrom: 'a' },  // lost
    { id: 'e', quantity: 30, splitFrom: 'b' },  // split of a split
    { id: 'x', quantity: 70, splitFrom: null },
  ];
  const ok = reconcileFamilies(rows, new Map([['a', 1030], ['x', 70]]));
  assert.deepEqual(ok, { isReconciled: true, batchesChecked: 2, discrepancies: [] });
  const bad = reconcileFamilies(rows, new Map([['a', 1000], ['x', 70]]));
  assert.equal(bad.isReconciled, false);
  assert.deepEqual(bad.discrepancies[0], { batchId: 'a', recorded: 1000, nowAccountedFor: 1030, difference: 30 });
});

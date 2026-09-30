import { test } from 'node:test';
import assert from 'node:assert/strict';
import { count, day, FieldError, id, metadata, oneOf, survivalCounts, survivalRate, text, coordinate, INVENTORY_STATUSES } from './validate.ts';

test('guide worked example: 1000 planted, 850 alive → 85.00%', () => {
  assert.deepEqual(survivalCounts({ initialQuantity: 1000, aliveQuantity: 850, deadQuantity: 150 }), { initialQuantity: 1000, aliveQuantity: 850, deadQuantity: 150 });
  assert.equal(survivalRate(1000, 850), 85);
  assert.equal(survivalRate(3, 2), 66.67);
  assert.equal(survivalRate(0, 0), 0);
});

test('guide worked example: 900 alive + 200 dead of 1000 is rejected', () => {
  assert.throws(() => survivalCounts({ initialQuantity: 1000, aliveQuantity: 900, deadQuantity: 200 }), FieldError);
});

test('counts must be whole, non-negative and plausible', () => {
  assert.equal(count({ q: '40' }, 'q'), 40);
  assert.throws(() => count({ q: -1 }, 'q'), FieldError);
  assert.throws(() => count({ q: 2.5 }, 'q'), FieldError);
  assert.throws(() => count({ q: 5_000_000 }, 'q'), FieldError);
  assert.throws(() => count({}, 'q', { required: true }), FieldError);
  assert.equal(count({}, 'q'), null);
});

test('dates are YYYY-MM-DD, real, and not in the future', () => {
  assert.equal(day({ d: '2026-09-30' }, 'd', { today: '2026-09-30' }), '2026-09-30');
  assert.throws(() => day({ d: '2026-02-30' }, 'd'), FieldError);
  assert.throws(() => day({ d: '30/09/2026' }, 'd'), FieldError);
  assert.throws(() => day({ d: '2026-10-05' }, 'd', { today: '2026-09-30' }), FieldError);
  assert.equal(day({ d: '2026-10-05' }, 'd', { today: '2026-09-30', allowFuture: true }), '2026-10-05');
});

test('ids must be UUIDs (stops injection through id fields)', () => {
  assert.equal(id({ x: '3f0c8a52-6f1e-4d6b-9a4b-2b1e0c9d8f7a' }, 'x'), '3f0c8a52-6f1e-4d6b-9a4b-2b1e0c9d8f7a');
  assert.throws(() => id({ x: "1' OR '1'='1" }, 'x'), FieldError);
});

test('status and activity values come from the fixed lists', () => {
  assert.equal(oneOf({ s: 'planted' }, 's', INVENTORY_STATUSES), 'planted');
  assert.throws(() => oneOf({ s: 'verified' }, 's', INVENTORY_STATUSES), FieldError);
});

test('metadata must be a small JSON object, like the database requires', () => {
  assert.deepEqual(metadata({ metadata: { condition: 'healthy', height_cm: 18 } }), { condition: 'healthy', height_cm: 18 });
  assert.deepEqual(metadata({}), {});
  assert.throws(() => metadata({ metadata: [1, 2] }), FieldError);
  assert.throws(() => metadata({ metadata: 'x' }), FieldError);
  assert.throws(() => metadata({ metadata: { big: 'x'.repeat(9000) } }), FieldError);
});

test('text is trimmed and length-limited; GPS is range-checked', () => {
  assert.equal(text({ n: '  Croton  ' }, 'n'), 'Croton');
  assert.throws(() => text({ n: 'x'.repeat(300) }, 'n'), FieldError);
  assert.throws(() => text({ n: 42 }, 'n'), FieldError);
  assert.equal(coordinate({ latitude: -1.3582 }, 'latitude'), -1.3582);
  assert.throws(() => coordinate({ latitude: 95 }, 'latitude'), FieldError);
  assert.throws(() => coordinate({ longitude: 'abc' }, 'longitude'), FieldError);
});

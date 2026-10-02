import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tierFor } from './tiers.ts';

test('levels start at 0, 250, 750 and 2000 points', () => {
  assert.equal(tierFor(0).tier.name, 'Seedling Explorer');
  assert.equal(tierFor(0).nextAt, 250);
  assert.equal(tierFor(249).index, 0);
  assert.equal(tierFor(250).tier.name, 'Eco Guardian');
  assert.equal(tierFor(1999).tier.boost, '1.8x');
  assert.equal(tierFor(2000).tier.name, 'Planetary Steward');
  assert.equal(tierFor(9999).nextAt, 5000);
});

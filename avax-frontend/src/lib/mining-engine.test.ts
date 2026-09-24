import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DAY_MS,
  decayHashPower,
  gainHashPower,
  claimMultiplier,
  applyTreasuryCut,
} from './mining-engine-math.ts';
import { MINING_CONFIG } from './mining-config.ts';

const {
  HP_DECAY_RATE_PER_DAY,
  HP_MULTIPLIER_CAP,
  HP_NORMALIZATION,
  CLAIM_TREASURY_CUT,
  BASE_DAILY_CLAIM,
} = MINING_CONFIG;

test('brand-new user with zero hash power claims the floor (multiplier = 1)', () => {
  const m = claimMultiplier(0, HP_NORMALIZATION, HP_MULTIPLIER_CAP);
  assert.equal(m, 1);
  assert.equal(+ (BASE_DAILY_CLAIM * m).toFixed(4), BASE_DAILY_CLAIM);
});

test('active-daily user has higher hash power than same-XP-then-dormant user (AC-2)', () => {
  const xpPerDay = 3; // e.g. one TIER_1 event per day
  const days = 7;

  // User A: active every day — hash power re-decayed+gained daily
  let a = 0;
  for (let i = 0; i < days; i++) {
    a = gainHashPower(decayHashPower(a, DAY_MS, HP_DECAY_RATE_PER_DAY), xpPerDay, 1);
  }

  // User B: gains all XP on day 1, then dormant 6 days
  let b = gainHashPower(0, xpPerDay * days, 1);
  b = decayHashPower(b, DAY_MS * 6, HP_DECAY_RATE_PER_DAY);

  assert.ok(a > b, `active daily HP ${a} should beat dormant HP ${b}`);
});

test('decay: hash power idles down ~5% per inactive day', () => {
  const hp = 100;
  const after1Day = decayHashPower(hp, DAY_MS, 0.95);
  const after7Days = decayHashPower(hp, DAY_MS * 7, 0.95);
  assert.ok(Math.abs(after1Day - 95) < 0.0001);
  // 0.95^7 ≈ 0.6983 → 69.83
  assert.ok(Math.abs(after7Days - 69.83) < 0.05);
  // no decay for zero elapsed
  assert.equal(decayHashPower(hp, 0, 0.95), hp);
});

test('multiplier is capped at HP_MULTIPLIER_CAP (AC-4)', () => {
  const huge = HP_NORMALIZATION * 1000;
  const m = claimMultiplier(huge, HP_NORMALIZATION, HP_MULTIPLIER_CAP);
  assert.equal(m, HP_MULTIPLIER_CAP);
  // a claim at the cap never exceeds BASE * cap
  const claim = BASE_DAILY_CLAIM * m;
  assert.ok(claim <= BASE_DAILY_CLAIM * HP_MULTIPLIER_CAP);
});

test('multiplier is never below 1', () => {
  assert.equal(claimMultiplier(-500, HP_NORMALIZATION, HP_MULTIPLIER_CAP), 1);
});

test('claim amount scales linearly below the cap', () => {
  const m = claimMultiplier(HP_NORMALIZATION, HP_NORMALIZATION, HP_MULTIPLIER_CAP); // 2x
  assert.equal(m, 2);
});

test('treasury cut splits claim correctly (spec §4.1)', () => {
  const claim = 100;
  const { userAmount, treasuryAmount } = applyTreasuryCut(claim, CLAIM_TREASURY_CUT);
  assert.equal(userAmount + treasuryAmount, claim);
  assert.equal(treasuryAmount, claim * CLAIM_TREASURY_CUT);
});
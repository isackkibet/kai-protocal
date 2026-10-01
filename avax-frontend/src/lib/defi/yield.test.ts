import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allocate, breakEvenDays, expectedIlPct, scoreOptions, type YieldOption } from './yield.ts';

const vault = (id: string, apyPct: number, tvlUsd = 50_000): YieldOption => ({ id, kind: 'vault', token: id, apyPct, tvlUsd, complexity: 1 });

test('expected IL grows with time and volatility, and is never positive', () => {
  assert.ok(expectedIlPct(30, 0.6) < 0);
  assert.ok(expectedIlPct(365, 0.6) < expectedIlPct(30, 0.6));
  assert.ok(expectedIlPct(365, 0.05) > expectedIlPct(365, 0.6));
});

test('break-even days', () => {
  assert.equal(breakEvenDays(1000, 36.5, 1), 1);
  assert.equal(breakEvenDays(100, 10, 5), 183);
  assert.equal(breakEvenDays(100, 0, 5), null);
});

test('ranking: higher APY first, low TVL and LPs penalised, unknown APY last', () => {
  const s = scoreOptions([
    vault('kvA', 7.5), vault('kvB', 22, 3_000), vault('kvC', 15),
    { id: 'NVR/yBOB', kind: 'pool', token: 'NVR', apyPct: null, tvlUsd: 3_500, complexity: 2 },
  ], { capitalUsd: 1000, horizonDays: 90, risk: 'moderate', gasUsd: 0.01 });
  assert.equal(s[0].id, 'kvC');
  assert.equal(s[s.length - 1].id, 'NVR/yBOB');
  assert.equal(s[s.length - 1].suitable, false);
  assert.match(s.find((x) => x.id === 'kvB')!.riskFactors.join(' '), /Low TVL/);
});

test('conservative users never get high-risk options', () => {
  const s = scoreOptions([{ id: 'LP', kind: 'pool', token: 'x', apyPct: 80, tvlUsd: 2_000, complexity: 2 }], { capitalUsd: 1000, horizonDays: 30, risk: 'conservative', gasUsd: 0 });
  assert.equal(s[0].riskLevel, 'high');
  assert.equal(s[0].suitable, false);
});

test('gas not earned back within the horizon is unsuitable', () => {
  const s = scoreOptions([vault('kvA', 5)], { capitalUsd: 10, horizonDays: 30, risk: 'aggressive', gasUsd: 5 });
  assert.equal(s[0].suitable, false);
  assert.match(s[0].why, /Gas/);
});

test('allocation never puts more than 30% in one option', () => {
  const s = scoreOptions([vault('a', 10), vault('b', 9), vault('c', 8), vault('d', 7), vault('e', 6)], { capitalUsd: 1000, horizonDays: 180, risk: 'moderate', gasUsd: 0 });
  const { plan, keepInWalletPct } = allocate(s, 1000);
  assert.deepEqual(plan.map((p) => p.pct), [30, 30, 30, 10]);
  assert.equal(keepInWalletPct, 0);
  const two = allocate(scoreOptions([vault('a', 10), vault('b', 9)], { capitalUsd: 1000, horizonDays: 180, risk: 'moderate', gasUsd: 0 }), 1000);
  assert.equal(two.keepInWalletPct, 40);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  fromUnits, impermanentLoss, isStale, isqrt, quoteAddLiquidity, quoteRemoveLiquidity, quoteSwap, toUnits,
  vaultAssetsFor, vaultSharesFor, MIN_LIQUIDITY,
} from './math.ts';

const E = (n: number | string) => toUnits(String(n));

test('swap = KaiPool.getAmountOut (0.3% fee, x*y=k)', () => {
  const q = quoteSwap(E(10), E(1000), E(1500));
  // 10*0.997*1500 / (1000 + 10*0.997)
  const expected = (E(10) * BigInt(9970) * E(1500)) / (E(1000) * BigInt(10000) + E(10) * BigInt(9970));
  assert.equal(q.amountOut, expected);
  assert.equal(q.fee, E('0.03'));
  assert.ok(q.priceImpact > 0.012 && q.priceImpact < 0.014, String(q.priceImpact));
  assert.equal(q.minOut, (q.amountOut * BigInt(9950)) / BigInt(10000));
});

test('swap edge cases: tiny, huge, empty pool, zero', () => {
  const tiny = quoteSwap(BigInt(1000), E(1000), E(1500));
  assert.ok(tiny.amountOut > BigInt(0) && tiny.priceImpact < 0.01);
  const huge = quoteSwap(E(1_000_000), E(1000), E(1500));
  assert.ok(huge.amountOut < E(1500) && huge.priceImpact > 0.99);
  assert.equal(quoteSwap(E(1), BigInt(0), E(5)).amountOut, BigInt(0));
  assert.throws(() => quoteSwap(BigInt(0), E(1), E(1)));
});

test('k never decreases after a swap', () => {
  const rIn = E(1000), rOut = E(1500), amt = E(37);
  const q = quoteSwap(amt, rIn, rOut);
  assert.ok((rIn + amt) * (rOut - q.amountOut) >= rIn * rOut);
});

test('add / remove liquidity = KaiPool', () => {
  const first = quoteAddLiquidity(E(100), E(400), BigInt(0), BigInt(0), BigInt(0));
  assert.equal(first.lpTokens, isqrt(E(100) * E(400)) - MIN_LIQUIDITY);
  const next = quoteAddLiquidity(E(10), E(50), E(100), E(400), E(200));
  assert.equal(next.lpTokens, E(20)); // min(10*200/100, 50*200/400=25)
  assert.ok(Math.abs(next.sharePct - (20 / 220) * 100) < 1e-9);
  assert.deepEqual(quoteRemoveLiquidity(E(20), E(110), E(450), E(220)), { amountA: E(10), amountB: (E(20) * E(450)) / E(220) });
  assert.throws(() => quoteRemoveLiquidity(E(300), E(1), E(1), E(220)));
});

test('vault shares = KaiVault.previewDeposit / previewWithdraw', () => {
  assert.equal(vaultSharesFor(E(5), BigInt(0), BigInt(0)), E(5));
  assert.equal(vaultSharesFor(E(10), E(110), E(100)), (E(10) * E(100)) / E(110));
  assert.equal(vaultAssetsFor(E(10), E(110), E(100)), E(11));
  assert.equal(vaultAssetsFor(E(1), E(1), BigInt(0)), BigInt(0));
});

test('impermanent loss matches the textbook 2*sqrt(r)/(1+r) - 1', () => {
  for (const r of [0.25, 0.5, 2, 4, 9]) {
    // pool with 100 token0 at entry price 1 USD each side; token0 price moves by r
    const amount0 = 100 / Math.sqrt(r), amount1 = 100 * Math.sqrt(r);
    const il = impermanentLoss(amount0, amount1, 1, 1, r, 1);
    const ref = (2 * Math.sqrt(r)) / (1 + r) - 1;
    assert.ok(Math.abs(il.ilPct / 100 - ref) < 1e-9, `r=${r}`);
    assert.ok(il.ilUsd <= 0);
  }
  assert.equal(impermanentLoss(100, 100, 1, 1, 1, 1).ilPct, 0);
  assert.throws(() => impermanentLoss(0, 1, 1, 1, 1, 1));
});

test('stale data and unit conversion', () => {
  assert.equal(isStale(0, 5 * 60_000), false);
  assert.equal(isStale(0, 5 * 60_000 + 1), true);
  assert.equal(fromUnits(E('12.5')), '12.5');
  assert.equal(fromUnits(BigInt(1)), '0');
  assert.equal(toUnits('0.000000000000000001'), BigInt(1));
  assert.throws(() => toUnits('-1'));
  assert.throws(() => toUnits('abc'));
});

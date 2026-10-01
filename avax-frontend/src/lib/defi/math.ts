/**
 * KAI DeFi math (Kanuvari / KAI Ecosystem PRD v1.1 §4.14-§4.16), written to
 * match the deployed contracts exactly:
 *   - KaiPool: constant product x·y = k with a 0.3% fee kept in the pool
 *     (getAmountOut), LP minted = sqrt(a·b) − 1000 on the first deposit,
 *     else min(a·S/rA, b·S/rB); removal pays lp·r/S of each reserve.
 *   - KaiVault: shares = assets·S/T (1:1 when empty); assets = shares·T/S.
 * All amounts are bigint base units (18 decimals), like on-chain.
 * Pure — no imports — so it runs under `node --test`.
 */

export const FEE_NUM = BigInt(30);
export const FEE_DENOM = BigInt(10_000);
export const MIN_LIQUIDITY = BigInt(1_000);
export const ONE = BigInt(10) ** BigInt(18);
const ZERO = BigInt(0);

/** Integer square root (Babylonian), same as KaiPool._sqrt. */
export function isqrt(x: bigint): bigint {
  if (x < ZERO) throw new Error('negative');
  if (x < BigInt(2)) return x;
  let z = x;
  let y = (x + BigInt(1)) / BigInt(2);
  while (y < z) { z = y; y = (x / y + y) / BigInt(2); }
  return z;
}

export interface SwapQuote {
  amountOut: bigint;
  fee: bigint;
  /** Fraction (0.012 = 1.2%) by which the execution price is worse than the spot price. */
  priceImpact: number;
  /** Fewest tokens the user accepts at this slippage tolerance: goes on-chain as minOut. */
  minOut: bigint;
}

/** KaiPool.getAmountOut plus the numbers a user needs to decide. */
export function quoteSwap(amountIn: bigint, reserveIn: bigint, reserveOut: bigint, slippageBps = 50): SwapQuote {
  if (amountIn <= ZERO) throw new Error('amount must be positive');
  if (reserveIn <= ZERO || reserveOut <= ZERO) return { amountOut: ZERO, fee: ZERO, priceImpact: 1, minOut: ZERO };
  const inWithFee = amountIn * (FEE_DENOM - FEE_NUM);
  const amountOut = (inWithFee * reserveOut) / (reserveIn * FEE_DENOM + inWithFee);
  const fee = (amountIn * FEE_NUM) / FEE_DENOM;
  // Spot: reserveOut/reserveIn per token in. Execution: amountOut/amountIn.
  const spot = Number(reserveOut) / Number(reserveIn);
  const exec = Number(amountOut) / Number(amountIn);
  const priceImpact = Math.max(0, 1 - exec / spot);
  const minOut = (amountOut * (FEE_DENOM - BigInt(slippageBps))) / FEE_DENOM;
  return { amountOut, fee, priceImpact, minOut };
}

/** LP tokens minted for adding (amountA, amountB) and the resulting pool share. */
export function quoteAddLiquidity(amountA: bigint, amountB: bigint, reserveA: bigint, reserveB: bigint, supply: bigint) {
  if (amountA <= ZERO || amountB <= ZERO) throw new Error('amounts must be positive');
  let lp: bigint;
  if (supply === ZERO) {
    const root = isqrt(amountA * amountB);
    if (root <= MIN_LIQUIDITY) throw new Error('first deposit too small');
    lp = root - MIN_LIQUIDITY;
  } else {
    const a = (amountA * supply) / reserveA;
    const b = (amountB * supply) / reserveB;
    lp = a < b ? a : b;
  }
  const newSupply = supply === ZERO ? lp + MIN_LIQUIDITY : supply + lp;
  // The side that is not fully used stays in the user's wallet only if they
  // add the ratio-matched amount; tell them the ratio the pool expects.
  const ratio = reserveA > ZERO ? Number(reserveB) / Number(reserveA) : Number(amountB) / Number(amountA);
  return { lpTokens: lp, sharePct: (Number(lp) / Number(newSupply)) * 100, poolRatioBPerA: ratio };
}

/** Tokens returned for burning `lp` LP tokens. */
export function quoteRemoveLiquidity(lp: bigint, reserveA: bigint, reserveB: bigint, supply: bigint) {
  if (lp <= ZERO) throw new Error('amount must be positive');
  if (supply === ZERO || lp > supply) throw new Error('more LP than exists');
  return { amountA: (lp * reserveA) / supply, amountB: (lp * reserveB) / supply };
}

/** KaiVault.previewDeposit */
export function vaultSharesFor(assets: bigint, totalAssets: bigint, supply: bigint): bigint {
  if (assets <= ZERO) throw new Error('amount must be positive');
  return supply === ZERO || totalAssets === ZERO ? assets : (assets * supply) / totalAssets;
}

/** KaiVault.previewWithdraw */
export function vaultAssetsFor(shares: bigint, totalAssets: bigint, supply: bigint): bigint {
  if (shares <= ZERO) throw new Error('amount must be positive');
  return supply === ZERO ? ZERO : (shares * totalAssets) / supply;
}

/**
 * Impermanent loss of an LP position (PRD §4.16 get_unrealized_il).
 * The position holds amount0/amount1 now; at entry the same liquidity
 * (amount0·amount1 constant) sat at the entry price ratio. Compare the LP
 * value now with simply holding the entry amounts. Prices in USD.
 * Equals the textbook 2·√r/(1+r) − 1 for price ratio change r.
 */
export function impermanentLoss(
  amount0: number, amount1: number,
  entryPrice0: number, entryPrice1: number,
  price0: number, price1: number,
) {
  if ([amount0, amount1, entryPrice0, entryPrice1, price0, price1].some((v) => !(v > 0))) throw new Error('all inputs must be positive');
  const k = amount0 * amount1;
  const entryRatio = entryPrice0 / entryPrice1; // token0 in token1 at entry
  const held0 = Math.sqrt(k / entryRatio);
  const held1 = Math.sqrt(k * entryRatio);
  const lpValue = amount0 * price0 + amount1 * price1;
  const holdValue = held0 * price0 + held1 * price1;
  return { lpValueUsd: lpValue, holdValueUsd: holdValue, ilUsd: lpValue - holdValue, ilPct: (lpValue / holdValue - 1) * 100 };
}

/** Prices and reserves older than this are flagged to the user (PRD §4.20). */
export const STALE_MS = 5 * 60_000;
export function isStale(fetchedAt: number, now = Date.now()): boolean {
  return now - fetchedAt > STALE_MS;
}

/** bigint base units → decimal string, trimmed. */
export function fromUnits(v: bigint, decimals = 18, digits = 6): string {
  const neg = v < ZERO;
  const abs = neg ? -v : v;
  const base = BigInt(10) ** BigInt(decimals);
  const whole = abs / base;
  const frac = (abs % base).toString().padStart(decimals, '0').slice(0, digits).replace(/0+$/, '');
  return `${neg ? '-' : ''}${whole}${frac ? `.${frac}` : ''}`;
}

/** Decimal string → bigint base units. Throws on bad input. */
export function toUnits(v: string | number, decimals = 18): bigint {
  const s = String(v).trim();
  if (!/^\d+(\.\d+)?$/.test(s)) throw new Error(`not a positive number: ${v}`);
  const [w, f = ''] = s.split('.');
  return BigInt(w) * BigInt(10) ** BigInt(decimals) + BigInt((f + '0'.repeat(decimals)).slice(0, decimals) || '0');
}

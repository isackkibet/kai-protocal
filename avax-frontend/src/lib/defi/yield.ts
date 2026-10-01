/**
 * Yield Optimizer logic (Ecosystem PRD v1.1 §5.7). Pure — no imports — so it
 * runs under `node --test`. Every assumption is returned with the result so
 * the agent can state it (PRD: "state all assumptions").
 */

export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';

export interface YieldOption {
  id: string;
  kind: 'vault' | 'pool';
  token: string;
  /** Annual yield in percent; null when unknown (pools have no volume history yet). */
  apyPct: number | null;
  tvlUsd: number | null;
  /** 1 = single-asset vault, 2 = LP position (two tokens, IL). */
  complexity: 1 | 2;
  /** For pools: true when both tokens track a stable reference (lower IL). */
  stablePair?: boolean;
}

/** Assumed annual volatility of the price RATIO in a pool (testnet: no market data). */
export const ASSUMED_VOLATILITY = { stable: 0.05, volatile: 0.6 } as const;
export const LOW_TVL_USD = 10_000;
export const MAX_SHARE = 0.3;

/** Expected impermanent loss (%, negative) for a one-sigma move over `days`. */
export function expectedIlPct(days: number, annualVol: number): number {
  const r = Math.exp(annualVol * Math.sqrt(days / 365));
  return ((2 * Math.sqrt(r)) / (1 + r) - 1) * 100;
}

/** Days until the yield pays back the gas spent to enter and exit. */
export function breakEvenDays(capitalUsd: number, apyPct: number, gasUsd: number): number | null {
  const daily = (capitalUsd * apyPct) / 100 / 365;
  if (!(daily > 0)) return null;
  return Math.ceil(gasUsd / daily);
}

const RISK_WEIGHT: Record<RiskTolerance, number> = { conservative: 2, moderate: 1, aggressive: 0.4 };
/** Extra annual yield a moderate user needs per unit of risk (assumption, stated to the user). */
export const RISK_PREMIUM_PCT_PER_YEAR = 10;

export interface ScoredOption extends YieldOption {
  expectedYieldPct: number | null;
  expectedYieldUsd: number | null;
  expectedIlPct: number;
  breakEvenDays: number | null;
  riskFactors: string[];
  riskLevel: 'low' | 'medium' | 'high';
  score: number | null;
  suitable: boolean;
  why: string;
}

export function scoreOptions(
  options: YieldOption[],
  input: { capitalUsd: number; horizonDays: number; risk: RiskTolerance; gasUsd: number },
): ScoredOption[] {
  const w = RISK_WEIGHT[input.risk];
  return options.map((o) => {
    const riskFactors: string[] = [];
    if (o.tvlUsd != null && o.tvlUsd < LOW_TVL_USD) riskFactors.push(`Low TVL ($${Math.round(o.tvlUsd).toLocaleString()}): hard to exit large amounts`);
    if (o.complexity === 2) riskFactors.push('Two-token LP: impermanent loss if prices move apart');
    riskFactors.push('Testnet contract, internal review only');
    const il = o.kind === 'pool' ? expectedIlPct(input.horizonDays, o.stablePair ? ASSUMED_VOLATILITY.stable : ASSUMED_VOLATILITY.volatile) : 0;
    const expectedYieldPct = o.apyPct == null ? null : (o.apyPct * input.horizonDays) / 365;
    const net = expectedYieldPct == null ? null : expectedYieldPct + il;
    const riskPoints = riskFactors.length - 1 + (o.complexity - 1) + (o.tvlUsd == null ? 1 : 0);
    const riskLevel: ScoredOption['riskLevel'] = riskPoints >= 2 ? 'high' : riskPoints === 1 ? 'medium' : 'low';
    // Net expected % over the horizon minus a risk premium: 10%/year per risk
    // point for a moderate user (20% conservative, 4% aggressive), pro-rated.
    const score = net == null ? null : net - w * RISK_PREMIUM_PCT_PER_YEAR * riskPoints * (input.horizonDays / 365);
    const be = o.apyPct == null ? null : breakEvenDays(input.capitalUsd, o.apyPct, input.gasUsd);
    const suitable = net != null && net > 0 && (be == null || be <= input.horizonDays) && !(input.risk === 'conservative' && riskLevel === 'high');
    const why = o.apyPct == null
      ? 'APY unknown: no trading-volume history yet, so it cannot be ranked.'
      : !suitable
        ? (be != null && be > input.horizonDays ? `Gas is not earned back within ${input.horizonDays} days.` : input.risk === 'conservative' && riskLevel === 'high' ? 'Too risky for a conservative plan.' : 'Expected loss is larger than the yield.')
        : `${o.apyPct}% APY${o.kind === 'pool' ? `, minus about ${Math.abs(il).toFixed(2)}% expected IL` : ''}; ${riskLevel} risk.`;
    return {
      ...o, expectedYieldPct, expectedYieldUsd: expectedYieldPct == null ? null : (input.capitalUsd * expectedYieldPct) / 100,
      expectedIlPct: il, breakEvenDays: be, riskFactors, riskLevel, score, suitable, why,
    };
  }).sort((a, b) => (b.score ?? -Infinity) - (a.score ?? -Infinity));
}

/**
 * Split capital across the best suitable options, at most 30% in any one
 * (PRD §5.7 diversification). Whatever cannot be placed stays in the wallet.
 */
export function allocate(scored: ScoredOption[], capitalUsd: number) {
  const picks = scored.filter((s) => s.suitable).slice(0, 4);
  const plan: { id: string; pct: number; usd: number }[] = [];
  let left = 1;
  for (const p of picks) {
    const pct = Math.min(MAX_SHARE, left);
    if (pct <= 0) break;
    plan.push({ id: p.id, pct: Math.round(pct * 100), usd: Math.round(capitalUsd * pct * 100) / 100 });
    left -= pct;
  }
  return { plan, keepInWalletPct: Math.round(left * 100) };
}

/**
 * Pure math for the Nuvari v4 Hash Power engine (spec §3, §4). No DB / no
 * side effects — these functions are unit-tested directly in
 * `mining-engine.test.ts`.
 */

export const DAY_MS = 86_400_000;

/**
 * Decay a hashPower figure after `elapsedMs` of inactivity.
 * `decayPerDay` is the fraction retained per full inactive day (e.g. 0.95).
 */
export function decayHashPower(hashPower: number, elapsedMs: number, decayPerDay: number): number {
  if (elapsedMs <= 0) return hashPower;
  const days = elapsedMs / DAY_MS;
  return hashPower * Math.pow(decayPerDay, days);
}

/**
 * Hash Power gain from freshly earned XP since last activity, per spec §3.3:
 *   newHashPower = decayed + (xpEarnedSinceLastUpdate * HP_GAIN_PER_XP)
 */
export function gainHashPower(decayed: number, xpEarnedSinceLastUpdate: number, hpGainPerXp: number): number {
  return decayed + xpEarnedSinceLastUpdate * hpGainPerXp;
}

/**
 * Daily-claim multiplier per spec §4.1:
 *   multiplier = min(1 + (hashPower / HP_NORMALIZATION), HP_MULTIPLIER_CAP)
 */
export function claimMultiplier(hashPower: number, hpNormalization: number, hpMultiplierCap: number): number {
  const m = 1 + hashPower / hpNormalization;
  return Math.max(1, Math.min(m, hpMultiplierCap));
}

/**
 * Claim amount + treasury split per spec §4.1:
 *   claimAmount = BASE_DAILY_CLAIM * multiplier
 *   user amount  = claimAmount * (1 - CLAIM_TREASURY_CUT)
 *   treasury cut = claimAmount * CLAIM_TREASURY_CUT
 */
export function applyTreasuryCut(claimAmount: number, treasuryCut: number): { userAmount: number; treasuryAmount: number } {
  return {
    userAmount: claimAmount * (1 - treasuryCut),
    treasuryAmount: claimAmount * treasuryCut,
  };
}
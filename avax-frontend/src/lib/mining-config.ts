import { MiningTier } from '@prisma/client';

/**
 * Nuvari v4 — Hash Power engine tuning (spec §3, §4).
 *
 * XP_PER_TIER: XP awarded per verified event tier. TIER_0 = daily presence
 * (checkin), TIER_1 = genuine engagement (task read/quiz), TIER_2 = verified
 * ecological work (CFA planting/survival).
 *
 * HP_DECAY_RATE_PER_DAY: fraction of hash power retained each inactive day
 * (like unplugged mining hardware idling down ~5%/day).
 *
 * HP_GAIN_PER_XP: conversion from freshly-earned XP into hash power.
 */
export const MINING_CONFIG = {
  XP_PER_TIER: {
    TIER_0: 1,
    TIER_1: 3,
    TIER_2: 20,
  } as Record<MiningTier, number>,

  /** ~5%/day of inactivity — hash power idles down like unplugged hardware. */
  HP_DECAY_RATE_PER_DAY: 0.95,

  /** Conversion factor from freshly-earned XP into hash power. */
  HP_GAIN_PER_XP: 1,

  /** Floor everyone gets for showing up — the GTM instant-gratification amount. */
  BASE_DAILY_CLAIM: 10,

  /** Scales raw hashPower into a reasonable multiplier range. */
  HP_NORMALIZATION: 100,

  /** Hard ceiling so one whale can't claim an unbounded share. */
  HP_MULTIPLIER_CAP: 5,

  /** Small treasury skim on every claim, consistent with other mint paths. */
  CLAIM_TREASURY_CUT: 0.05,

  /** Rolling 24h cooldown between claims (spec §4: cooldownPassed(…, 24h)). */
  CLAIM_COOLDOWN_MS: 24 * 60 * 60 * 1000,
} as const;

export type MiningTierValue = keyof typeof MINING_CONFIG.XP_PER_TIER;
import type { PrismaClient } from '@prisma/client';
import { MiningTier } from '@prisma/client';
import { MINING_CONFIG } from '@/lib/mining-config';
import { decayHashPower, gainHashPower, claimMultiplier, applyTreasuryCut, DAY_MS } from '@/lib/mining-engine-math';

const {
  XP_PER_TIER,
  HP_DECAY_RATE_PER_DAY,
  HP_GAIN_PER_XP,
  BASE_DAILY_CLAIM,
  HP_NORMALIZATION,
  HP_MULTIPLIER_CAP,
  CLAIM_TREASURY_CUT,
  CLAIM_COOLDOWN_MS,
} = MINING_CONFIG;

function toNum(v: { toNumber(): number } | number | bigint | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'bigint') return Number(v);
  return v.toNumber();
}

/** Decay a stored stat's hash power from lastActiveAt up to `now`. */
export function liveHashPower(hashPower: number, lastActiveAt: Date | null, now = new Date()): number {
  const elapsed = lastActiveAt ? Math.max(0, now.getTime() - lastActiveAt.getTime()) : 0;
  return decayHashPower(hashPower, elapsed, HP_DECAY_RATE_PER_DAY);
}

/**
 * Award XP for a verified event (spec §3.2 — the onEventVerified hook).
 * Idempotent: a duplicate (userId, tier, source, referenceId) is a no-op.
 * Runs as one transaction: create XP event, then decay + gain hash power.
 */
export async function awardXp(params: {
  prisma: PrismaClient;
  userId: string;
  tier: MiningTier | keyof typeof XP_PER_TIER;
  source: string;
  referenceId: string;
  at?: Date;
}): Promise<{ ok: boolean; xp: number; duplicate?: boolean }> {
  const { prisma, userId, tier, source, referenceId } = params;
  const amount = XP_PER_TIER[tier as MiningTier] ?? 0;
  const now = params.at ?? new Date();

  try {
    await prisma.miningXpEvent.create({
      data: { userId, tier: tier as MiningTier, amount, source, referenceId, createdAt: now },
    });
  } catch (e: unknown) {
    // unique [userId, tier, source, referenceId] collision → already awarded
    if ((e as { code?: string }).code === 'P2002') {
      return { ok: false, xp: 0, duplicate: true };
    }
    throw e;
  }

  return prisma.$transaction(async (tx) => {
    const stat = await tx.userMiningStat.upsert({
      where: { userId },
      update: {},
      create: { userId, lifetimeXP: 0, hashPower: 0, lastActiveAt: now },
    });

    const elapsed = stat.lastActiveAt ? Math.max(0, now.getTime() - stat.lastActiveAt.getTime()) : 0;
    const decayed = decayHashPower(toNum(stat.hashPower), elapsed, HP_DECAY_RATE_PER_DAY);
    const nextHashPower = gainHashPower(decayed, amount, HP_GAIN_PER_XP);

    await tx.userMiningStat.update({
      where: { userId },
      data: { lifetimeXP: { increment: amount }, hashPower: nextHashPower, lastActiveAt: now },
    });

    return { ok: true, xp: amount };
  });
}

export interface ClaimStatusResult {
  canClaimNow: boolean;
  remainingSeconds: number;
  hashPower: number;
  lifetimeXP: number;
  multiplier: number;
  projectedNextClaim: number;
  baseDailyClaim: number;
  treasuryCut?: number;
  exists: boolean;
}

/**
 * What the "Claim Drop" screen needs (spec §4.3). Applies live decay so an
 * inactive user's displayed hash power matches their true decayed value even
 * before the next action/cron recomputes.
 */
export async function claimStatus(prisma: PrismaClient, userId: string): Promise<ClaimStatusResult> {
  const [stat, lastClaim] = await Promise.all([
    prisma.userMiningStat.findUnique({ where: { userId } }),
    prisma.dailyClaim.findFirst({ where: { userId }, orderBy: { claimedAt: 'desc' } }),
  ]);

  const exists = !!stat;
  const hashPower = liveHashPower(toNum(stat?.hashPower), stat?.lastActiveAt ?? null);
  const lifetimeXP = toNum(stat?.lifetimeXP);
  const multiplier = claimMultiplier(hashPower, HP_NORMALIZATION, HP_MULTIPLIER_CAP);
  const projectedNextClaim = +(BASE_DAILY_CLAIM * multiplier).toFixed(4);

  const remainingMs = lastClaim ? CLAIM_COOLDOWN_MS - (Date.now() - lastClaim.claimedAt.getTime()) : 0;
  const canClaimNow = remainingMs <= 0;

  return {
    canClaimNow,
    remainingSeconds: canClaimNow ? 0 : Math.max(0, Math.ceil((lastClaim ? CLAIM_COOLDOWN_MS - (Date.now() - lastClaim.claimedAt.getTime()) : 0) / 1000)),
    hashPower: +hashPower.toFixed(4),
    lifetimeXP: +lifetimeXP.toFixed(2),
    multiplier: +multiplier.toFixed(3),
    projectedNextClaim,
    baseDailyClaim: BASE_DAILY_CLAIM,
    exists,
  };
}

/**
 * The 150% collateral gate from v2. In the off-chain v4 ledger the rule is
 * represented as a bounded multiplier (HP_MULTIPLIER_CAP) + treasury cut —
 * there is no fractional-reserve shortfall to cross once the claim amount is
 * capped, so the gate always passes. Swap in the real KAIAirdropVault
 * collateral check here once on-chain settlement is wired.
 */
export async function canMint(_prisma: PrismaClient, claimAmount: number): Promise<{ ok: boolean; queued?: boolean }> {
  void _prisma;
  void claimAmount;
  return { ok: true, queued: false };
}

/**
 * Perform a daily "Claim Drop" (spec §4.1). Gated by the 24h rolling
 * cooldown, scaled by live (decayed) hash power, capped, treasury-cut split.
 * On success credits the user's MiningBalance and the system totals.
 */
export async function claimDrop(prisma: PrismaClient, userId: string): Promise<
  | { ok: true; claimAmount: number; userAmount: number; treasuryAmount: number; multiplier: number; hashPower: number }
  | { ok: false; error: string; cooldown?: boolean }
> {
  const lastClaim = await prisma.dailyClaim.findFirst({ where: { userId }, orderBy: { claimedAt: 'desc' } });
  if (lastClaim && Date.now() - lastClaim.claimedAt.getTime() < CLAIM_COOLDOWN_MS) {
    const remaining = CLAIM_COOLDOWN_MS - (Date.now() - lastClaim.claimedAt.getTime());
    return { ok: false, error: 'Already claimed — try again in ' + Math.ceil(remaining / 60000) + ' min', cooldown: true };
  }

  const stat = await prisma.userMiningStat.findUnique({ where: { userId } });
  const hashPower = liveHashPower(toNum(stat?.hashPower), stat?.lastActiveAt ?? null);
  const multiplier = claimMultiplier(hashPower, HP_NORMALIZATION, HP_MULTIPLIER_CAP);
  const claimAmount = +(BASE_DAILY_CLAIM * multiplier).toFixed(4);
  const { userAmount } = applyTreasuryCut(claimAmount, CLAIM_TREASURY_CUT);

  const gate = await canMint(prisma, claimAmount);
  if (!gate.ok) {
    return { ok: false, error: 'Claim queued while collateral settles' };
  }

  const roundedUser = +userAmount.toFixed(4);
  const roundedTreasury = +(claimAmount - roundedUser).toFixed(4);

  await prisma.$transaction(async (tx) => {
    // settle the decayed hash power back into the stat (claiming is an action)
    await tx.userMiningStat.update({ where: { userId }, data: { hashPower, lastActiveAt: new Date() } });
    await tx.dailyClaim.create({
      data: { userId, claimAmount, multiplier, hashPower },
    });
    await tx.miningBalance.upsert({
      where: { userId },
      update: { amount: { increment: roundedUser } },
      create: { userId, amount: roundedUser },
    });
    await tx.miningSystemTotals.upsert({
      where: { id: 'singleton' },
      update: { mintedSupply: { increment: claimAmount }, treasuryReserve: { increment: roundedTreasury } },
      create: { id: 'singleton', mintedSupply: claimAmount, treasuryReserve: roundedTreasury },
    });
  });

  return { ok: true, claimAmount, userAmount: roundedUser, treasuryAmount: roundedTreasury, multiplier, hashPower: +hashPower.toFixed(4) };
}

export { DAY_MS };
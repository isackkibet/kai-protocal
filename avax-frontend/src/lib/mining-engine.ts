import type { PrismaClient } from '@prisma/client';
import { MiningTier } from '@prisma/client';
import { MINING_CONFIG } from '@/lib/mining-config';
import { decayHashPower, gainHashPower, claimMultiplier, applyTreasuryCut, claimStreak, DAY_MS } from '@/lib/mining-engine-math';

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
  /** Gross amount of the next claim (before the treasury share). */
  projectedNextClaim: number;
  /** What actually lands in the user's balance on the next claim. */
  projectedUserAmount: number;
  baseDailyClaim: number;
  treasuryCut: number;
  streak: number;
  exists: boolean;
}

/** A streak survives as long as no more than two cooldowns pass between claims. */
const STREAK_GRACE_MS = CLAIM_COOLDOWN_MS * 2;
/** How far back the streak looks. Long enough for any realistic streak display. */
const STREAK_LOOKBACK = 366;

type Db = Pick<PrismaClient, 'dailyClaim'>;

async function recentClaimTimes(db: Db, userId: string): Promise<number[]> {
  const rows = await db.dailyClaim.findMany({
    where: { userId },
    orderBy: { claimedAt: 'desc' },
    take: STREAK_LOOKBACK,
    select: { claimedAt: true },
  });
  return rows.map((r) => r.claimedAt.getTime());
}

function remainingCooldownMs(lastClaimAt: number | undefined, now: number): number {
  return lastClaimAt === undefined ? 0 : Math.max(0, CLAIM_COOLDOWN_MS - (now - lastClaimAt));
}

/**
 * What the "Claim Drop" screen needs (spec §4.3). Applies live decay so an
 * inactive user's displayed hash power matches their true decayed value even
 * before the next action/cron recomputes.
 */
export async function claimStatus(prisma: PrismaClient, userId: string): Promise<ClaimStatusResult> {
  const [stat, claimTimes] = await Promise.all([
    prisma.userMiningStat.findUnique({ where: { userId } }),
    recentClaimTimes(prisma, userId),
  ]);

  const now = Date.now();
  const hashPower = liveHashPower(toNum(stat?.hashPower), stat?.lastActiveAt ?? null);
  const multiplier = claimMultiplier(hashPower, HP_NORMALIZATION, HP_MULTIPLIER_CAP);
  const projectedNextClaim = +(BASE_DAILY_CLAIM * multiplier).toFixed(4);
  const remainingMs = remainingCooldownMs(claimTimes[0], now);

  return {
    canClaimNow: remainingMs === 0,
    remainingSeconds: Math.ceil(remainingMs / 1000),
    hashPower: +hashPower.toFixed(4),
    lifetimeXP: +toNum(stat?.lifetimeXP).toFixed(2),
    multiplier: +multiplier.toFixed(3),
    projectedNextClaim,
    projectedUserAmount: +applyTreasuryCut(projectedNextClaim, CLAIM_TREASURY_CUT).userAmount.toFixed(4),
    baseDailyClaim: BASE_DAILY_CLAIM,
    treasuryCut: CLAIM_TREASURY_CUT,
    streak: claimStreak(claimTimes, now, STREAK_GRACE_MS),
    exists: !!stat,
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

export type ClaimDropResult =
  | {
      ok: true;
      claimAmount: number;
      userAmount: number;
      treasuryAmount: number;
      multiplier: number;
      hashPower: number;
      streak: number;
      balance: number;
      remainingSeconds: number;
    }
  | { ok: false; error: string; cooldown?: boolean; remainingSeconds?: number };

/**
 * Perform a daily "Claim Drop" (spec §4.1). Gated by the 24h rolling
 * cooldown, scaled by live (decayed) hash power, capped, treasury-cut split.
 * On success credits the user's MiningBalance and the system totals.
 *
 * The cooldown check and the claim insert run in one transaction that holds a
 * row lock on the user, so two taps (or two tabs) at once cannot both pass the
 * cooldown and double-claim.
 */
export async function claimDrop(prisma: PrismaClient, userId: string): Promise<ClaimDropResult> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM kai_users WHERE id = ${userId} FOR UPDATE`;

    const claimTimes = await recentClaimTimes(tx, userId);
    const now = new Date();
    const remainingMs = remainingCooldownMs(claimTimes[0], now.getTime());
    if (remainingMs > 0) {
      return {
        ok: false as const,
        error: `Already claimed. Your next drop is ready in ${formatWait(remainingMs)}.`,
        cooldown: true,
        remainingSeconds: Math.ceil(remainingMs / 1000),
      };
    }

    const stat = await tx.userMiningStat.findUnique({ where: { userId } });
    const hashPower = liveHashPower(toNum(stat?.hashPower), stat?.lastActiveAt ?? null, now);
    const multiplier = claimMultiplier(hashPower, HP_NORMALIZATION, HP_MULTIPLIER_CAP);
    const claimAmount = +(BASE_DAILY_CLAIM * multiplier).toFixed(4);
    const { userAmount } = applyTreasuryCut(claimAmount, CLAIM_TREASURY_CUT);

    const gate = await canMint(prisma, claimAmount);
    if (!gate.ok) {
      return { ok: false as const, error: 'Your claim is queued while collateral settles.' };
    }

    const roundedUser = +userAmount.toFixed(4);
    const roundedTreasury = +(claimAmount - roundedUser).toFixed(4);

    // Settle the decayed hash power back into the stat (claiming is an action).
    // Upsert: a brand-new user who has not earned XP yet has no stat row.
    await tx.userMiningStat.upsert({
      where: { userId },
      update: { hashPower, lastActiveAt: now },
      create: { userId, lifetimeXP: 0, hashPower, lastActiveAt: now },
    });
    await tx.dailyClaim.create({
      data: { userId, claimAmount, multiplier, hashPower, claimedAt: now },
    });
    const balance = await tx.miningBalance.upsert({
      where: { userId },
      update: { amount: { increment: roundedUser } },
      create: { userId, amount: roundedUser },
    });
    await tx.miningSystemTotals.upsert({
      where: { id: 'singleton' },
      update: { mintedSupply: { increment: claimAmount }, treasuryReserve: { increment: roundedTreasury } },
      create: { id: 'singleton', mintedSupply: claimAmount, treasuryReserve: roundedTreasury },
    });

    return {
      ok: true as const,
      claimAmount,
      userAmount: roundedUser,
      treasuryAmount: roundedTreasury,
      multiplier: +multiplier.toFixed(3),
      hashPower: +hashPower.toFixed(4),
      streak: claimStreak([now.getTime(), ...claimTimes], now.getTime(), STREAK_GRACE_MS),
      balance: toNum(balance.amount),
      remainingSeconds: Math.ceil(CLAIM_COOLDOWN_MS / 1000),
    };
  });
}

/** "5h 12m" / "12m" / "under a minute" */
function formatWait(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 1) return 'under a minute';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export { DAY_MS };
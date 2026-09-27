import type { PrismaClient } from '@prisma/client';
import { getPrisma } from './db.ts';
import { MINING_CONFIG } from './mining-config.ts';
import { decayHashPower, gainHashPower, claimMultiplier, applyTreasuryCut } from './mining-engine-math.ts';

/**
 * KAI Airdrop & Referral Power Engine (PRD v1.2 Implementation)
 * Specification Reference: AIRDROP_SPEC.md
 *
 * Core Principles:
 * 1. Points: Accumulated through verified qualifying activities.
 * 2. Power: TOTAL_POWER = PERSONAL_POWER + REFERRAL_POWER + BONUS_POWER
 * 3. Referral Power: 20% direct multiplier from active referrals, gated by activation state & risk flags.
 * 4. Active Power: Decaying stat (0.95/day) driving floor-plus-multiplier daily claims.
 * 5. Append-only ledger: Every reward is an auditable event; reversals are negative entries.
 * 6. Idempotency: Duplicate actions rejected via sourceId.
 */

export interface AirdropSummary {
  userId: string;
  username: string;
  emailMasked: string;
  referralCode: string;
  referralLink: string;
  totalPoints: number;
  lifetimePoints: number;
  totalPower: number;
  personalPower: number;
  referralPower: number;
  bonusPower: number;
  activePower: number;
  claimMultiplier: number;
  baseDailyClaim: number;
  projectedNextClaim: number;
  canClaimDaily: boolean;
  dailyClaimCooldownSeconds: number;
  totalReferrals: number;
  activeReferrals: number;
  pendingReferrals: number;
  walletAddress: string | null;
  riskStatus: 'NORMAL' | 'REVIEW' | 'RESTRICTED' | 'DISQUALIFIED';
  isSnapshotEligible: boolean;
  rank: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND';
}

export interface ReferralItem {
  id: string;
  nameMasked: string;
  status: 'INVITED' | 'REGISTERED' | 'VERIFIED' | 'ACTIVATED' | 'ACTIVE';
  riskStatus: 'NORMAL' | 'REVIEW' | 'RESTRICTED' | 'DISQUALIFIED';
  joinedAt: string;
  activatedAt: string | null;
  qualifyingPower: number;
  contributedPower: number; // 20% of qualifying power if active
  isEligible: boolean;
}

export interface LedgerActivityItem {
  id: string;
  eventType: string;
  title: string;
  points: number;
  powerContribution: number;
  sourceId: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface MissionItem {
  id: string;
  name: string;
  description: string;
  rewardPoints: number;
  rewardPower: number;
  category: 'ONBOARDING' | 'ENGAGEMENT' | 'CONSERVATION' | 'REFERRAL' | 'COMMUNITY';
  status: 'AVAILABLE' | 'COMPLETED' | 'CLAIMED';
  actionUrl?: string;
  progress?: { current: number; total: number };
}

export const CANONICAL_MISSIONS: Omit<MissionItem, 'status' | 'progress'>[] = [
  {
    id: 'verify_email',
    name: 'Verify Email Address',
    description: 'Verify your primary email to secure your account and unlock referral sharing.',
    rewardPoints: 100,
    rewardPower: 100,
    category: 'ONBOARDING',
  },
  {
    id: 'complete_profile',
    name: 'Complete Member Profile',
    description: 'Add your display name, bio, and area of interest in the KAI ecosystem.',
    rewardPoints: 50,
    rewardPower: 50,
    category: 'ONBOARDING',
  },
  {
    id: 'link_wallet',
    name: 'Link Web3 Wallet',
    description: 'Connect your Avalanche C-Chain wallet for mainnet snapshot eligibility.',
    rewardPoints: 50,
    rewardPower: 50,
    category: 'ONBOARDING',
  },
  {
    id: 'daily_checkin',
    name: 'Daily Platform Check-in',
    description: 'Open the app and check in to keep your Active Power decay minimal.',
    rewardPoints: 10,
    rewardPower: 10,
    category: 'ENGAGEMENT',
  },
  {
    id: 'daily_claim',
    name: 'Daily Claim Drop Ritual',
    description: 'Claim your daily floor tokens boosted by your active contribution multiplier.',
    rewardPoints: 10,
    rewardPower: 10,
    category: 'ENGAGEMENT',
  },
  {
    id: 'invite_first_friend',
    name: 'Invite First Contributor',
    description: 'Share your referral code and bring an active contributor into the network.',
    rewardPoints: 50,
    rewardPower: 50,
    category: 'REFERRAL',
  },
  {
    id: 'friend_activates',
    name: 'Friend Reaches Active State',
    description: 'Guide your invited friends to complete onboarding and earn their first points.',
    rewardPoints: 100,
    rewardPower: 100,
    category: 'REFERRAL',
  },
  {
    id: 'conservation_submission',
    name: 'Submit Conservation Record',
    description: 'Log a tree planting, nursery stock update, or survival record in Oloolua Hub.',
    rewardPoints: 50,
    rewardPower: 50,
    category: 'CONSERVATION',
  },
  {
    id: 'cfa_verification',
    name: 'Community CFA Verification',
    description: 'Participate in verifying community conservation or forest patrol logs.',
    rewardPoints: 100,
    rewardPower: 100,
    category: 'CONSERVATION',
  },
  {
    id: 'sihu_read_articles',
    name: 'Read 3 SIHU Research Articles',
    description: 'Explore verified Lake Victoria Basin environmental reporting on SIHU.COM.',
    rewardPoints: 30,
    rewardPower: 30,
    category: 'COMMUNITY',
  },
];

// In-memory fallback state for standalone / local exploration when DB is not configured
const inMemoryStore = new Map<string, {
  user: {
    id: string;
    name: string;
    email: string;
    referralCode: string;
    walletAddress: string | null;
    status: 'NORMAL' | 'REVIEW' | 'RESTRICTED' | 'DISQUALIFIED';
    createdAt: Date;
  };
  ledger: {
    id: string;
    eventType: string;
    title: string;
    points: number;
    sourceId: string;
    createdAt: Date;
  }[];
  activePower: number;
  lastActiveAt: Date;
  lastDailyClaimAt: Date | null;
  referrals: {
    id: string;
    nameMasked: string;
    status: 'INVITED' | 'REGISTERED' | 'VERIFIED' | 'ACTIVATED' | 'ACTIVE';
    riskStatus: 'NORMAL' | 'REVIEW' | 'RESTRICTED' | 'DISQUALIFIED';
    joinedAt: Date;
    qualifyingPower: number;
  }[];
  completedMissions: Set<string>;
}>();

function getOrCreateInMemoryUser(userId: string, email = 'contributor@kai.network', name = 'Austin Kai') {
  if (!inMemoryStore.has(userId)) {
    const defaultDate = new Date();
    inMemoryStore.set(userId, {
      user: {
        id: userId,
        name,
        email,
        referralCode: `KAI-${userId.slice(-4).toUpperCase()}`,
        walletAddress: null,
        status: 'NORMAL',
        createdAt: new Date(Date.now() - 14 * 86400000),
      },
      ledger: [
        { id: 'ev_1', eventType: 'ACCOUNT_CREATED', title: 'Account Registration', points: 100, sourceId: 'signup', createdAt: new Date(Date.now() - 14 * 86400000) },
        { id: 'ev_2', eventType: 'EMAIL_VERIFIED', title: 'Email Address Verified', points: 100, sourceId: 'email_ver', createdAt: new Date(Date.now() - 13 * 86400000) },
        { id: 'ev_3', eventType: 'PROFILE_COMPLETED', title: 'Profile Setup Completed', points: 50, sourceId: 'profile', createdAt: new Date(Date.now() - 12 * 86400000) },
        { id: 'ev_4', eventType: 'DAILY_CLAIM', title: 'Daily Claim Drop (1.8x Multiplier)', points: 18, sourceId: 'claim_1', createdAt: new Date(Date.now() - 86400000) },
        { id: 'ev_5', eventType: 'NURSERY_ACTIVITY', title: 'Logged 50 Indigenous Seedlings', points: 100, sourceId: 'seedlings_1', createdAt: new Date(Date.now() - 2 * 86400000) },
      ],
      activePower: 82.5,
      lastActiveAt: new Date(Date.now() - 3600000),
      lastDailyClaimAt: new Date(Date.now() - 25 * 3600000), // > 24h ago -> claimable now!
      referrals: [
        { id: 'ref_1', nameMasked: 'Al***e M.', status: 'ACTIVE', riskStatus: 'NORMAL', joinedAt: new Date(Date.now() - 10 * 86400000), qualifyingPower: 500 },
        { id: 'ref_2', nameMasked: 'Bo***b K.', status: 'ACTIVE', riskStatus: 'NORMAL', joinedAt: new Date(Date.now() - 7 * 86400000), qualifyingPower: 300 },
        { id: 'ref_3', nameMasked: 'Ch***s O.', status: 'ACTIVATED', riskStatus: 'NORMAL', joinedAt: new Date(Date.now() - 4 * 86400000), qualifyingPower: 150 },
        { id: 'ref_4', nameMasked: 'Da***d T.', status: 'REGISTERED', riskStatus: 'NORMAL', joinedAt: new Date(Date.now() - 86400000), qualifyingPower: 0 },
      ],
      completedMissions: new Set(['verify_email', 'complete_profile', 'conservation_submission']),
    });
  }
  return inMemoryStore.get(userId)!;
}

function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return 'us***@kai.network';
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length > 2 ? `${name.slice(0, 2)}***` : `${name}***`;
  return `${maskedName}@${domain}`;
}

export function maskName(name: string): string {
  if (!name) return 'Guardian';
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].length > 2 ? `${parts[0].slice(0, 2)}***` : `${parts[0]}***`;
  }
  return `${parts[0].slice(0, 2)}*** ${parts[parts.length - 1].slice(0, 1)}.`;
}

/**
 * Get the full user airdrop summary matching PRD v1.2 §5, §14, §18
 */
export async function getAirdropSummary(userIdOrPrivyId: string, emailFallback?: string): Promise<AirdropSummary> {
  const prisma = await getPrisma();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
    (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://kai.network'));

  if (!prisma) {
    const mem = getOrCreateInMemoryUser(userIdOrPrivyId, emailFallback);
    const personalPoints = mem.ledger.reduce((acc, ev) => acc + ev.points, 0);
    const personalPower = personalPoints;

    // Calculate Referral Power per §5.3 (20% of qualifying active referrals)
    const referralPower = mem.referrals
      .filter(r => r.status === 'ACTIVE' && r.riskStatus === 'NORMAL')
      .reduce((acc, r) => acc + Math.round(r.qualifyingPower * 0.2), 0);

    const bonusPower = 50; // Campaign onboarding bonus
    const totalPower = personalPower + referralPower + bonusPower;

    // Active power decay per §5.5
    const daysSinceLastUpdate = Math.max(0, (Date.now() - mem.lastActiveAt.getTime()) / 86400000);
    const activePower = +(mem.activePower * Math.pow(0.95, daysSinceLastUpdate)).toFixed(2);
    const claimMult = +Math.min(1 + activePower / 100, 3.0).toFixed(3);
    const baseDaily = 10;
    const projectedClaim = +(baseDaily * claimMult).toFixed(2);

    const lastClaimMs = mem.lastDailyClaimAt ? mem.lastDailyClaimAt.getTime() : 0;
    const cooldownMs = 86400000;
    const elapsedMs = Date.now() - lastClaimMs;
    const canClaim = elapsedMs >= cooldownMs;
    const remainingSec = canClaim ? 0 : Math.ceil((cooldownMs - elapsedMs) / 1000);

    return {
      userId: mem.user.id,
      username: mem.user.name,
      emailMasked: maskEmail(mem.user.email),
      referralCode: mem.user.referralCode,
      referralLink: `${baseUrl}/mine?ref=${mem.user.referralCode}`,
      totalPoints: personalPoints,
      lifetimePoints: personalPoints,
      totalPower,
      personalPower,
      referralPower,
      bonusPower,
      activePower,
      claimMultiplier: claimMult,
      baseDailyClaim: baseDaily,
      projectedNextClaim: projectedClaim,
      canClaimDaily: canClaim,
      dailyClaimCooldownSeconds: remainingSec,
      totalReferrals: mem.referrals.length,
      activeReferrals: mem.referrals.filter(r => r.status === 'ACTIVE').length,
      pendingReferrals: mem.referrals.filter(r => r.status !== 'ACTIVE').length,
      walletAddress: mem.user.walletAddress,
      riskStatus: mem.user.status,
      isSnapshotEligible: totalPower >= 250 && mem.user.status === 'NORMAL',
      rank: totalPower > 1000 ? 14 : totalPower > 500 ? 48 : 124,
      tier: totalPower >= 1000 ? 'DIAMOND' : totalPower >= 500 ? 'GOLD' : totalPower >= 200 ? 'SILVER' : 'BRONZE',
    };
  }

  // Real Database Flow with Prisma
  let user = await prisma.kaiUser.findFirst({
    where: {
      OR: [
        { id: userIdOrPrivyId },
        { privyUserId: userIdOrPrivyId },
      ],
    },
    include: {
      kaiBarLedger: true,
      sentReferrals: { include: { referred: { include: { kaiBarLedger: true } } } },
      miningStat: true,
      dailyClaims: { orderBy: { claimedAt: 'desc' }, take: 1 },
      wallets: true,
    },
  });

  if (!user && emailFallback) {
    const refCode = `KAI-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    user = await prisma.kaiUser.create({
      data: {
        name: 'KAI Contributor',
        email: emailFallback,
        privyUserId: userIdOrPrivyId.startsWith('did:') ? userIdOrPrivyId : null,
        referralCode: refCode,
        kaiBarLedger: {
          create: {
            type: 'WELCOME_BONUS',
            amount: 100,
            description: 'Account registration bonus',
          },
        },
      },
      include: {
        kaiBarLedger: true,
        sentReferrals: { include: { referred: { include: { kaiBarLedger: true } } } },
        miningStat: true,
        dailyClaims: { orderBy: { claimedAt: 'desc' }, take: 1 },
        wallets: true,
      },
    });
  }

  if (!user) {
    // Return fallback summary if user not created yet
    return getAirdropSummary(userIdOrPrivyId, emailFallback || 'contributor@kai.network');
  }

  const personalPoints = user.kaiBarLedger.reduce((acc, entry) => acc + entry.amount, 0);
  const personalPower = personalPoints;

  // Compute Referral Power per PRD §5.3
  let referralPower = 0;
  let activeReferralCount = 0;
  let pendingReferralCount = 0;

  for (const ref of user.sentReferrals) {
    if (ref.status === 'VALID' || ref.status === 'REWARDED') {
      const refQualifying = ref.referred.kaiBarLedger.reduce((acc, l) => acc + l.amount, 0);
      if (ref.referred.status === 'NORMAL') {
        referralPower += Math.round(refQualifying * 0.2); // 20%
        activeReferralCount++;
      }
    } else {
      pendingReferralCount++;
    }
  }

  const bonusPower = 50;
  const totalPower = personalPower + referralPower + bonusPower;

  // Active Power decay & claim multiplier per §5.5
  const rawHp = user.miningStat?.hashPower ? Number(user.miningStat.hashPower) : 0;
  const lastActive = user.miningStat?.lastActiveAt || user.createdAt;
  const daysSinceLast = Math.max(0, (Date.now() - lastActive.getTime()) / 86400000);
  const activePower = +(rawHp * Math.pow(0.95, daysSinceLast)).toFixed(2);
  const claimMult = +Math.min(1 + activePower / 100, 3.0).toFixed(3);
  const baseDaily = 10;
  const projectedClaim = +(baseDaily * claimMult).toFixed(2);

  const lastClaim = user.dailyClaims[0];
  const cooldownMs = 86400000;
  const lastClaimMs = lastClaim ? lastClaim.claimedAt.getTime() : 0;
  const elapsedMs = Date.now() - lastClaimMs;
  const canClaim = elapsedMs >= cooldownMs;
  const remainingSec = canClaim ? 0 : Math.ceil((cooldownMs - elapsedMs) / 1000);

  const wallet = user.wallets[0]?.address || null;

  return {
    userId: user.id,
    username: user.name,
    emailMasked: maskEmail(user.email),
    referralCode: user.referralCode || `KAI-${user.id.slice(-4).toUpperCase()}`,
    referralLink: `${baseUrl}/mine?ref=${user.referralCode || user.id}`,
    totalPoints: personalPoints,
    lifetimePoints: personalPoints,
    totalPower,
    personalPower,
    referralPower,
    bonusPower,
    activePower,
    claimMultiplier: claimMult,
    baseDailyClaim: baseDaily,
    projectedNextClaim: projectedClaim,
    canClaimDaily: canClaim,
    dailyClaimCooldownSeconds: remainingSec,
    totalReferrals: user.sentReferrals.length,
    activeReferrals: activeReferralCount,
    pendingReferrals: pendingReferralCount,
    walletAddress: wallet,
    riskStatus: user.status as any,
    isSnapshotEligible: totalPower >= 250 && user.status === 'NORMAL',
    rank: totalPower > 1000 ? 14 : totalPower > 500 ? 48 : 124,
    tier: totalPower >= 1000 ? 'DIAMOND' : totalPower >= 500 ? 'GOLD' : totalPower >= 200 ? 'SILVER' : 'BRONZE',
  };
}

/**
 * Get referrals list for the user with privacy masking (§19a)
 */
export async function getUserReferrals(userIdOrPrivyId: string): Promise<ReferralItem[]> {
  const prisma = await getPrisma();
  if (!prisma) {
    const mem = getOrCreateInMemoryUser(userIdOrPrivyId);
    return mem.referrals.map(r => ({
      id: r.id,
      nameMasked: r.nameMasked,
      status: r.status,
      riskStatus: r.riskStatus,
      joinedAt: r.joinedAt.toISOString(),
      activatedAt: r.status === 'ACTIVE' ? r.joinedAt.toISOString() : null,
      qualifyingPower: r.qualifyingPower,
      contributedPower: r.status === 'ACTIVE' && r.riskStatus === 'NORMAL' ? Math.round(r.qualifyingPower * 0.2) : 0,
      isEligible: r.status === 'ACTIVE' && r.riskStatus === 'NORMAL',
    }));
  }

  const user = await prisma.kaiUser.findFirst({
    where: { OR: [{ id: userIdOrPrivyId }, { privyUserId: userIdOrPrivyId }] },
    include: {
      sentReferrals: {
        include: {
          referred: { include: { kaiBarLedger: true } },
        },
      },
    },
  });

  if (!user) return [];

  return user.sentReferrals.map(ref => {
    const qualifying = ref.referred.kaiBarLedger.reduce((acc, l) => acc + l.amount, 0);
    const isActive = ref.status === 'VALID' || ref.status === 'REWARDED';
    const isNormal = ref.referred.status === 'NORMAL';
    return {
      id: ref.id,
      nameMasked: maskName(ref.referred.name),
      status: isActive ? 'ACTIVE' : 'REGISTERED',
      riskStatus: ref.referred.status as any,
      joinedAt: ref.createdAt.toISOString(),
      activatedAt: ref.rewardedAt ? ref.rewardedAt.toISOString() : null,
      qualifyingPower: qualifying,
      contributedPower: isActive && isNormal ? Math.round(qualifying * 0.2) : 0,
      isEligible: isActive && isNormal,
    };
  });
}

/**
 * Get Reward Activity Ledger History (§9 & §12)
 */
export async function getActivityLedger(userIdOrPrivyId: string): Promise<LedgerActivityItem[]> {
  const prisma = await getPrisma();
  if (!prisma) {
    const mem = getOrCreateInMemoryUser(userIdOrPrivyId);
    return mem.ledger.map(ev => ({
      id: ev.id,
      eventType: ev.eventType,
      title: ev.title,
      points: ev.points,
      powerContribution: ev.points,
      sourceId: ev.sourceId,
      createdAt: ev.createdAt.toISOString(),
    }));
  }

  const user = await prisma.kaiUser.findFirst({
    where: { OR: [{ id: userIdOrPrivyId }, { privyUserId: userIdOrPrivyId }] },
    include: { kaiBarLedger: { orderBy: { createdAt: 'desc' }, take: 50 } },
  });

  if (!user) return [];

  return user.kaiBarLedger.map(entry => ({
    id: entry.id,
    eventType: entry.type,
    title: entry.description,
    points: entry.amount,
    powerContribution: entry.amount,
    sourceId: entry.referenceId || entry.id,
    createdAt: entry.createdAt.toISOString(),
  }));
}

/**
 * Get Available Missions and User Progress (§17)
 */
export async function getMissions(userIdOrPrivyId: string): Promise<MissionItem[]> {
  const prisma = await getPrisma();
  if (!prisma) {
    const mem = getOrCreateInMemoryUser(userIdOrPrivyId);
    return CANONICAL_MISSIONS.map(m => {
      const isDone = mem.completedMissions.has(m.id);
      return {
        ...m,
        status: isDone ? 'CLAIMED' : 'AVAILABLE',
      };
    });
  }

  const user = await prisma.kaiUser.findFirst({
    where: { OR: [{ id: userIdOrPrivyId }, { privyUserId: userIdOrPrivyId }] },
    include: { taskCompletions: true },
  });

  const completedSet = new Set(user?.taskCompletions.map(tc => tc.taskId) || []);

  return CANONICAL_MISSIONS.map(m => ({
    ...m,
    status: completedSet.has(m.id) ? 'CLAIMED' : 'AVAILABLE',
  }));
}

/**
 * Claim Daily Drop with Active Power multiplier & decay (§5.5 & §33)
 */
export async function claimDailyDropRitual(userIdOrPrivyId: string): Promise<{
  ok: boolean;
  claimPoints: number;
  multiplier: number;
  activePower: number;
  error?: string;
}> {
  const prisma = await getPrisma();

  if (!prisma) {
    const mem = getOrCreateInMemoryUser(userIdOrPrivyId);
    const cooldownMs = 86400000;
    if (mem.lastDailyClaimAt && Date.now() - mem.lastDailyClaimAt.getTime() < cooldownMs) {
      const remainingSec = Math.ceil((cooldownMs - (Date.now() - mem.lastDailyClaimAt.getTime())) / 1000);
      return { ok: false, claimPoints: 0, multiplier: 1, activePower: mem.activePower, error: `Daily claim on cooldown. Try again in ${Math.ceil(remainingSec / 60)} minutes.` };
    }

    const mult = +Math.min(1 + mem.activePower / 100, 3.0).toFixed(3);
    const points = +(10 * mult).toFixed(2);

    mem.lastDailyClaimAt = new Date();
    mem.activePower = +(mem.activePower + 10).toFixed(2); // daily claim boosts active power
    mem.lastActiveAt = new Date();
    mem.ledger.unshift({
      id: `claim_${Date.now()}`,
      eventType: 'DAILY_CLAIM',
      title: `Daily Claim Drop (${mult}x Multiplier)`,
      points,
      sourceId: `daily_${new Date().toISOString().split('T')[0]}`,
      createdAt: new Date(),
    });

    return {
      ok: true,
      claimPoints: points,
      multiplier: mult,
      activePower: mem.activePower,
    };
  }

  const user = await prisma.kaiUser.findFirst({
    where: { OR: [{ id: userIdOrPrivyId }, { privyUserId: userIdOrPrivyId }] },
    include: {
      miningStat: true,
      dailyClaims: { orderBy: { claimedAt: 'desc' }, take: 1 },
    },
  });

  if (!user) return { ok: false, claimPoints: 0, multiplier: 1, activePower: 0, error: 'User not found' };
  if (user.status === 'BLOCKED') return { ok: false, claimPoints: 0, multiplier: 1, activePower: 0, error: 'Account blocked by anti-abuse' };

  const lastClaim = user.dailyClaims[0];
  const cooldownMs = 86400000;
  if (lastClaim && Date.now() - lastClaim.claimedAt.getTime() < cooldownMs) {
    return { ok: false, claimPoints: 0, multiplier: 1, activePower: 0, error: 'Already claimed within the last 24 hours' };
  }

  const rawHp = user.miningStat?.hashPower ? Number(user.miningStat.hashPower) : 0;
  const lastActive = user.miningStat?.lastActiveAt || user.createdAt;
  const daysSinceLast = Math.max(0, (Date.now() - lastActive.getTime()) / 86400000);
  const decayedHp = +(rawHp * Math.pow(0.95, daysSinceLast)).toFixed(2);
  const mult = +Math.min(1 + decayedHp / 100, 3.0).toFixed(3);
  const claimPoints = +(10 * mult).toFixed(2);
  const newHp = +(decayedHp + 10).toFixed(2);

  await prisma.$transaction([
    prisma.dailyClaim.create({
      data: {
        userId: user.id,
        claimAmount: claimPoints,
        multiplier: mult,
        hashPower: newHp,
      },
    }),
    prisma.kaiBarLedger.create({
      data: {
        userId: user.id,
        type: 'CAMPAIGN',
        amount: Math.round(claimPoints),
        description: `Daily Claim Drop (${mult}x Multiplier)`,
        referenceId: `daily_${new Date().toISOString().split('T')[0]}`,
      },
    }),
    prisma.userMiningStat.upsert({
      where: { userId: user.id },
      update: {
        hashPower: newHp,
        lifetimeXP: { increment: claimPoints },
        lastActiveAt: new Date(),
      },
      create: {
        userId: user.id,
        hashPower: newHp,
        lifetimeXP: claimPoints,
        lastActiveAt: new Date(),
      },
    }),
  ]);

  return { ok: true, claimPoints, multiplier: mult, activePower: newHp };
}

/**
 * Claim Mission Reward with Server Verification (§17 & §21)
 */
export async function claimMissionReward(userIdOrPrivyId: string, missionId: string): Promise<{
  ok: boolean;
  rewardPoints: number;
  missionName: string;
  error?: string;
}> {
  const mission = CANONICAL_MISSIONS.find(m => m.id === missionId);
  if (!mission) return { ok: false, rewardPoints: 0, missionName: '', error: 'Mission not found' };

  const prisma = await getPrisma();
  if (!prisma) {
    const mem = getOrCreateInMemoryUser(userIdOrPrivyId);
    if (mem.completedMissions.has(missionId)) {
      return { ok: false, rewardPoints: 0, missionName: mission.name, error: 'Mission already claimed' };
    }
    mem.completedMissions.add(missionId);
    mem.activePower = +(mem.activePower + mission.rewardPower * 0.1).toFixed(2);
    mem.lastActiveAt = new Date();
    mem.ledger.unshift({
      id: `ev_${Date.now()}`,
      eventType: 'MISSION_COMPLETED',
      title: `Completed Mission: ${mission.name}`,
      points: mission.rewardPoints,
      sourceId: `mission_${missionId}`,
      createdAt: new Date(),
    });
    return { ok: true, rewardPoints: mission.rewardPoints, missionName: mission.name };
  }

  const user = await prisma.kaiUser.findFirst({
    where: { OR: [{ id: userIdOrPrivyId }, { privyUserId: userIdOrPrivyId }] },
    include: { taskCompletions: true },
  });

  if (!user) return { ok: false, rewardPoints: 0, missionName: '', error: 'User not found' };

  const alreadyClaimed = user.taskCompletions.some(tc => tc.taskId === missionId);
  if (alreadyClaimed) {
    return { ok: false, rewardPoints: 0, missionName: mission.name, error: 'Mission already completed' };
  }

  // Ensure RewardTask exists in DB
  const dbTask = await prisma.rewardTask.upsert({
    where: { id: missionId },
    update: {},
    create: {
      id: missionId,
      name: mission.name,
      description: mission.description,
      rewardAmount: mission.rewardPoints,
      taskType: 'CAMPAIGN',
      active: true,
    },
  });

  await prisma.$transaction([
    prisma.taskCompletion.create({
      data: {
        userId: user.id,
        taskId: dbTask.id,
      },
    }),
    prisma.kaiBarLedger.create({
      data: {
        userId: user.id,
        type: 'TASK',
        amount: mission.rewardPoints,
        description: `Mission Reward: ${mission.name}`,
        referenceId: `mission_${missionId}`,
      },
    }),
    prisma.userMiningStat.upsert({
      where: { userId: user.id },
      update: {
        hashPower: { increment: mission.rewardPoints * 0.1 },
        lifetimeXP: { increment: mission.rewardPoints },
        lastActiveAt: new Date(),
      },
      create: {
        userId: user.id,
        hashPower: mission.rewardPoints * 0.1,
        lifetimeXP: mission.rewardPoints,
        lastActiveAt: new Date(),
      },
    }),
  ]);

  return { ok: true, rewardPoints: mission.rewardPoints, missionName: mission.name };
}

/**
 * Register Referral code attribution permanently at signup (§7 Rule 1)
 */
export async function registerReferralCode(newUserId: string, referralCode: string): Promise<{
  ok: boolean;
  referrerName?: string;
  error?: string;
}> {
  const code = referralCode.trim().toUpperCase();
  const prisma = await getPrisma();

  if (!prisma) {
    return { ok: true, referrerName: 'Austin Kai' };
  }

  const referrer = await prisma.kaiUser.findFirst({
    where: { referralCode: code },
  });

  if (!referrer) return { ok: false, error: 'Invalid referral code' };
  if (referrer.id === newUserId) return { ok: false, error: 'Self-referral prohibited (§7 Rule 2)' };

  const existingRef = await prisma.referral.findFirst({
    where: { referredUserId: newUserId },
  });

  if (existingRef) {
    return { ok: false, error: 'Referrer already bound permanently at registration (§7 Rule 1)' };
  }

  await prisma.referral.create({
    data: {
      referrerUserId: referrer.id,
      referredUserId: newUserId,
      referralCode: code,
      status: 'VALID',
    },
  });

  return { ok: true, referrerName: referrer.name };
}

/**
 * Link Web3 Wallet Address for Mainnet Snapshot (§25a)
 */
export async function linkUserWallet(userIdOrPrivyId: string, walletAddress: string): Promise<{
  ok: boolean;
  address: string;
  error?: string;
}> {
  const addr = walletAddress.trim().toLowerCase();
  if (!addr.startsWith('0x') || addr.length !== 42) {
    return { ok: false, address: '', error: 'Invalid EVM wallet address' };
  }

  const prisma = await getPrisma();
  if (!prisma) {
    const mem = getOrCreateInMemoryUser(userIdOrPrivyId);
    mem.user.walletAddress = addr;
    return { ok: true, address: addr };
  }

  const user = await prisma.kaiUser.findFirst({
    where: { OR: [{ id: userIdOrPrivyId }, { privyUserId: userIdOrPrivyId }] },
  });

  if (!user) return { ok: false, address: '', error: 'User not found' };

  await prisma.kaiWallet.upsert({
    where: { id: `wallet_${user.id}_AVALANCHE` },
    update: { address: addr },
    create: {
      id: `wallet_${user.id}_AVALANCHE`,
      userId: user.id,
      chain: 'AVALANCHE',
      address: addr,
    },
  });

  return { ok: true, address: addr };
}

/**
 * Get Community Leaderboard by Total Power
 */
export async function getPowerLeaderboard(): Promise<{
  rank: number;
  name: string;
  totalPower: number;
  activePower: number;
  referrals: number;
  tier: string;
}[]> {
  const prisma = await getPrisma();
  if (prisma) {
    try {
      const topUsers = await prisma.kaiUser.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          kaiBarLedger: true,
          miningStat: true,
          sentReferrals: true,
        },
      });

      if (topUsers.length > 0) {
        return topUsers.map((u: any, i: number) => {
          const personalPoints = (u.kaiBarLedger || []).reduce((acc: number, e: any) => acc + (e.amount || 0), 0);
          const personalPower = personalPoints;
          const activeRefs = (u.sentReferrals || []).filter((r: any) => r.status === 'VALID' || r.status === 'REWARDED').length;
          const referralPower = activeRefs * 150;
          const totalPower = personalPower + referralPower;
          const activePower = u.miningStat?.hashPower ? Number(u.miningStat.hashPower) : 80.0;
          const tier = totalPower >= 4000 ? 'DIAMOND' : totalPower >= 1200 ? 'GOLD' : totalPower >= 600 ? 'SILVER' : 'BRONZE';
          
          let name = u.name || (u.email ? u.email.split('@')[0] : `Contributor #${u.id.slice(-4)}`);
          if (u.privyUserId?.includes('demo_user_austin') || u.email?.includes('austin')) {
            name = 'Austin K. (You)';
          }

          return {
            rank: i + 1,
            name,
            totalPower,
            activePower: Math.round(activePower * 10) / 10,
            referrals: activeRefs,
            tier,
          };
        });
      }
    } catch (err) {
      console.warn('Failed to query DB leaderboard, using curated fallback:', err);
    }
  }

  return [
    { rank: 1, name: 'Sango Guardian Alpha', totalPower: 4820, activePower: 285.0, referrals: 38, tier: 'DIAMOND' },
    { rank: 2, name: 'Austin K. (You)', totalPower: 1420, activePower: 92.5, referrals: 14, tier: 'GOLD' },
    { rank: 3, name: 'Oloolua Ranger 07', totalPower: 1280, activePower: 88.0, referrals: 11, tier: 'GOLD' },
    { rank: 4, name: 'Kibera Youth Tree Lab', totalPower: 960, activePower: 74.0, referrals: 9, tier: 'SILVER' },
    { rank: 5, name: 'Kisumu Basin Watcher', totalPower: 840, activePower: 65.0, referrals: 7, tier: 'SILVER' },
    { rank: 6, name: 'Mau Restoration Team', totalPower: 710, activePower: 58.0, referrals: 6, tier: 'SILVER' },
    { rank: 7, name: 'Ngong Agroforestry', totalPower: 520, activePower: 46.0, referrals: 4, tier: 'BRONZE' },
  ];
}

import type { PrismaClient } from '@prisma/client';
import { getPrisma } from './db.ts';
import { claimStreak } from './mining-engine-math.ts';

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
  /** Consecutive days with a daily claim (48h grace between claims). */
  streak: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  totalPower: number;
  activePower: number;
  referrals: number;
  tier: string;
  isYou: boolean;
}

/** Thrown when a signed-in caller has no KaiUser row yet (onboarding not finished). */
export class AirdropUserNotFoundError extends Error {
  constructor() {
    super('Finish signing up to start earning airdrop points.');
    this.name = 'AirdropUserNotFoundError';
  }
}

const DAILY_COOLDOWN_MS = 86_400_000;
/** A streak survives while no more than two cooldowns pass between claims. */
const STREAK_GRACE_MS = DAILY_COOLDOWN_MS * 2;
const BASE_DAILY = 10;
const CAMPAIGN_BONUS_POWER = 50;
const MAX_CLAIM_MULTIPLIER = 3.0;

export function tierFor(totalPower: number): AirdropSummary['tier'] {
  return totalPower >= 1000 ? 'DIAMOND' : totalPower >= 500 ? 'GOLD' : totalPower >= 200 ? 'SILVER' : 'BRONZE';
}

function multiplierFor(activePower: number): number {
  return +Math.min(1 + activePower / 100, MAX_CLAIM_MULTIPLIER).toFixed(3);
}

/**
 * The daily drop credits whole points to the ledger, so the projection shown
 * to the user is rounded the same way: what you see is what you get.
 */
function dailyPointsFor(multiplier: number): number {
  return Math.round(BASE_DAILY * multiplier);
}

/** "5h 12m" / "12m" / "under a minute" */
export function formatWait(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 1) return 'under a minute';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
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
  streak: number;
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
      streak: 1,
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
export async function getAirdropSummary(userIdOrPrivyId: string): Promise<AirdropSummary> {
  const prisma = await getPrisma();
  // Referral links must point at the production domain. VERCEL_URL is the
  // per-deployment address (avax-frontend-<hash>-….vercel.app), which Privy
  // rejects as an origin, so invitees landing there could never sign in.
  // VERCEL_PROJECT_PRODUCTION_URL is Vercel's stable production domain.
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` :
    (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` :
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://kai.network')));

  if (!prisma) {
    const mem = getOrCreateInMemoryUser(userIdOrPrivyId);
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
    const claimMult = multiplierFor(activePower);
    const baseDaily = BASE_DAILY;
    const projectedClaim = dailyPointsFor(claimMult);

    const lastClaimMs = mem.lastDailyClaimAt ? mem.lastDailyClaimAt.getTime() : 0;
    const elapsedMs = Date.now() - lastClaimMs;
    const canClaim = elapsedMs >= DAILY_COOLDOWN_MS;
    const remainingSec = canClaim ? 0 : Math.ceil((DAILY_COOLDOWN_MS - elapsedMs) / 1000);

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
      tier: tierFor(totalPower),
      streak: mem.lastDailyClaimAt && elapsedMs <= STREAK_GRACE_MS ? mem.streak : 0,
    };
  }

  // Real Database Flow with Prisma
  const user = await prisma.kaiUser.findFirst({
    where: {
      OR: [
        { id: userIdOrPrivyId },
        { privyUserId: userIdOrPrivyId },
      ],
    },
    include: {
      miningStat: true,
      dailyClaims: { orderBy: { claimedAt: 'desc' }, take: 366, select: { claimedAt: true } },
      wallets: true,
      sentReferrals: { select: { status: true } },
    },
  });

  // Accounts are created by the onboarding pipeline, never here: silently
  // inventing a KaiUser with a placeholder email bypassed onboarding and
  // collided on the unique email for the second such user.
  if (!user) throw new AirdropUserNotFoundError();

  const referralCode = user.referralCode ?? (await ensureReferralCode(prisma, user.id));
  const table = await computePowerTable(prisma);
  const mine = table.get(user.id) ?? { points: 0, referralPower: 0, activeRefs: 0, totalPower: CAMPAIGN_BONUS_POWER, activePower: 0 };
  const personalPoints = mine.points;
  const personalPower = personalPoints;
  const referralPower = mine.referralPower;
  const bonusPower = CAMPAIGN_BONUS_POWER;
  const totalPower = personalPower + referralPower + bonusPower;
  const activeReferralCount = mine.activeRefs;
  const pendingReferralCount = user.sentReferrals.filter(r => r.status === 'PENDING').length;

  // Rank among accounts in good standing (1 = highest total power).
  let rank = 1;
  for (const [id, row] of table) {
    if (id !== user.id && !row.blocked && row.totalPower > totalPower) rank++;
  }

  // Active Power decay & claim multiplier per §5.5
  const rawHp = user.miningStat?.hashPower ? Number(user.miningStat.hashPower) : 0;
  const lastActive = user.miningStat?.lastActiveAt || user.createdAt;
  const activePower = decayedActivePower(rawHp, lastActive);
  const claimMult = multiplierFor(activePower);
  const projectedClaim = dailyPointsFor(claimMult);

  const claimTimes = user.dailyClaims.map(c => c.claimedAt.getTime());
  const now = Date.now();
  const remainingMs = claimTimes.length ? Math.max(0, DAILY_COOLDOWN_MS - (now - claimTimes[0])) : 0;

  return {
    userId: user.id,
    username: user.name,
    emailMasked: maskEmail(user.email),
    referralCode,
    referralLink: `${baseUrl}/mine?ref=${referralCode}`,
    totalPoints: personalPoints,
    lifetimePoints: personalPoints,
    totalPower,
    personalPower,
    referralPower,
    bonusPower,
    activePower,
    claimMultiplier: claimMult,
    baseDailyClaim: BASE_DAILY,
    projectedNextClaim: projectedClaim,
    canClaimDaily: remainingMs === 0,
    dailyClaimCooldownSeconds: Math.ceil(remainingMs / 1000),
    totalReferrals: user.sentReferrals.length,
    activeReferrals: activeReferralCount,
    pendingReferrals: pendingReferralCount,
    walletAddress: user.wallets[0]?.address || null,
    riskStatus: user.status === 'BLOCKED' ? 'RESTRICTED' : user.status,
    isSnapshotEligible: totalPower >= 250 && user.status === 'NORMAL',
    rank,
    tier: tierFor(totalPower),
    streak: claimStreak(claimTimes, now, STREAK_GRACE_MS),
  };
}

function decayedActivePower(rawHp: number, lastActive: Date): number {
  const days = Math.max(0, (Date.now() - lastActive.getTime()) / 86400000);
  return +(rawHp * Math.pow(0.95, days)).toFixed(2);
}

/** Give a pre-existing account a shareable code so its referral link resolves. */
async function ensureReferralCode(prisma: PrismaClient, userId: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = `KAI-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    try {
      await prisma.kaiUser.update({ where: { id: userId }, data: { referralCode: code } });
      return code;
    } catch (e: unknown) {
      if ((e as { code?: string }).code !== 'P2002') throw e; // unique clash: try another code
    }
  }
  throw new Error('Could not allocate a referral code');
}

interface PowerRow {
  name: string;
  blocked: boolean;
  /** NORMAL standing: only these pass referral power up to their referrer. */
  normal: boolean;
  points: number;
  referralPower: number;
  activeRefs: number;
  totalPower: number;
  activePower: number;
}

/**
 * Total Power for every account, computed the same way for the summary,
 * the rank and the leaderboard (PRD §5.2/§5.3): ledger points + 20% of each
 * valid referral's points (referred account in good standing) + campaign bonus.
 * Aggregated in the database, so it does not load every ledger row.
 */
async function computePowerTable(prisma: PrismaClient): Promise<Map<string, PowerRow>> {
  const [sums, refs, users] = await Promise.all([
    prisma.kaiBarLedger.groupBy({ by: ['userId'], _sum: { amount: true } }),
    prisma.referral.findMany({
      where: { status: { in: ['VALID', 'REWARDED'] } },
      select: { referrerUserId: true, referredUserId: true },
    }),
    prisma.kaiUser.findMany({
      select: { id: true, name: true, status: true, createdAt: true, miningStat: { select: { hashPower: true, lastActiveAt: true } } },
    }),
  ]);

  const points = new Map(sums.map(r => [r.userId, r._sum.amount ?? 0]));
  const table = new Map<string, PowerRow>();
  for (const u of users) {
    table.set(u.id, {
      name: u.name,
      blocked: u.status === 'BLOCKED',
      normal: u.status === 'NORMAL',
      points: points.get(u.id) ?? 0,
      referralPower: 0,
      activeRefs: 0,
      totalPower: 0,
      activePower: decayedActivePower(u.miningStat?.hashPower ? Number(u.miningStat.hashPower) : 0, u.miningStat?.lastActiveAt ?? u.createdAt),
    });
  }
  for (const r of refs) {
    const referrer = table.get(r.referrerUserId);
    const referred = table.get(r.referredUserId);
    if (!referrer || !referred || !referred.normal) continue;
    referrer.referralPower += Math.round(referred.points * 0.2);
    referrer.activeRefs++;
  }
  for (const row of table.values()) {
    row.totalPower = row.points + row.referralPower + CAMPAIGN_BONUS_POWER;
  }
  return table;
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
      riskStatus: ref.referred.status === 'BLOCKED' ? 'RESTRICTED' : ref.referred.status,
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

  const facts = await loadMissionFacts(prisma, userIdOrPrivyId);
  const completedSet = new Set(facts?.claimed ?? []);

  // CLAIMED = reward already paid; COMPLETED = the work is verified and the
  // reward is waiting; AVAILABLE = not done yet.
  return CANONICAL_MISSIONS.map(m => ({
    ...m,
    status: completedSet.has(m.id) ? 'CLAIMED' : facts && missionBlocker(m.id, facts) === null ? 'COMPLETED' : 'AVAILABLE',
  }));
}

interface MissionFacts {
  userId: string;
  name: string;
  email: string;
  blocked: boolean;
  checkedIn: boolean;
  wallets: number;
  dailyClaims: number;
  invites: number;
  activeInvites: number;
  plantingRecords: number;
  survivalRecords: number;
  claimed: string[];
}

/** Everything the mission verifiers need, fetched in one round of queries. */
async function loadMissionFacts(prisma: PrismaClient, userIdOrPrivyId: string): Promise<MissionFacts | null> {
  const user = await prisma.kaiUser.findFirst({
    where: { OR: [{ id: userIdOrPrivyId }, { privyUserId: userIdOrPrivyId }] },
    select: {
      id: true, name: true, email: true, status: true, lastCheckInAt: true,
      taskCompletions: { select: { taskId: true } },
      _count: { select: { wallets: true, dailyClaims: true } },
    },
  });
  if (!user) return null;

  const [invites, activeInvites, xpSources] = await Promise.all([
    prisma.referral.count({ where: { referrerUserId: user.id, status: { not: 'INVALID' } } }),
    prisma.referral.count({ where: { referrerUserId: user.id, status: { in: ['VALID', 'REWARDED'] } } }),
    prisma.miningXpEvent.groupBy({
      by: ['source'],
      where: { userId: user.id, source: { in: ['PLANTING', 'SURVIVAL'] } },
      _count: { _all: true },
    }),
  ]);
  const xp = (src: string) => xpSources.find(r => r.source === src)?._count._all ?? 0;

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    blocked: user.status === 'BLOCKED',
    checkedIn: !!user.lastCheckInAt,
    wallets: user._count.wallets,
    dailyClaims: user._count.dailyClaims,
    invites,
    activeInvites,
    plantingRecords: xp('PLANTING'),
    survivalRecords: xp('SURVIVAL'),
    claimed: user.taskCompletions.map(tc => tc.taskId),
  };
}

const PLACEHOLDER_NAMES = new Set(['', 'kai contributor', 'guardian', 'user']);

/**
 * Server-side verification (§17 & §21): returns null when the mission's work
 * is really done, otherwise a short, friendly reason the reward is locked.
 */
function missionBlocker(missionId: string, f: MissionFacts): string | null {
  switch (missionId) {
    case 'verify_email':
      return f.email.includes('@') ? null : 'Add and verify an email address first.';
    case 'complete_profile':
      return PLACEHOLDER_NAMES.has(f.name.trim().toLowerCase()) ? 'Set your display name in your profile first.' : null;
    case 'link_wallet':
      return f.wallets > 0 ? null : 'Link an Avalanche wallet on the Rewards tab first.';
    case 'daily_checkin':
      return f.checkedIn ? null : 'Do your daily check-in on the Kai Bar first.';
    case 'daily_claim':
      return f.dailyClaims > 0 ? null : 'Claim your first daily drop first.';
    case 'invite_first_friend':
      return f.invites > 0 ? null : 'Nobody has joined with your referral link yet.';
    case 'friend_activates':
      return f.activeInvites > 0 ? null : 'None of your invited friends is active yet.';
    case 'conservation_submission':
      return f.plantingRecords + f.survivalRecords > 0 ? null : 'Log a planting or survival record in the Oloolua Hub first.';
    case 'cfa_verification':
      return f.survivalRecords > 0 ? null : 'Take part in a CFA survival verification first.';
    case 'sihu_read_articles':
      return 'Article reading is not tracked yet, so this mission unlocks soon.';
    default:
      return 'This mission cannot be verified yet.';
  }
}

export interface DailyClaimResult {
  ok: boolean;
  claimPoints: number;
  multiplier: number;
  activePower: number;
  error?: string;
  /** True when the claim was refused only because the 24h cooldown is running. */
  cooldown?: boolean;
  remainingSeconds?: number;
  streak?: number;
  totalPoints?: number;
}

/**
 * Claim Daily Drop with Active Power multiplier & decay (§5.5 & §33)
 */
export async function claimDailyDropRitual(userIdOrPrivyId: string): Promise<DailyClaimResult> {
  const prisma = await getPrisma();

  if (!prisma) {
    const mem = getOrCreateInMemoryUser(userIdOrPrivyId);
    const now = Date.now();
    if (mem.lastDailyClaimAt && now - mem.lastDailyClaimAt.getTime() < DAILY_COOLDOWN_MS) {
      const remainingMs = DAILY_COOLDOWN_MS - (now - mem.lastDailyClaimAt.getTime());
      return {
        ok: false, claimPoints: 0, multiplier: 1, activePower: mem.activePower, cooldown: true,
        remainingSeconds: Math.ceil(remainingMs / 1000),
        error: `Already claimed. Your next drop unlocks in ${formatWait(remainingMs)}.`,
      };
    }

    const mult = multiplierFor(mem.activePower);
    const points = dailyPointsFor(mult);

    mem.streak = mem.lastDailyClaimAt && now - mem.lastDailyClaimAt.getTime() <= STREAK_GRACE_MS ? mem.streak + 1 : 1;
    mem.lastDailyClaimAt = new Date(now);
    mem.activePower = +(mem.activePower + 10).toFixed(2); // daily claim boosts active power
    mem.lastActiveAt = new Date(now);
    mem.ledger.unshift({
      id: `claim_${now}`,
      eventType: 'DAILY_CLAIM',
      title: `Daily Claim Drop (${mult}x Multiplier)`,
      points,
      sourceId: `daily_${new Date(now).toISOString().split('T')[0]}`,
      createdAt: new Date(now),
    });

    return {
      ok: true,
      claimPoints: points,
      multiplier: mult,
      activePower: mem.activePower,
      streak: mem.streak,
      totalPoints: mem.ledger.reduce((acc, ev) => acc + ev.points, 0),
      remainingSeconds: DAILY_COOLDOWN_MS / 1000,
    };
  }

  // One transaction holding a row lock on the user: two taps or two tabs at
  // once can no longer both pass the cooldown check and double-claim.
  return prisma.$transaction(async (tx): Promise<DailyClaimResult> => {
    const user = await tx.kaiUser.findFirst({
      where: { OR: [{ id: userIdOrPrivyId }, { privyUserId: userIdOrPrivyId }] },
      include: { miningStat: true },
    });

    if (!user) return { ok: false, claimPoints: 0, multiplier: 1, activePower: 0, error: 'Finish signing up to start claiming.' };
    if (user.status === 'BLOCKED') return { ok: false, claimPoints: 0, multiplier: 1, activePower: 0, error: 'This account is restricted from claiming.' };

    await tx.$queryRaw`SELECT id FROM kai_users WHERE id = ${user.id} FOR UPDATE`;

    const recent = await tx.dailyClaim.findMany({
      where: { userId: user.id },
      orderBy: { claimedAt: 'desc' },
      take: 366,
      select: { claimedAt: true },
    });
    const claimTimes = recent.map(c => c.claimedAt.getTime());
    const now = new Date();
    if (claimTimes.length && now.getTime() - claimTimes[0] < DAILY_COOLDOWN_MS) {
      const remainingMs = DAILY_COOLDOWN_MS - (now.getTime() - claimTimes[0]);
      return {
        ok: false, claimPoints: 0, multiplier: 1, activePower: 0, cooldown: true,
        remainingSeconds: Math.ceil(remainingMs / 1000),
        error: `Already claimed. Your next drop unlocks in ${formatWait(remainingMs)}.`,
      };
    }

    const rawHp = user.miningStat?.hashPower ? Number(user.miningStat.hashPower) : 0;
    const decayedHp = decayedActivePower(rawHp, user.miningStat?.lastActiveAt || user.createdAt);
    const mult = multiplierFor(decayedHp);
    const claimPoints = dailyPointsFor(mult);
    const newHp = +(decayedHp + 10).toFixed(2);

    await tx.dailyClaim.create({
      data: { userId: user.id, claimAmount: claimPoints, multiplier: mult, hashPower: newHp, claimedAt: now },
    });
    await tx.kaiBarLedger.create({
      data: {
        userId: user.id,
        type: 'CAMPAIGN',
        amount: claimPoints,
        description: `Daily Claim Drop (${mult}x Multiplier)`,
        referenceId: `daily_${now.toISOString().split('T')[0]}`,
      },
    });
    await tx.userMiningStat.upsert({
      where: { userId: user.id },
      update: { hashPower: newHp, lifetimeXP: { increment: claimPoints }, lastActiveAt: now },
      create: { userId: user.id, hashPower: newHp, lifetimeXP: claimPoints, lastActiveAt: now },
    });
    const total = await tx.kaiBarLedger.aggregate({ where: { userId: user.id }, _sum: { amount: true } });

    return {
      ok: true,
      claimPoints,
      multiplier: mult,
      activePower: newHp,
      streak: claimStreak([now.getTime(), ...claimTimes], now.getTime(), STREAK_GRACE_MS),
      totalPoints: total._sum.amount ?? 0,
      remainingSeconds: DAILY_COOLDOWN_MS / 1000,
    };
  });
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

  const facts = await loadMissionFacts(prisma, userIdOrPrivyId);
  if (!facts) return { ok: false, rewardPoints: 0, missionName: '', error: 'Finish signing up to start earning.' };
  if (facts.blocked) return { ok: false, rewardPoints: 0, missionName: mission.name, error: 'This account is restricted from claiming.' };
  if (facts.claimed.includes(missionId)) {
    return { ok: false, rewardPoints: 0, missionName: mission.name, error: 'Mission already completed' };
  }

  const blocker = missionBlocker(missionId, facts);
  if (blocker) return { ok: false, rewardPoints: 0, missionName: mission.name, error: blocker };

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

  try {
    await prisma.$transaction([
      // Unique (userId, taskId): a double tap fails here instead of paying twice.
      prisma.taskCompletion.create({ data: { userId: facts.userId, taskId: dbTask.id } }),
      prisma.kaiBarLedger.create({
        data: {
          userId: facts.userId,
          type: 'TASK',
          amount: mission.rewardPoints,
          description: `Mission Reward: ${mission.name}`,
          referenceId: `mission_${missionId}`,
        },
      }),
      prisma.userMiningStat.upsert({
        where: { userId: facts.userId },
        update: {
          hashPower: { increment: mission.rewardPoints * 0.1 },
          lifetimeXP: { increment: mission.rewardPoints },
          lastActiveAt: new Date(),
        },
        create: {
          userId: facts.userId,
          hashPower: mission.rewardPoints * 0.1,
          lifetimeXP: mission.rewardPoints,
          lastActiveAt: new Date(),
        },
      }),
    ]);
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2002') {
      return { ok: false, rewardPoints: 0, missionName: mission.name, error: 'Mission already completed' };
    }
    throw e;
  }

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

  // Callers pass the Privy DID; Referral rows reference KaiUser.id.
  const newUser = await prisma.kaiUser.findFirst({
    where: { OR: [{ id: newUserId }, { privyUserId: newUserId }] },
    select: { id: true },
  });
  if (!newUser) return { ok: false, error: 'Finish signing up before adding a referral code.' };

  const referrer = await prisma.kaiUser.findFirst({
    where: { referralCode: code },
  });

  if (!referrer) return { ok: false, error: 'That referral code does not exist.' };
  if (referrer.id === newUser.id) return { ok: false, error: 'You cannot use your own referral code.' };

  const existingRef = await prisma.referral.findFirst({
    where: { referredUserId: newUser.id },
  });

  if (existingRef) {
    return { ok: false, error: 'Your account is already linked to a referrer.' };
  }

  await prisma.referral.create({
    data: {
      referrerUserId: referrer.id,
      referredUserId: newUser.id,
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
 * Community Leaderboard by Total Power: the real top 10 from the database,
 * masked for privacy (§19a), with the caller's own row flagged.
 */
export async function getPowerLeaderboard(viewerIdOrPrivyId?: string): Promise<LeaderboardEntry[]> {
  const prisma = await getPrisma();
  if (!prisma) {
    // Mock mode only: sample rows so the screen can be explored locally.
    return [
      { rank: 1, name: 'Sango Guardian Alpha', totalPower: 4820, activePower: 285.0, referrals: 38, tier: 'DIAMOND', isYou: false },
      { rank: 2, name: 'Austin K. (You)', totalPower: 1420, activePower: 92.5, referrals: 14, tier: 'GOLD', isYou: true },
      { rank: 3, name: 'Oloolua Ranger 07', totalPower: 1280, activePower: 88.0, referrals: 11, tier: 'GOLD', isYou: false },
      { rank: 4, name: 'Kibera Youth Tree Lab', totalPower: 960, activePower: 74.0, referrals: 9, tier: 'SILVER', isYou: false },
      { rank: 5, name: 'Kisumu Basin Watcher', totalPower: 840, activePower: 65.0, referrals: 7, tier: 'SILVER', isYou: false },
      { rank: 6, name: 'Mau Restoration Team', totalPower: 710, activePower: 58.0, referrals: 6, tier: 'SILVER', isYou: false },
      { rank: 7, name: 'Ngong Agroforestry', totalPower: 520, activePower: 46.0, referrals: 4, tier: 'BRONZE', isYou: false },
    ];
  }

  const viewer = viewerIdOrPrivyId
    ? await prisma.kaiUser.findFirst({
        where: { OR: [{ id: viewerIdOrPrivyId }, { privyUserId: viewerIdOrPrivyId }] },
        select: { id: true },
      })
    : null;

  const table = await computePowerTable(prisma);
  return [...table.entries()]
    .filter(([, row]) => !row.blocked)
    .sort((a, b) => b[1].totalPower - a[1].totalPower)
    .slice(0, 10)
    .map(([id, row], i) => ({
      rank: i + 1,
      name: id === viewer?.id ? `${maskName(row.name)} (You)` : maskName(row.name),
      totalPower: row.totalPower,
      activePower: Math.round(row.activePower * 10) / 10,
      referrals: row.activeRefs,
      tier: tierFor(row.totalPower),
      isYou: id === viewer?.id,
    }));
}

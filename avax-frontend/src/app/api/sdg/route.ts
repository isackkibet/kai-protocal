import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';

export interface SDGGoalStat {
  sdgNumber: number;
  code: string;
  name: string;
  color: string;
  icon: string;
  points: number;
  actionsCount: number;
  impactMetric: string;
  impactValue: string;
  description: string;
}

export interface SDGActionDefinition {
  id: string;
  title: string;
  sdgNumber: number;
  points: number;
  category: 'Environment' | 'Economy' | 'Community' | 'Agriculture';
  icon: string;
  desc: string;
  metricIncrease: string;
}

export const SDG_ACTIONS: SDGActionDefinition[] = [
  {
    id: 'cfa_tree_plant',
    title: 'Plant & Verify Indigenous Tree',
    sdgNumber: 15,
    points: 150,
    category: 'Environment',
    icon: '🌲',
    desc: 'Verify a seedling in community tree nursery with geotagged MRV proof.',
    metricIncrease: '+1 Tree Grown',
  },
  {
    id: 'carbon_credit_stake',
    title: 'Stake Sustainable Charcoal Credits',
    sdgNumber: 13,
    points: 120,
    category: 'Environment',
    icon: '💨',
    desc: 'Lock bio-charcoal carbon offset units to retire verified emissions.',
    metricIncrease: '+25 kg CO₂ Offset',
  },
  {
    id: 'artisan_nft_support',
    title: 'Support Traditional Cultural Artisan',
    sdgNumber: 8,
    points: 100,
    category: 'Economy',
    icon: '🎨',
    desc: 'Purchase or stake Maasai/Turkana beadwork or textile co-op NFTs.',
    metricIncrease: '+1 Artisan Funded',
  },
  {
    id: 'chama_savings_pool',
    title: 'Deposit in Community Saving Group (Chama)',
    sdgNumber: 1,
    points: 75,
    category: 'Community',
    icon: '🤝',
    desc: 'Provide micro-liquidity to decentralized community revolving funds.',
    metricIncrease: '+$10 Community Credit',
  },
  {
    id: 'water_rights_guard',
    title: 'Stake Community Water Rights',
    sdgNumber: 6,
    points: 90,
    category: 'Environment',
    icon: '💧',
    desc: 'Fund IoT water-table monitoring sensor arrays for pastoral grazing zones.',
    metricIncrease: '+500L Water Secured',
  },
  {
    id: 'heritage_seed_bank',
    title: 'Protect Heritage Seed Bank',
    sdgNumber: 2,
    points: 80,
    category: 'Agriculture',
    icon: '🌱',
    desc: 'Stake in drought-resistant indigenous seed preservation batches.',
    metricIncrease: '+1 Crop Variety Preserved',
  },
  {
    id: 'forest_patrol_log',
    title: 'Log CFA Community Forest Patrol',
    sdgNumber: 15,
    points: 110,
    category: 'Environment',
    icon: '🛡️',
    desc: 'Submit verified GPS ranger waypoint log preventing illegal logging.',
    metricIncrease: '+2 Hectares Protected',
  },
];

// Fallback in-memory ledger for wallets when DB connection is offline
const inMemorySDGLedger: Record<string, { actions: Array<{ actionId: string; points: number; timestamp: string }>; totalPoints: number }> = {};

function calculateTier(points: number): { tier: string; badge: string; multiplier: string; nextTierPts: number } {
  if (points >= 2000) return { tier: 'Planetary Steward', badge: '👑', multiplier: '2.5x', nextTierPts: 5000 };
  if (points >= 750)  return { tier: 'Climate Champion',  badge: '🌟', multiplier: '1.8x', nextTierPts: 2000 };
  if (points >= 250)  return { tier: 'Eco Guardian',      badge: '🌿', multiplier: '1.3x', nextTierPts: 750 };
  return { tier: 'Seedling Explorer', badge: '🌱', multiplier: '1.0x', nextTierPts: 250 };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const wallet = (searchParams.get('wallet') || '').toLowerCase();

  let userLedger = inMemorySDGLedger[wallet];
  if (!userLedger) {
    // Default initial demonstration state for new users
    userLedger = {
      actions: [
        { actionId: 'cfa_tree_plant', points: 150, timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },
        { actionId: 'chama_savings_pool', points: 75, timestamp: new Date(Date.now() - 86400000).toISOString() },
      ],
      totalPoints: 225,
    };
    inMemorySDGLedger[wallet] = userLedger;
  }

  // Count points by SDG Goal
  const pointsBySDG: Record<number, { points: number; count: number }> = {
    1: { points: 0, count: 0 },
    2: { points: 0, count: 0 },
    6: { points: 0, count: 0 },
    8: { points: 0, count: 0 },
    13: { points: 0, count: 0 },
    15: { points: 0, count: 0 },
  };

  userLedger.actions.forEach(act => {
    const def = SDG_ACTIONS.find(a => a.id === act.actionId);
    if (def && pointsBySDG[def.sdgNumber]) {
      pointsBySDG[def.sdgNumber].points += act.points;
      pointsBySDG[def.sdgNumber].count += 1;
    }
  });

  const goals: SDGGoalStat[] = [
    {
      sdgNumber: 13,
      code: 'SDG 13',
      name: 'Climate Action',
      color: '#3F7E44',
      icon: '🌍',
      points: pointsBySDG[13].points,
      actionsCount: pointsBySDG[13].count,
      impactMetric: 'Carbon Offset',
      impactValue: `${(pointsBySDG[13].points * 0.25).toFixed(1)} kg CO₂`,
      description: 'Funding verified reforestation, carbon credit staking, and clean energy woodlots.',
    },
    {
      sdgNumber: 15,
      code: 'SDG 15',
      name: 'Life on Land',
      color: '#56C02B',
      icon: '🌲',
      points: pointsBySDG[15].points,
      actionsCount: pointsBySDG[15].count,
      impactMetric: 'Trees & Hectares',
      impactValue: `${Math.max(1, Math.round(pointsBySDG[15].points / 75))} Trees Protected`,
      description: 'Tree nursery MRV verification, biodiversity conservation NFTs, and ranger patrols.',
    },
    {
      sdgNumber: 8,
      code: 'SDG 8',
      name: 'Decent Work & Economy',
      color: '#A21942',
      icon: '📈',
      points: pointsBySDG[8].points,
      actionsCount: pointsBySDG[8].count,
      impactMetric: 'Artisans Funded',
      impactValue: `${Math.max(1, Math.round(pointsBySDG[8].points / 100))} Artisan Co-ops`,
      description: 'Backing cultural Maasai & Turkana beadwork NFTs, weaving guilds, and MSME liquidity.',
    },
    {
      sdgNumber: 1,
      code: 'SDG 1',
      name: 'No Poverty',
      color: '#E5243B',
      icon: '🤝',
      points: pointsBySDG[1].points,
      actionsCount: pointsBySDG[1].count,
      impactMetric: 'Community Micro-Capital',
      impactValue: `$${(pointsBySDG[1].points * 0.15 + 10).toFixed(2)} Pooled`,
      description: 'Decentralized Chama saving pools and emergency community healthcare vaults.',
    },
    {
      sdgNumber: 6,
      code: 'SDG 6',
      name: 'Clean Water & Sanitation',
      color: '#26BDE2',
      icon: '💧',
      points: pointsBySDG[6].points,
      actionsCount: pointsBySDG[6].count,
      impactMetric: 'Water Monitored',
      impactValue: `${Math.round(pointsBySDG[6].points * 5.5 + 250)} Liters`,
      description: 'Funding IoT sensors for pastoral water tables and drought credit relief.',
    },
    {
      sdgNumber: 2,
      code: 'SDG 2',
      name: 'Zero Hunger',
      color: '#DDA63A',
      icon: '🌾',
      points: pointsBySDG[2].points,
      actionsCount: pointsBySDG[2].count,
      impactMetric: 'Seed Strains Guarded',
      impactValue: `${Math.max(1, Math.round(pointsBySDG[2].points / 80))} Varieties`,
      description: 'Heritage seed preservation banks, pastoral dairy pooling, and crop insurance.',
    },
  ];

  const totalPoints = userLedger.totalPoints;
  const tierInfo = calculateTier(totalPoints);

  return NextResponse.json({
    wallet,
    totalPoints,
    tier: tierInfo.tier,
    badge: tierInfo.badge,
    multiplier: tierInfo.multiplier,
    nextTierPts: tierInfo.nextTierPts,
    progressToNextTier: Math.min(Math.round((totalPoints / tierInfo.nextTierPts) * 100), 100),
    goals,
    availableActions: SDG_ACTIONS,
    recentHistory: userLedger.actions.slice(-6).reverse(),
  });
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const { wallet, actionId } = body;

    if (!actionId) {
      return NextResponse.json({ error: 'actionId is required' }, { status: 400 });
    }

    const actionDef = SDG_ACTIONS.find(a => a.id === actionId);
    if (!actionDef) {
      return NextResponse.json({ error: 'Invalid actionId' }, { status: 400 });
    }

    const userWalletKey = (wallet || '0x_anonymous').toLowerCase();
    if (!inMemorySDGLedger[userWalletKey]) {
      inMemorySDGLedger[userWalletKey] = { actions: [], totalPoints: 0 };
    }

    // Record action
    inMemorySDGLedger[userWalletKey].actions.push({
      actionId: actionDef.id,
      points: actionDef.points,
      timestamp: new Date().toISOString(),
    });
    inMemorySDGLedger[userWalletKey].totalPoints += actionDef.points;

    // Also attempt to write to Prisma KaiBarLedger if configured
    try {
      const prisma = await getPrisma();
      if (wallet && prisma) {
        const kaiUser = await prisma.kaiUser.findFirst({
          where: {
            wallets: { some: { address: { equals: wallet, mode: 'insensitive' } } },
          },
        });

        if (kaiUser) {
          await prisma.kaiBarLedger.create({
            data: {
              userId: kaiUser.id,
              type: 'COMMUNITY_ACTIVITY',
              amount: actionDef.points,
              description: `SDG ${actionDef.sdgNumber}: ${actionDef.title}`,
              referenceId: actionDef.id,
            },
          });
        }
      }
    } catch {
      // Non-blocking fallback
    }

    const updatedPoints = inMemorySDGLedger[userWalletKey].totalPoints;
    const tierInfo = calculateTier(updatedPoints);

    return NextResponse.json({
      success: true,
      awardedPoints: actionDef.points,
      totalPoints: updatedPoints,
      action: actionDef,
      tier: tierInfo.tier,
      badge: tierInfo.badge,
      message: `🎉 +${actionDef.points} SDG Points earned for ${actionDef.title}!`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

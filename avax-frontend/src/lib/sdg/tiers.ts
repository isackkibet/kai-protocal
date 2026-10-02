/**
 * SDG Impact levels: more points, a higher level and a bigger airdrop boost.
 * Used by /api/sdg and the /sdg page, so the ladder shown is the one applied.
 */
export interface SdgTier { name: string; from: number; boost: string }

export const SDG_TIERS: SdgTier[] = [
  { name: 'Seedling Explorer', from: 0, boost: '1.0x' },
  { name: 'Eco Guardian', from: 250, boost: '1.3x' },
  { name: 'Climate Champion', from: 750, boost: '1.8x' },
  { name: 'Planetary Steward', from: 2000, boost: '2.5x' },
];

/** The level for a points total, and the points where the next one starts (5000 after the top). */
export function tierFor(points: number): { tier: SdgTier; index: number; nextAt: number } {
  let index = 0;
  for (let i = 0; i < SDG_TIERS.length; i++) if (points >= SDG_TIERS[i].from) index = i;
  return { tier: SDG_TIERS[index], index, nextAt: SDG_TIERS[index + 1]?.from ?? 5000 };
}

import {
  Thermometer, Trees, Briefcase, HeartHandshake, Droplets, Wheat,
  Sprout, Leaf, Star, Crown, type LucideIcon,
} from 'lucide-react';

/* Real icons instead of emoji for SDG goals/actions/tiers — the API still
   returns an `icon` emoji field for backward compatibility, but nothing
   user-facing renders it directly anymore. */
export const SDG_ICON: Record<number, LucideIcon> = {
  13: Thermometer,      // Climate Action
  15: Trees,             // Life on Land
  8:  Briefcase,          // Decent Work & Economy
  1:  HeartHandshake,     // No Poverty
  6:  Droplets,           // Clean Water & Sanitation
  2:  Wheat,              // Zero Hunger
};

export function iconForSdg(sdgNumber: number): LucideIcon {
  return SDG_ICON[sdgNumber] ?? Leaf;
}

export const TIER_ICON: Record<string, LucideIcon> = {
  'Seedling Explorer': Sprout,
  'Eco Guardian':       Leaf,
  'Climate Champion':   Star,
  'Planetary Steward':  Crown,
};

export function iconForTier(tier: string): LucideIcon {
  return TIER_ICON[tier] ?? Sprout;
}

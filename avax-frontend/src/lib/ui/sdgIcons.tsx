import {
  Thermometer, Trees, Briefcase, HeartHandshake, Droplets, Wheat,
  Sprout, Leaf, Globe, type LucideIcon,
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
  'Climate Champion':   Trees,
  'Planetary Steward':  Globe,
};

export function iconForTier(tier: string): LucideIcon {
  return TIER_ICON[tier] ?? Sprout;
}

type GlyphProps = { size?: number; strokeWidth?: number; className?: string };

/** The icon for an SDG goal, as a component (a static lookup, safe to render in lists). */
export function SdgGlyph({ n, ...props }: GlyphProps & { n: number }) {
  const Icon = SDG_ICON[n] ?? Leaf;
  return <Icon {...props} />;
}

/** The icon for an SDG Impact level. */
export function TierGlyph({ name, ...props }: GlyphProps & { name: string }) {
  const Icon = TIER_ICON[name] ?? Sprout;
  return <Icon {...props} />;
}

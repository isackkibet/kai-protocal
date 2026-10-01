/**
 * Shared editorial design system for the dual Information Hubs:
 * 1. SIHU Information Hub (The Blue Hub — Sango Knowledge & Lake Victoria Basin News)
 * 2. Oloolua Conservation Hub (The Green Hub — Youth Guardians & CFA Tree MRV)
 */
export const HUB_THEME = {
  bg:        '#0B1C14',
  bgSoft:    '#0A2A20',
  card:      '#0F2419',
  pine:      '#0F3D2E',
  pineLight: '#2D5A3D',
  gold:      '#C89B3C',
  goldLight: '#E4C878',
  clay:      '#9C4B2D',
  red:       '#E88C7D',
  paper:     '#F6F2E7',
  paperDim:  '#EFE9D9',
  ink:       '#1B1A14',
  inkLight:  '#9BA396',
  hairline:  'rgba(200,155,60,0.14)',
} as const;

/** Authentic SIHU Blue Information Hub Theme (Sango Media & Knowledge Portal) */
export const SIHU_THEME = {
  bg:        '#020617', // Slate 950
  bgSoft:    '#081226',
  card:      '#0B1934',
  cardAlt:   '#0F2346',
  blue:      '#38BDF8', // Sky 400
  blueDeep:  '#0284C7', // Sky 600
  blueLight: '#7DD3FC',
  blueGlow:  'rgba(56, 189, 248, 0.18)',
  indigo:    '#6366F1',
  cyan:      '#06B6D4',
  hairline:  'rgba(56, 189, 248, 0.22)',
  text:      '#F8FAFC',
  textDim:   '#94A3B8',
  textMuted: '#64748B',
  accent:    '#58B3F2',
} as const;

/** Authentic Oloolua Green Conservation Hub Theme (Youth Guardians CFA) */
export const OLOOLUA_THEME = {
  bg:        '#04150E',
  bgSoft:    '#072217',
  card:      '#0A2D20',
  cardAlt:   '#0E3A2A',
  emerald:   '#10B981',
  emeraldDark:'#059669',
  emeraldLight:'#34D399',
  emeraldGlow:'rgba(16, 185, 129, 0.18)',
  gold:      '#F59E0B',
  goldLight: '#FDE68A',
  hairline:  'rgba(16, 185, 129, 0.22)',
  text:      '#ECFDF5',
  textDim:   '#A7F3D0',
  textMuted: '#6EE7B7',
  accent:    '#10B981',
} as const;

export const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', var(--font-plex-mono), monospace" };
export const SERIF: React.CSSProperties = { fontFamily: "'Fraunces', serif" };
export const SANS: React.CSSProperties = { fontFamily: "'IBM Plex Sans', sans-serif" };

export function labelStyle(over?: React.CSSProperties): React.CSSProperties {
  return { ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: HUB_THEME.goldLight, fontWeight: 600, margin: 0, ...over };
}

export function sihuLabelStyle(over?: React.CSSProperties): React.CSSProperties {
  return { ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: SIHU_THEME.blueLight, fontWeight: 600, margin: 0, ...over };
}

export function olooluaLabelStyle(over?: React.CSSProperties): React.CSSProperties {
  return { ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: OLOOLUA_THEME.emeraldLight, fontWeight: 600, margin: 0, ...over };
}

/** Editorial hairline section separator used across hub pages. */
export function hairline(): React.CSSProperties {
  return { borderTop: `1px solid ${HUB_THEME.hairline}` };
}
/**
 * Shared editorial design system for the dual Information Hubs:
 * 1. SIHU Information Hub (The Blue Hub — Sango Knowledge & Lake Victoria Basin News)
 * 2. Oloolua Conservation Hub (The Green Hub — Youth Guardians & CFA Tree MRV)
 */
export const HUB_THEME = {
  bg:        '#0E2418',
  bgSoft:    '#12301F',
  card:      '#15352A',
  pine:      '#12301F',
  pineLight: '#2D5A3D',
  gold:      '#C89B3C',
  goldLight: '#E4C878',
  clay:      '#E0926F',
  red:       '#E88C7D',
  paper:     '#F6F2E7',
  paperDim:  '#C9CFC2',
  ink:       '#1B1A14',
  inkLight:  '#9BA396',
  hairline:  'rgba(246,242,231,0.08)',
} as const;

/** SIHU (Sango) hub: the same calm pine surfaces as the rest of the app,
 *  with blue only as its accent so people can tell the two hubs apart. */
export const SIHU_THEME = {
  bg:        '#0E2418',
  bgSoft:    '#12301F',
  card:      '#15352A',
  cardAlt:   '#1B4032',
  blue:      '#6FA8DC',
  blueDeep:  '#4C88C2',
  blueLight: '#9CC3E8',
  blueGlow:  'rgba(111,168,220,0.16)',
  indigo:    '#8C9EE0',
  cyan:      '#6FC3B8',
  hairline:  'rgba(246,242,231,0.08)',
  text:      '#F6F2E7',
  textDim:   '#C9CFC2',
  textMuted: '#9BA396',
  accent:    '#6FA8DC',
} as const;

/** Oloolua hub: pine surfaces with a soft green accent. */
export const OLOOLUA_THEME = {
  bg:        '#0E2418',
  bgSoft:    '#12301F',
  card:      '#15352A',
  cardAlt:   '#1B4032',
  emerald:   '#7DC383',
  emeraldDark:'#5FA866',
  emeraldLight:'#A9D8AE',
  emeraldGlow:'rgba(125,195,131,0.16)',
  gold:      '#C89B3C',
  goldLight: '#E4C878',
  hairline:  'rgba(246,242,231,0.08)',
  text:      '#F6F2E7',
  textDim:   '#C9CFC2',
  textMuted: '#9BA396',
  accent:    '#7DC383',
} as const;

/* One font family everywhere (Inter, as on the home page). The names stay so
   existing pages keep working: MONO is the small "eyebrow" label style. */
export const MONO: React.CSSProperties = { fontFamily: "'Inter', system-ui, sans-serif" };
export const SERIF: React.CSSProperties = { fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: '-0.01em' };
export const SANS: React.CSSProperties = { fontFamily: "'Inter', system-ui, sans-serif" };

export function labelStyle(over?: React.CSSProperties): React.CSSProperties {
  return { ...MONO, fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase', color: HUB_THEME.goldLight, fontWeight: 700, margin: 0, ...over };
}

export function sihuLabelStyle(over?: React.CSSProperties): React.CSSProperties {
  return { ...MONO, fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase', color: SIHU_THEME.blueLight, fontWeight: 700, margin: 0, ...over };
}

export function olooluaLabelStyle(over?: React.CSSProperties): React.CSSProperties {
  return { ...MONO, fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase', color: OLOOLUA_THEME.emeraldLight, fontWeight: 700, margin: 0, ...over };
}

/** Editorial hairline section separator used across hub pages. */
export function hairline(): React.CSSProperties {
  return { borderTop: `1px solid ${HUB_THEME.hairline}` };
}
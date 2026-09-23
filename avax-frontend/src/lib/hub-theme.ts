/**
 * Shared editorial design system for the SIHU information hub and the
 * Conservation / CFA information hub. Mirrors the kaiweb palette used by the
 * rest of the app (pine + gold + paper, flat hairline sections, no boxes).
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

export const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', var(--font-plex-mono), monospace" };
export const SERIF: React.CSSProperties = { fontFamily: "'Fraunces', serif" };
export const SANS: React.CSSProperties = { fontFamily: "'IBM Plex Sans', sans-serif" };

export function labelStyle(over?: React.CSSProperties): React.CSSProperties {
  return { ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: HUB_THEME.goldLight, fontWeight: 600, margin: 0, ...over };
}

/** Editorial hairline section separator used across hub pages. */
export function hairline(): React.CSSProperties {
  return { borderTop: `1px solid ${HUB_THEME.hairline}` };
}
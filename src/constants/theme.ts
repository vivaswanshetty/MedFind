/**
 * MedFind Theme Foundation & Design Tokens
 * 
 * Sourced directly from approved MedFind visual identity:
 * - Light (Warm Editorial): Sage Green (#87A96B), Walnut Brown (#5A3E2B), Amber Glow (#D5851F), Warm Cream (#F7F2E8)
 * - Dark (Cinematic): Jet Black (#050505), Royal Amethyst (#3B0A6B), Electric Cyan (#00E5FF)
 */

export type SchemeName = 'light' | 'dark';

export const palettes = {
  light: {
    bg: '#F7F2E8',
    surface: '#FFFCF5',
    surface2: '#F0E8D7',
    line: '#E1D6C1',
    ink: '#5A3E2B',
    ink2: '#735B4C',
    accent: '#87A96B',
    okTint: '#E0EAD1',
    okInk: '#2E4A1D',
    okLine: '#C2D7A5',
    amber: '#E28C2B',
    amberOn: '#2A1600',
    amberTint: '#F8E4C0',
    amberInk: '#74420A',
    amberLine: '#ECCCA0',
    stale: '#D8731F',
    staleTint: '#FCEBD9',
    staleInk: '#873B03',
    staleLine: '#F3C59F',
    badTint: '#F6D9D4',
    badInk: '#8A1C15',
    naTint: '#E9E2D3',
    naInk: '#665548',
    red: '#B3261E',
    redLine: 'rgba(179,38,30,0.5)',
    btn: '#5A3E2B',
    btnInk: '#FFF8EC',
    btnBorder: '#5A3E2B',
    selBorder: '#5A3E2B',
    focus: '#4E7A30',
    navBg: 'rgba(255,252,245,0.95)',
    navOn: '#E0EAD1',
    navOnInk: '#2E4A1D',
    highlight: 'rgba(135,169,107,0.36)',
    logoBg: '#87A96B',
    logoInk: '#22331A',
    shadow: '#5A3E2B',
  },
  dark: {
    bg: '#050505',
    surface: '#121216',
    surface2: '#1B1B22',
    line: '#2B2A36',
    ink: '#F4F2FA',
    ink2: '#ABA8BC',
    accent: '#00E5FF',
    okTint: 'rgba(0,229,255,0.13)',
    okInk: '#00E5FF',
    okLine: 'rgba(0,229,255,0.35)',
    amber: '#F2A33A',
    amberOn: '#2A1600',
    amberTint: 'rgba(242,163,58,0.16)',
    amberInk: '#F7B866',
    amberLine: 'rgba(242,163,58,0.35)',
    stale: '#FF7A29',
    staleTint: 'rgba(255,122,41,0.18)',
    staleInk: '#FFA46B',
    staleLine: 'rgba(255,122,41,0.35)',
    badTint: 'rgba(255,95,95,0.15)',
    badInk: '#FF9090',
    naTint: '#26262E',
    naInk: '#B5B2C4',
    red: '#C81E2E',
    redLine: 'rgba(255,100,110,0.55)',
    btn: '#3B0A6B',
    btnInk: '#FFFFFF',
    btnBorder: '#6C2DB8',
    selBorder: '#00E5FF',
    focus: '#00E5FF',
    navBg: 'rgba(10,10,14,0.95)',
    navOn: '#3B0A6B',
    navOnInk: '#FFFFFF',
    highlight: 'rgba(139,70,220,0.45)',
    logoBg: '#3B0A6B',
    logoInk: '#00E5FF',
    shadow: '#000000',
  },
};

export type Palette = typeof palettes.light;

// Radial "atmosphere" blobs. cx, cy, rx, ry are FRACTIONS of screen width/height.
// Each blob fades from `opacity` at its centre to 0 at `stop` (fraction of the radius).
export const atmosphere = {
  light: {
    base: '#F7F2E8',
    blobs: [
      { cx: 0.90, cy: -0.02, rx: 1.15, ry: 0.60, rgb: '125,170,95', opacity: 0.70, stop: 0.85 },
      { cx: 0.05, cy: 0.12, rx: 0.95, ry: 0.45, rgb: '150,190,120', opacity: 0.45, stop: 0.82 },
      { cx: -0.10, cy: 0.78, rx: 0.85, ry: 0.45, rgb: '228,142,40', opacity: 0.32, stop: 0.80 },
      { cx: 1.05, cy: 0.92, rx: 0.75, ry: 0.40, rgb: '135,175,105', opacity: 0.35, stop: 0.80 },
    ],
  },
  dark: {
    base: '#050505',
    blobs: [
      { cx: 0.08, cy: -0.08, rx: 1.25, ry: 0.55, rgb: '59,10,107', opacity: 0.95, stop: 0.70 },
      { cx: 1.05, cy: 0.04, rx: 0.68, ry: 0.32, rgb: '0,229,255', opacity: 0.22, stop: 0.75 },
    ],
  },
};

/**
 * Fonts configured in the application (using installed SF Pro Display family)
 */
export const fonts = {
  serifMedium: 'SF-Pro-Display-Semibold',
  serif: 'SF-Pro-Display-Bold',
  sans: 'SF-Pro-Display-Regular',
  sansMedium: 'SF-Pro-Display-Medium',
  sansSemi: 'SF-Pro-Display-Semibold',
  sansBold: 'SF-Pro-Display-Bold',
  sansXBold: 'SF-Pro-Display-Bold',
};

export const radii = {
  chip: 14,
  card: 20,
  cardLg: 22,
  pill: 999,
  tab: 16,
};

export const MIN_TARGET = 44;

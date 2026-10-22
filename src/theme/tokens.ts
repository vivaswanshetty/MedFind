/**
 * MedFind Design System Tokens
 * Conforming strictly to Design Doc.docx approved themes and accessibility baselines:
 * - Light Mode: Sage Green (#87A96B), Walnut Brown (#5A3E2B), Amber Glow (#D5851F)
 * - Dark Mode: Jet Black (#050505), Royal Amethyst (#3B0A6B), Electric Cyan (#00E5FF)
 * - WCAG AA contrast compliance
 * - Minimum 44 x 44 point tap target size
 * - Status labels that do not rely on color alone
 */

export type ThemeMode = 'light' | 'dark';

export interface ColorPalette {
  canvas: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderFocus: string;
  
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  
  primaryAccent: string;
  secondaryAccent: string;
  warningAccent: string;
  urgentAccent: string;

  badgeBackground: string;
  badgeBorder: string;

  emergencyBackground: string;
  emergencyText: string;
  emergencyBorder: string;
}

export const lightPalette: ColorPalette = {
  canvas: '#FBF9F5',            // Warm off-white
  surface: '#FFFFFF',           // Crisp card background
  surfaceElevated: '#F3EFE8',   // Slightly elevated card
  border: '#E3DDD3',            // Warm subtle divider
  borderFocus: '#87A96B',       // Sage Green focus ring

  textPrimary: '#5A3E2B',       // Walnut Brown editorial hierarchy
  textSecondary: '#6B5A4E',     // Muted walnut
  textMuted: '#8A7A6F',         // Accessible tertiary
  textInverse: '#FFFFFF',

  primaryAccent: '#87A96B',     // Sage Green (verified availability, calm primary)
  secondaryAccent: '#5A3E2B',   // Walnut Brown
  warningAccent: '#D5851F',     // Amber Glow (aging freshness warning)
  urgentAccent: '#B23B2A',      // Calm emergency accent (accessible against off-white)

  badgeBackground: '#EEF3EA',   // Light Sage tint
  badgeBorder: '#87A96B',

  emergencyBackground: '#FDF1EE', // Soft calm emergency pill
  emergencyText: '#942B1D',
  emergencyBorder: '#E29A8E',
};

export const darkPalette: ColorPalette = {
  canvas: '#050505',            // Jet Black base canvas
  surface: '#111116',           // Dark surface
  surfaceElevated: '#1A1824',   // Elevated charcoal surface
  border: '#292535',            // Royal Amethyst muted border
  borderFocus: '#00E5FF',       // Electric Cyan focus ring

  textPrimary: '#EDEDED',       // Near-white primary text
  textSecondary: '#B0B0BC',     // Accessible light gray
  textMuted: '#787688',         // Subtle timestamp text
  textInverse: '#050505',

  primaryAccent: '#00E5FF',     // Electric Cyan (urgent scan accent, verified signal)
  secondaryAccent: '#3B0A6B',   // Royal Amethyst (brand accent, card accents)
  warningAccent: '#D5851F',     // Amber Glow (aging alert)
  urgentAccent: '#FF5C5C',      // Calm high-contrast emergency signal

  badgeBackground: '#0B2228',   // Dark cyan tint
  badgeBorder: '#00E5FF',

  emergencyBackground: '#260B0F', // Dark calm emergency container
  emergencyText: '#FF7B7B',
  emergencyBorder: '#5C1A22',
};

export const typography = {
  fontFamilySystem: 'System',
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,     // 16pt base mobile text
    md: 18,
    lg: 20,
    xl: 24,
    title: 28,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    base: 24,
    md: 26,
    lg: 28,
    xl: 32,
    title: 36,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const layout = {
  minTouchTarget: 44, // Minimum 44x44pt tap target requirement
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 16,
    pill: 9999,
  },
};

/**
 * Non-color status indicators:
 * Every state pairs a visible text label and semantic prefix with its visual token.
 */
export const statusLabels = {
  stock: {
    available: {
      text: 'Available',
      symbol: '[In Stock]',
      accessibilityLabel: 'Available in stock',
    },
    low_stock: {
      text: 'Low Stock',
      symbol: '[Limited]',
      accessibilityLabel: 'Low stock available — call first',
    },
    unavailable: {
      text: 'Unavailable',
      symbol: '[Out of Stock]',
      accessibilityLabel: 'Currently unavailable at this store',
    },
    unknown: {
      text: 'Unknown',
      symbol: '[Unverified]',
      accessibilityLabel: 'Stock state unknown — verification required',
    },
  },
  freshness: {
    recent: {
      label: 'Verified Recently',
      badgeText: 'Recent (≤ 30 min)',
      guidance: 'Recently confirmed by store',
      accessibilityLabel: 'Stock updated within the last 30 minutes',
    },
    aging: {
      label: 'Update Aging',
      badgeText: 'Aging (30m - 2h) — Call first',
      guidance: 'Call store to confirm before visiting',
      accessibilityLabel: 'Update is 30 minutes to 2 hours old. Call store first.',
    },
    stale: {
      label: 'Update Stale',
      badgeText: 'Stale (> 2h) — Call first',
      guidance: 'Likely out of date; call store before travel',
      accessibilityLabel: 'Update is more than 2 hours old. Must call store to confirm.',
    },
    unknown: {
      label: 'Timestamp Unverified',
      badgeText: 'Unknown Timestamp — Call first',
      guidance: 'No valid timestamp available',
      accessibilityLabel: 'No valid timestamp. Always call store first.',
    },
  },
};

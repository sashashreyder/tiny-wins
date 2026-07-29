import { GardenVibe, ThemeMode } from '@/types';

export const colors = {
  softLilac: '#C8B6FF',
  periwinkle: '#B8C0FF',
  aqua: '#7DE2D1',
  softCoral: '#FF8A7A',
  warmCream: '#FFF8EE',
  inkViolet: '#211A3A',
  deepNight: '#141222',
  cardDark: '#211F35',
  successMint: '#9BF6C3',
  warningPeach: '#FFD6A5',
  white: '#FFFFFF',
  muted: '#6B6580',
};

export const lightTheme = {
  mode: 'light' as const,
  background: '#F5F0FF',
  backgroundAlt: colors.warmCream,
  surface: 'rgba(255, 255, 255, 0.72)',
  surfaceBorder: 'rgba(200, 182, 255, 0.35)',
  text: colors.inkViolet,
  textSecondary: '#5A5278',
  textMuted: colors.muted,
  accent: colors.softCoral,
  accentSecondary: colors.aqua,
  accentTertiary: colors.softLilac,
  gradientStart: '#EDE7FF',
  gradientEnd: '#FFF8EE',
  cardGlow: 'rgba(200, 182, 255, 0.25)',
  success: colors.successMint,
  warning: colors.warningPeach,
  tabBar: 'rgba(255, 255, 255, 0.92)',
  sidebar: 'rgba(245, 240, 255, 0.95)',
};

export const darkTheme = {
  mode: 'dark' as const,
  background: colors.deepNight,
  backgroundAlt: '#1A1830',
  surface: 'rgba(33, 31, 53, 0.85)',
  surfaceBorder: 'rgba(200, 182, 255, 0.18)',
  text: '#F0EBFF',
  textSecondary: '#C8B6FF',
  textMuted: '#9B94B8',
  accent: colors.softCoral,
  accentSecondary: colors.aqua,
  accentTertiary: colors.periwinkle,
  gradientStart: '#141222',
  gradientEnd: '#211A3A',
  cardGlow: 'rgba(125, 226, 209, 0.12)',
  success: colors.successMint,
  warning: colors.warningPeach,
  tabBar: 'rgba(20, 18, 34, 0.95)',
  sidebar: 'rgba(26, 24, 48, 0.98)',
};

export type AppTheme = typeof lightTheme | typeof darkTheme;

export function resolveTheme(mode: ThemeMode, systemIsDark: boolean): AppTheme {
  if (mode === 'dark') return darkTheme;
  if (mode === 'light') return lightTheme;
  return systemIsDark ? darkTheme : lightTheme;
}

export const gardenVibeLabels: Record<GardenVibe, string> = {
  'cozy-night': 'Cozy night garden',
  'lilac-greenhouse': 'Soft lilac greenhouse',
  'space-planet': 'Tiny space planet',
  'magic-desk': 'Magic desk garden',
};

export const brandNames = [
  'Tiny Wins Garden',
  'ADHD Tiny Wins',
  'Brain Garden',
  'Dopamine Garden',
  'Little Wins Lab',
];

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  full: 999,
};

export const typography = {
  hero: { fontSize: 36, lineHeight: 42, fontWeight: '700' as const },
  h1: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '600' as const },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
};

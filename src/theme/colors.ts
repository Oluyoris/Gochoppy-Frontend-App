// src/theme/colors.ts
export const colors = {
  light: {
    background: '#FFFFFF',
    surface: '#FFFFFF',           // cards, search bar, modals
    textPrimary: '#1A2E2B',
    textSecondary: '#8FABA8',
    border: '#EDEDED',
    teal: '#00897B',
    tealDark: '#00695C',
    tealBg: '#E0F2F1',
    tealBanner: '#00897B',
    orange: '#FF6200',
    star: '#FFB300',
    warmBeige: '#FDF3E7',
    warmBeige2: '#FAE8D0',
    warmAccent: '#F5C89A',
    filterSectionBg: '#EDF7F6',
    warmSectionBg: '#FDF3E7',
  },
  dark: {
    background: '#0F172A',        // nice dark slate
    surface: '#1E2937',           // cards & panels
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    border: '#334155',
    teal: '#00897B',              // brand color stays
    tealDark: '#00BFA5',
    tealBg: '#1C2F2C',
    tealBanner: '#00695C',
    orange: '#FF6200',            // brand color stays
    star: '#FFB300',
    warmBeige: '#2C241F',         // dark warm tone
    warmBeige2: '#3A2C24',
    warmAccent: '#E6B07A',
    filterSectionBg: '#1C2F2C',
    warmSectionBg: '#2C241F',
  },
} as const;

export type ThemeColors = typeof colors.light;
export type ThemeMode = 'light' | 'dark';
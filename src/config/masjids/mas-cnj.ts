import { defaultConfig } from '../default';
import type { MasjidConfig } from '../types';

export const masCnjConfig: MasjidConfig = {
  ...defaultConfig,
  id: 'mas-cnj',
  displayName: 'MAS Central New Jersey',
  tagline: 'Muslim American Society — Central New Jersey',
  colors: {
    ...defaultConfig.colors,
    primary: '30 58 90',             // #1E3A5A  navy blue
    primaryForeground: '255 251 242', // #FFFBF2  cream
    accent: '59 130 246',            // #3B82F6  bright blue
    accentForeground: '255 255 255', // #FFFFFF  white
    background: '240 244 255',       // #F0F4FF  light blue tint
    foreground: '30 58 90',          // #1E3A5A  navy
    muted: '226 232 243',            // #E2E8F3  soft blue-grey
    mutedForeground: '71 85 105',    // #475569  slate
    border: '203 213 225',           // #CBD5E1  slate-300
    card: '248 250 255',             // #F8FAFF  near-white blue
    cardForeground: '30 58 90',      // #1E3A5A  navy
    onboardingBackground: '15 30 50', // #0F1E32  deep navy
    onboardingSurface: '255 251 242', // #FFFBF2  cream
    onboardingAccent: '59 130 246',   // #3B82F6  bright blue
    onboardingHalo1: '25 55 95',      // #19375F  mid navy
    onboardingHalo2: '59 130 246',    // #3B82F6  bright blue
    onboardingHalo3: '10 22 40',      // #0A1628  deep navy
    onboardingLayer: '10 20 38',      // #0A1426  darkest navy
  },
  locale: 'en',
  timezone: 'America/New_York',
  prayerCalculationMethod: 'ISNA',
};

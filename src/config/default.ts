import type { MasjidConfig } from './types';

/**
 * Neutral fallback config. Used when:
 *   - `MASJID_ID` is unset (local dev without explicit variant)
 *   - The bundled registry has no entry for the current `MASJID_ID`
 *   - A Supabase row omits a field that a screen needs
 */
export const defaultConfig: MasjidConfig = {
  id: 'default',
  displayName: 'Sahla',
  tagline: 'Your masjid, in your pocket',
  colors: {
    primary: '16 122 87', //       #107A57  green
    primaryForeground: '255 255 255',
    accent: '212 175 55', //       #D4AF37  gold
    accentForeground: '24 24 27',
    background: '250 250 249', //  stone-50
    foreground: '24 24 27', //     zinc-900
    muted: '228 228 231', //       zinc-200
    mutedForeground: '113 113 122', // zinc-500
    border: '212 212 216', //      zinc-300
    onboardingBackground: '10 38 30', //   #0a261e  deep green
    onboardingSurface: '255 251 242', //   #fffbf2  cream
    onboardingAccent: '184 146 42', //     #b8922a  gold
    onboardingHalo1: '15 59 48', //        #0f3b30  outer halo
    onboardingHalo2: '20 80 63', //        #14503f  mid halo
    onboardingHalo3: '26 102 80', //       #1a6650  inner halo
    onboardingLayer: '7 31 24', //         #071F18  depth/layering (brand: darker than bg)
  },
  features: {
    prayerTimes: true,
    events: true,
    donations: false,
    announcements: true,
    jumaahRegistration: false,
  },
  locale: 'en',
  timezone: 'UTC',
  prayerCalculationMethod: 'ISNA',
};

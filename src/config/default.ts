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

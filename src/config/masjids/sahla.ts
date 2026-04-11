import { defaultConfig } from '../default';
import type { MasjidConfig } from '../types';

/**
 * Demo tenant used for local development and the first EAS build profile.
 * Colors deliberately differ from `defaultConfig` so it's obvious at a glance
 * which config is active during testing.
 */
export const sahlaConfig: MasjidConfig = {
  ...defaultConfig,
  id: 'sahla',
  displayName: 'Sahla Demo Masjid',
  tagline: 'A sample tenant for local development',
  colors: {
    ...defaultConfig.colors,
    primary: '37 99 235', //       blue-600
    primaryForeground: '255 255 255',
    accent: '234 179 8', //        yellow-500
    accentForeground: '24 24 27',
  },
  features: {
    ...defaultConfig.features,
    donations: true,
    jumaahRegistration: true,
  },
  locale: 'en',
  timezone: 'America/New_York',
  prayerCalculationMethod: 'ISNA',
};

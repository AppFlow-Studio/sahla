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
  features: {
    ...defaultConfig.features,
    donations: true,
    jumaahRegistration: false,
  },
  locale: 'en',
  timezone: 'America/New_York',
  prayerCalculationMethod: 'ISNA',
  clerkOrgId: 'org_3CfxuY1bSbDRGv2y8LIcZRA6w7Q',
};

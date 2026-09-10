import { defaultConfig } from '../default';
import type { MasjidConfig } from '../types';

/**
 * The tenant that ships as the public "Sahla App" build, and the one used for
 * local development. Colors deliberately differ from `defaultConfig` so it's
 * obvious at a glance which config is active during testing.
 *
 * `displayName` here is only the pre-fetch fallback — once `ConfigProvider`
 * resolves, the header shows `mosques.app_name` from the database instead.
 */
export const sahlaConfig: MasjidConfig = {
  ...defaultConfig,
  id: 'sahla',
  displayName: 'Sahla App',
  tagline: 'Prayer times, programs and Quran for your masjid',
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

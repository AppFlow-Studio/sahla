import { defaultConfig } from '../default';
import type { MasjidConfig } from '../types';

export const masSiConfig: MasjidConfig = {
  ...defaultConfig,
  id: 'mas-si',
  displayName: 'MAS S.I',
  tagline: 'Muslim American Society — Staten Island',
  locale: 'en',
  timezone: 'America/New_York',
  prayerCalculationMethod: 'ISNA',
};

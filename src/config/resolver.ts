import Constants from 'expo-constants';

import { darkenTriplet } from '@/src/lib/color';

import { defaultConfig } from './default';
import { masjidRegistry } from './masjids';
import type { MasjidConfig, RemoteMasjidOverrides } from './types';

/**
 * Pulls the bundled config for the current build. `masjidId` lives under
 * `extra` in `app.config.ts`, which reads the build-time `MASJID_ID` env var.
 */
export function resolveBundledConfig(): MasjidConfig {
  const id =
    (Constants.expoConfig?.extra?.masjidId as string | undefined) ??
    defaultConfig.id;
  return masjidRegistry[id] ?? defaultConfig;
}

/**
 * Deep-merges a remote override row onto a bundled config. Only known fields
 * are copied; extra keys from Supabase are ignored so a rogue column rename
 * can't blow up the app.
 */
export function mergeConfig(
  base: MasjidConfig,
  overrides: RemoteMasjidOverrides | null | undefined,
): MasjidConfig {
  if (!overrides) return base;

  const mergedColors = { ...base.colors, ...(overrides.colors ?? {}) };

  // When a remote primary is provided without an explicit depth override,
  // derive depth as a darker shade of primary so cards / inner layers in
  // screens like Prayer stay tonally aligned with the masjid's brand color
  // instead of falling back to Sahla's green depth (#071F18).
  if (overrides.colors?.primary && overrides.colors?.depth === undefined) {
    mergedColors.depth = darkenTriplet(mergedColors.primary, 0.7);
  }

  return {
    ...base,
    displayName: overrides.displayName ?? base.displayName,
    tagline: overrides.tagline ?? base.tagline,
    logoUrl: overrides.logoUrl ?? base.logoUrl,
    locale: overrides.locale ?? base.locale,
    timezone: overrides.timezone ?? base.timezone,
    prayerCalculationMethod:
      overrides.prayerCalculationMethod ?? base.prayerCalculationMethod,
    clerkOrgId: overrides.clerkOrgId ?? base.clerkOrgId,
    fontTheme: overrides.fontTheme ?? base.fontTheme,
    colors: mergedColors,
    features: { ...base.features, ...(overrides.features ?? {}) },
  };
}

import { useAuth } from '@clerk/clerk-expo';
import { useEffect } from 'react';

import type { RemoteMasjidOverrides } from '@/src/config/types';
import { useSupabase } from '@/src/hooks/use-supabase';
import { hexToRgbTriplet } from '@/src/lib/color';
import { useConfigStore } from '@/src/stores/config-store';

/**
 * Mounts inside the Clerk + Supabase tree. Responsibility is narrow:
 *   - Wait until the user is authenticated (so RLS lets us read the row)
 *   - Fetch the `mosques` row for the current build's slug
 *   - Map the flat DB columns into our structured overrides shape
 *   - Hand the result to the Zustand store, which persists to MMKV
 *
 * The store's `hydrate()` already seeded state from MMKV-or-bundled at module
 * import time, so the UI is already branded before this component runs. This
 * provider's only job is to keep the cache fresh.
 *
 * The DB schema stores colors as flat hex strings (`brand_color`,
 * `accent_color`, `secondary_color`) while our runtime theme expects the
 * `"R G B"` triplet form that NativeWind's `vars()` consumes — we convert
 * here at the boundary.
 */
export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const supabase = useSupabase();
  const config = useConfigStore((s) => s.config);
  const applyRemoteOverrides = useConfigStore((s) => s.applyRemoteOverrides);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;

    (async () => {
      // `MASJID_ID` in app.config.ts is human-readable (e.g. "sahla"),
      // which matches `mosques.slug`, not `mosques.id`.
      const { data, error } = await supabase
        .from('mosques')
        .select(
          'name, app_name, logo_url, brand_color, accent_color, secondary_color, timezone, calculation_method',
        )
        .eq('slug', config.id)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        // Non-fatal: we stay on the cached/bundled config.
        console.warn('[ConfigProvider] failed to fetch mosque config', error);
        return;
      }
      if (!data) return;

      const primary = hexToRgbTriplet(data.brand_color);
      const accent = hexToRgbTriplet(data.accent_color);
      // `secondary_color` on the DB is currently unused by the theme tokens
      // but we keep the plumbing in place for a future design-system field.

      const overrides: RemoteMasjidOverrides = {
        displayName: data.app_name ?? data.name ?? undefined,
        logoUrl: data.logo_url ?? undefined,
        timezone: data.timezone ?? undefined,
        // `calculation_method` is an integer in the DB (matching Adhan-lib
        // method constants). We stringify it for the config surface; the
        // prayer-times feature will parse it back into a method enum.
        prayerCalculationMethod:
          data.calculation_method != null ? String(data.calculation_method) : undefined,
        colors: {
          ...(primary ? { primary } : {}),
          ...(accent ? { accent } : {}),
        },
      };
      applyRemoteOverrides(overrides);
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, supabase, config.id, applyRemoteOverrides]);

  return <>{children}</>;
}

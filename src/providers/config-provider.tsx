import { useEffect } from 'react';

import type { RemoteMasjidOverrides } from '@/src/config/types';
import { useSupabase } from '@/src/hooks/use-supabase';
import { hexToRgbTriplet } from '@/src/lib/color';
import { useConfigStore } from '@/src/stores/config-store';

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const supabase = useSupabase();
  const config = useConfigStore((s) => s.config);
  const applyRemoteOverrides = useConfigStore((s) => s.applyRemoteOverrides);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // `MASJID_ID` in app.config.ts is human-readable (e.g. "sahla"),
      // which matches `mosques.slug`, not `mosques.id`.
      const { data, error } = await supabase
        .from('mosques')
        .select(
          'id, name, app_name, logo_url, brand_color, accent_color, secondary_color, timezone, calculation_method, clerk_org_id, font_theme',
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

      // Store the resolved mosque UUID for data writes.
      useConfigStore.getState().setMosqueUuid(data.id);

      const primary = hexToRgbTriplet(data.brand_color);
      const accent = hexToRgbTriplet(data.accent_color);

      const overrides: RemoteMasjidOverrides = {
        displayName: data.app_name ?? data.name ?? undefined,
        logoUrl: data.logo_url ?? undefined,
        timezone: data.timezone ?? undefined,
        prayerCalculationMethod:
          data.calculation_method != null ? String(data.calculation_method) : undefined,
        clerkOrgId: data.clerk_org_id ?? undefined,
        fontTheme: data.font_theme ?? undefined,
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
  }, [supabase, config.id, applyRemoteOverrides]);

  return <>{children}</>;
}

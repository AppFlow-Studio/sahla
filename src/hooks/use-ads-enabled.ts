import { useQuery } from '@tanstack/react-query';

import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';

/**
 * Whether this masjid is currently accepting business-ad applications.
 * Defaults to false until the fetch resolves, so a CTA gated on this never
 * flashes in and then disappears for a masjid that has ads turned off.
 */
export function useAdsEnabled(): boolean {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);

  const { data } = useQuery({
    queryKey: ['ads-enabled', mosqueUuid],
    enabled: !!mosqueUuid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mosques')
        .select('ads_enabled')
        .eq('id', mosqueUuid!)
        .single();
      if (error) throw new Error(error.message);
      return data?.ads_enabled ?? false;
    },
  });

  return data ?? false;
}

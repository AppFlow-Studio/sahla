import { useQuery } from '@tanstack/react-query';

import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';
import { env } from '@/src/lib/env';

export type CommunityPartner = {
  id: string;
  name: string | null;
  address: string | null;
  flyerImg: string | null;
  phone: string | null;
  email: string | null;
};

/** Approved business ads for the current mosque (shown as Community Partners). */
export function useCommunityPartners() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);

  return useQuery({
    queryKey: ['community-partners', mosqueUuid],
    enabled: !!mosqueUuid,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-community-partners', {
        headers: { Authorization: `Bearer ${env.SUPABASE_ANON_KEY}` },
        body: { mosque_id: mosqueUuid },
      });
      if (error) throw new Error(error.message);
      return (data?.partners ?? []) as CommunityPartner[];
    },
  });
}

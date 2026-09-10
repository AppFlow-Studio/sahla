import { useQuery } from '@tanstack/react-query';

import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';

export type AudienceFilter = 'All' | 'Kids' | 'Youth' | 'Adults';

export type ProgramCategoryRow = {
  id: string;
  mosque_id: string;
  title: string;
  image_url: string | null;
  bg_color: string | null;
  audience_filter: AudienceFilter;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
};

const keyFor = (mosqueUuid: string | null) => ['program-categories', mosqueUuid];

/**
 * Read-only view of a mosque's Discover "Programs" cover cards. Authoring lives
 * in the masjid CRM (sahla-web → Mosque Setup → Program Cards); the app only
 * renders these rows, falling back to bundled defaults when a mosque has none.
 */
export function useProgramCategories() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);

  const query = useQuery({
    queryKey: keyFor(mosqueUuid),
    queryFn: async (): Promise<ProgramCategoryRow[]> => {
      const { data, error } = await supabase
        .from('program_categories')
        .select('*')
        .eq('mosque_id', mosqueUuid!)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw new Error(error.message);
      return (data as ProgramCategoryRow[]) ?? [];
    },
    enabled: !!mosqueUuid,
  });

  return {
    categories: query.data ?? [],
    isLoading: query.isPending,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

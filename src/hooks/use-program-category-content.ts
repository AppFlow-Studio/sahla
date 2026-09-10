import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';

type AssignmentRow = { category_id: string; content_id: string };

/**
 * Read-only map of which program cards (program_categories) each program
 * content_item belongs to. Drives category filtering in the Discover Programs
 * tab. Authoring lives in the masjid CRM. Returns `byContent`: content_id →
 * Set of category ids.
 */
export function useProgramCategoryContent() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);

  const query = useQuery({
    queryKey: ['program-category-content', mosqueUuid],
    queryFn: async (): Promise<AssignmentRow[]> => {
      const { data, error } = await supabase
        .from('program_category_content')
        .select('category_id, content_id')
        .eq('mosque_id', mosqueUuid!);
      if (error) throw new Error(error.message);
      return (data as AssignmentRow[]) ?? [];
    },
    enabled: !!mosqueUuid,
  });

  const byContent = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const row of query.data ?? []) {
      const set = map.get(row.content_id) ?? new Set<string>();
      set.add(row.category_id);
      map.set(row.content_id, set);
    }
    return map;
  }, [query.data]);

  return { byContent, isLoading: query.isPending };
}

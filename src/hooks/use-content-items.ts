import { useQuery } from '@tanstack/react-query';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';

export type ContentItem = {
  content_id: string;
  name: string | null;
  description: string | null;
  image: string | null;
  type: string | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  days: string[] | null;
};

const SELECT =
  'content_id, name, description, image, type, start_date, end_date, start_time, days' as const;

export function useContentItems() {
  const supabase = useSupabase();
  const config = useMasjidConfig();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);

  const query = useQuery({
    queryKey: ['content-items', mosqueUuid],
    queryFn: async (): Promise<ContentItem[]> => {
      const { data, error } = await supabase
        .from('content_items')
        .select(SELECT)
        .eq('mosque_id', mosqueUuid!)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []) as ContentItem[];
    },
    enabled: !!mosqueUuid,
  });

  return {
    items: query.data ?? [],
    status: !mosqueUuid
      ? ('idle' as const)
      : query.isPending
        ? ('loading' as const)
        : query.isError
          ? ('error' as const)
          : ('success' as const),
    error: query.error?.message ?? null,
  };
}

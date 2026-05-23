import { useQuery } from '@tanstack/react-query';

import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';

export type FeaturedItem = {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
};

function formatSubtitle(item: {
  days: string[] | null;
  start_time: string | null;
}): string {
  const parts: string[] = [];
  if (item.days && item.days.length > 0) {
    parts.push(item.days.join(' & '));
  }
  if (item.start_time) {
    const [h, m] = item.start_time.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    parts.push(`${h12}:${String(m).padStart(2, '0')} ${suffix}`);
  }
  return parts.length > 0 ? parts.join(' \u00B7 ') : '';
}

export function useFeaturedContent() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);

  const query = useQuery({
    queryKey: ['featured', mosqueUuid],
    queryFn: async (): Promise<FeaturedItem | null> => {
      const { data, error } = await supabase
        .from('content_items')
        .select('content_id, name, type, days, start_time')
        .eq('mosque_id', mosqueUuid!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) return null;

      return {
        id: data.content_id,
        badge: data.type === 'program' ? 'Program' : data.type === 'event' ? 'Event' : 'Featured',
        title: data.name ?? 'Untitled',
        subtitle: formatSubtitle(data),
      };
    },
    enabled: !!mosqueUuid,
  });

  return {
    featured: query.data ?? null,
    status: !mosqueUuid
      ? ('idle' as const)
      : query.isPending
        ? ('loading' as const)
        : query.isError
          ? ('error' as const)
          : ('success' as const),
  };
}

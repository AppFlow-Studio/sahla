import { useQuery } from '@tanstack/react-query';

import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';

export type FeaturedItem = {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  image: string | null;
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
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

      // Pull a small recent batch and pick the newest one that hasn't passed,
      // rather than always surfacing the most-recently-created row.
      const { data, error } = await supabase
        .from('content_items')
        .select('content_id, name, type, days, start_time, image, start_date, end_date')
        .eq('mosque_id', mosqueUuid!)
        .order('created_at', { ascending: false })
        .limit(25);

      if (error) throw new Error(error.message);
      if (!data || data.length === 0) return null;

      // Keep ongoing/recurring programs and upcoming/active events; drop items
      // whose date has already fully passed. ISO date strings compare lexically.
      const isCurrent = (item: {
        type: string | null;
        start_date: string | null;
        end_date: string | null;
      }) => {
        if (item.end_date) return item.end_date >= today;
        if (item.type === 'program') return true; // recurring / no fixed end
        if (item.start_date) return item.start_date >= today;
        return true;
      };

      const item = data.find(isCurrent);
      if (!item) return null;

      return {
        id: item.content_id,
        badge: 'Featured',
        title: item.name ?? 'Untitled',
        subtitle: formatSubtitle(item),
        image: item.image ?? null,
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

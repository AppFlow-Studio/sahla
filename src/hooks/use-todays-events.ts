import { useQuery } from '@tanstack/react-query';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';

export type TodaysEvent = {
  id: string;
  time: string;
  title: string;
  category: string;
};

function formatTime12h(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function useTodaysEvents() {
  const supabase = useSupabase();
  const config = useMasjidConfig();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const timezone = config.timezone || 'America/New_York';

  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA', { timeZone: timezone });
  const todayDayName = now.toLocaleDateString('en-US', {
    timeZone: timezone,
    weekday: 'long',
  });
  const todayFormatted = now.toLocaleDateString('en-US', {
    timeZone: timezone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase();

  const query = useQuery({
    queryKey: ['todays-events', mosqueUuid, todayStr],
    queryFn: async (): Promise<TodaysEvent[]> => {
      // Fetch events where today falls in range OR today's day name is in days[]
      const { data, error } = await supabase
        .from('content_items')
        .select('content_id, name, type, start_time, days, start_date, end_date')
        .eq('mosque_id', mosqueUuid!)
        .order('start_time', { ascending: true });

      if (error) throw new Error(error.message);
      if (!data) return [];

      return data
        .filter((item) => {
          const startDate = item.start_date?.split('T')[0] ?? null;
          const endDate = item.end_date?.split('T')[0] ?? null;
          const days: string[] | null = item.days;

          // Recurring: today's day name is in the days array
          if (days && days.includes(todayDayName)) {
            if (startDate && startDate > todayStr) return false;
            if (endDate && endDate < todayStr) return false;
            return true;
          }

          // Date-range: today falls within start_date..end_date
          if (startDate) {
            if (startDate > todayStr) return false;
            if (endDate && endDate < todayStr) return false;
            if (!endDate && startDate === todayStr) return true;
            if (endDate) return true;
          }

          return false;
        })
        .map((item) => ({
          id: item.content_id,
          time: item.start_time ? formatTime12h(item.start_time) : '',
          title: item.name ?? 'Untitled',
          category: item.type ?? '',
        }));
    },
    enabled: !!mosqueUuid,
  });

  if (!mosqueUuid) {
    return { events: [], date: todayFormatted, status: 'idle' as const };
  }

  return {
    events: query.data ?? [],
    date: todayFormatted,
    status: query.isPending
      ? ('loading' as const)
      : query.isError
        ? ('error' as const)
        : ('success' as const),
  };
}

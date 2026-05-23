import { useQuery } from '@tanstack/react-query';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';

export type ProgramItem = {
  id: string;
  title: string;
  date: string;
  category: string;
  icon: string;
};

const TYPE_ICONS: Record<string, string> = {
  program: 'book-open-page-variant',
  class: 'school',
  event: 'calendar',
};

function formatProgramDate(
  startDate: string | null,
  startTime: string | null,
  timezone: string
): string {
  const parts: string[] = [];
  if (startDate) {
    const d = new Date(startDate);
    parts.push(
      d.toLocaleDateString('en-US', {
        timeZone: timezone,
        month: 'long',
        day: 'numeric',
      })
    );
  }
  if (startTime) {
    const [h, m] = startTime.split(':').map(Number);
    const suffix = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 || 12;
    parts.push(`${h12}${m > 0 ? `:${String(m).padStart(2, '0')}` : ''}${suffix}`);
  }
  return parts.join(' \u2022 ');
}

function deriveCategory(item: {
  is_kids: boolean | null;
  is_fourteen_plus: boolean | null;
  type: string | null;
}): string {
  if (item.is_kids) return 'Kids';
  if (item.is_fourteen_plus) return 'Youth';
  return item.type ?? 'Program';
}

export function usePrograms() {
  const supabase = useSupabase();
  const config = useMasjidConfig();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const timezone = config.timezone || 'America/New_York';

  const query = useQuery({
    queryKey: ['programs', mosqueUuid],
    queryFn: async (): Promise<ProgramItem[]> => {
      const { data, error } = await supabase
        .from('content_items')
        .select(
          'content_id, name, type, start_date, start_time, end_date, is_kids, is_fourteen_plus'
        )
        .eq('mosque_id', mosqueUuid!)
        .in('type', ['program', 'class'])
        .order('start_date', { ascending: true })
        .limit(5);

      if (error) throw new Error(error.message);
      if (!data) return [];

      // Filter out expired programs client-side
      const now = new Date().toISOString().split('T')[0];
      return data
        .filter((item) => {
          const end = item.end_date?.split('T')[0] ?? null;
          return !end || end >= now;
        })
        .map((item) => ({
          id: item.content_id,
          title: item.name ?? 'Untitled',
          date: formatProgramDate(item.start_date, item.start_time, timezone),
          category: deriveCategory(item),
          icon: TYPE_ICONS[item.type ?? 'program'] ?? 'book-open-page-variant',
        }));
    },
    enabled: !!mosqueUuid,
  });

  return {
    programs: query.data ?? [],
    status: !mosqueUuid
      ? ('idle' as const)
      : query.isPending
        ? ('loading' as const)
        : query.isError
          ? ('error' as const)
          : ('success' as const),
  };
}

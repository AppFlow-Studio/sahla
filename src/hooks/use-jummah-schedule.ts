import { useQuery } from '@tanstack/react-query';

import { useSupabase } from '@/src/hooks/use-supabase';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useConfigStore } from '@/src/stores/config-store';

export type JummahSlot = {
  id: string;
  title: string;
  speaker: string;
  qualifications: string;
  time: string;
  icon: string;
  description: string;
  avatar: string;
  isCurrent?: boolean;
};

const SLOT_ICONS = [
  'weather-sunny',
  'weather-sunset-up',
  'weather-sunset-down',
  'moon-waning-crescent',
];

function formatTime12h(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function useJummahSchedule() {
  const supabase = useSupabase();
  const config = useMasjidConfig();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const timezone = config.timezone || 'America/New_York';

  // Compute next Friday's date for display
  const now = new Date();
  const dayOfWeek = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'narrow' })
      .formatToParts(now)
      .find((p) => p.type === 'weekday')?.value === 'F'
  );
  const nextFriday = new Date(now);
  const currentDay = now.getDay();
  const daysUntilFriday = (5 - currentDay + 7) % 7 || 7;
  if (currentDay !== 5) nextFriday.setDate(now.getDate() + daysUntilFriday);
  const jummahDate = nextFriday.toLocaleDateString('en-US', {
    timeZone: timezone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const query = useQuery({
    queryKey: ['jummah', mosqueUuid],
    queryFn: async (): Promise<JummahSlot[]> => {
      const { data, error } = await supabase
        .from('jummah')
        .select(
          `id, topic, prayer_time, capacity_status,
           speaker_data!jummah_speaker_fkey (speaker_name, speaker_img, speaker_creds)`
        )
        .eq('mosque_id', mosqueUuid!)
        .order('prayer_time', { ascending: true });

      if (error) throw new Error(error.message);
      if (!data) return [];

      return data.map((row, index) => {
        const speaker = row.speaker_data as unknown as {
          speaker_name: string | null;
          speaker_img: string | null;
          speaker_creds: string[] | null;
        } | null;

        return {
          id: String(row.id),
          title: `Jummah ${index + 1}`,
          speaker: speaker?.speaker_name ?? 'TBA',
          qualifications: speaker?.speaker_creds?.join(' \u00B7 ') ?? '',
          time: row.prayer_time ? formatTime12h(row.prayer_time) : '',
          icon: SLOT_ICONS[index % SLOT_ICONS.length],
          description: row.topic ?? '',
          avatar: speaker?.speaker_img ?? '',
          isCurrent: index === 0, // Default first slot as current
        };
      });
    },
    enabled: !!mosqueUuid,
  });

  return {
    slots: query.data ?? [],
    date: jummahDate,
    status: !mosqueUuid
      ? ('idle' as const)
      : query.isPending
        ? ('loading' as const)
        : query.isError
          ? ('error' as const)
          : ('success' as const),
  };
}

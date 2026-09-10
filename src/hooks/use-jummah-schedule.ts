import { useQuery } from '@tanstack/react-query';

import { useSupabase } from '@/src/hooks/use-supabase';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { usePrayerTimes } from '@/src/hooks/use-prayer-times';
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

/** A mosque can configure at most this many regular (non-school) jummahs. */
export const MAX_REGULAR_JUMMAHS = 3;

/** DEBUG: when true, the home Jummah window is always open (simulate juma time). */
const DEBUG_FORCE_JUMMAH_WINDOW = false;

/**
 * Parse a free-text jummah time like "12:15 PM" into minutes-since-midnight so
 * slots sort correctly (a plain string sort mis-orders AM vs PM). Unparseable
 * times sort last.
 */
export function jummahTimeToMinutes(time: string | null | undefined): number {
  if (!time) return Number.MAX_SAFE_INTEGER;
  const m = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return Number.MAX_SAFE_INTEGER;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const ampm = m[3]?.toUpperCase();
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

/** Title for a slot: "School Jummah", or "1st/2nd/3rd Jummah" by order. */
export function jummahTitle(isSchool: boolean, regularIndex: number): string {
  if (isSchool) return 'School Jummah';
  const ordinals = ['1st', '2nd', '3rd', '4th'];
  return `${ordinals[regularIndex] ?? `${regularIndex + 1}th`} Jummah`;
}

function timeRawToSeconds(t: string | null | undefined): number {
  if (typeof t !== 'string') return 0;
  const [h = '0', m = '0', s = '0'] = t.split(':');
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

function nowSecondsInTz(timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? '0') % 24;
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  const s = Number(parts.find((p) => p.type === 'second')?.value ?? '0');
  return h * 3600 + m * 60 + s;
}

function weekdayInTz(timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(new Date());
}

/**
 * Whether the home-page Jummah card should be showing right now: from
 * Thursday's Maghrib athan through Friday's Asr athan. Uses today's prayer
 * `items` (on Thursday we only need Maghrib; on Friday only Asr), and re-renders
 * each second via usePrayerTimes so it flips at the boundary automatically.
 */
export function useJummahWindow(): boolean {
  const config = useMasjidConfig();
  const timezone = config.timezone || 'America/New_York';
  const { items } = usePrayerTimes();

  const weekday = weekdayInTz(timezone);
  const nowSec = nowSecondsInTz(timezone);

  // DEBUG: force-open to simulate juma time for testing. REMOVE before commit.
  // Placed after all hooks so Fast Refresh applies without a relaunch.
  if (DEBUG_FORCE_JUMMAH_WINDOW) return true;

  if (weekday === 'Thu') {
    const maghrib = items.find((p) => p.rawName.toLowerCase() === 'maghrib');
    if (!maghrib) return false;
    return nowSec >= timeRawToSeconds(maghrib.athanTimeRaw);
  }
  if (weekday === 'Fri') {
    const asr = items.find((p) => p.rawName.toLowerCase() === 'asr');
    if (!asr) return true; // no Asr data → keep the card up through Friday
    return nowSec < timeRawToSeconds(asr.athanTimeRaw);
  }
  return false;
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
          `id, topic, prayer_time, capacity_status, is_school,
           speaker_data!jummah_speaker_fkey (speaker_name, speaker_img, speaker_creds)`
        )
        .eq('mosque_id', mosqueUuid!);

      if (error) throw new Error(error.message);
      if (!data) return [];

      const ordered = [...data].sort(
        (a, b) => jummahTimeToMinutes(a.prayer_time) - jummahTimeToMinutes(b.prayer_time),
      );

      let regularCount = 0;
      return ordered.map((row, index) => {
        const speaker = row.speaker_data as unknown as {
          speaker_name: string | null;
          speaker_img: string | null;
          speaker_creds: string[] | null;
        } | null;

        const isSchool = (row as { is_school?: boolean }).is_school ?? false;
        const title = jummahTitle(isSchool, isSchool ? 0 : regularCount++);

        return {
          id: String(row.id),
          title,
          speaker: speaker?.speaker_name ?? 'TBA',
          qualifications: speaker?.speaker_creds?.join(' \u00B7 ') ?? '',
          time: row.prayer_time ?? '',
          icon: SLOT_ICONS[index % SLOT_ICONS.length],
          description: row.topic ?? '',
          avatar: speaker?.speaker_img ?? '',
          isCurrent: index === 0, // first slot of the day highlighted
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

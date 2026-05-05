import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';

export type PrayerStatus = 'passed' | 'next' | 'upcoming';

export type PrayerEntry = {
  /** Title-case display name, e.g. 'Fajr'. */
  name: string;
  /** Raw lowercase DB name, e.g. 'fajr'. */
  rawName: string;
  /** 12-hour formatted athan time, e.g. '5:19 AM'. */
  athan: string;
  /** 12-hour formatted iqamah time, e.g. '5:44 AM'. */
  iqamah: string;
  /** Raw HH:MM:SS time-of-day from the DB. */
  athanTimeRaw: string;
  iqamahTimeRaw: string;
  status: PrayerStatus;
};

type TodaysPrayerRow = {
  prayer_name: string;
  athan_time: string;
  iqamah_time: string;
};

const PRAYER_ORDER: Record<string, number> = {
  fajr: 0,
  sunrise: 1,
  dhuhr: 2,
  asr: 3,
  maghrib: 4,
  isha: 5,
};

function titleCase(name: string): string {
  if (!name) return name;
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

function timeToSeconds(hhmmss: string | null | undefined): number {
  if (!hhmmss) return 0;
  const [hh = '0', mm = '0', ss = '0'] = hhmmss.split(':');
  return Number(hh) * 3600 + Number(mm) * 60 + Number(ss);
}

function formatTo12Hour(hhmmss: string | null | undefined): string {
  if (!hhmmss) return '--:--';
  const [hh = '0', mm = '0'] = hhmmss.split(':');
  const h = Number(hh);
  const m = Number(mm);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return 'now';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return '<1m';
}

function formatCountdownClock(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getNowInTimezone(timeZone: string): {
  hour: number;
  minute: number;
  second: number;
  totalSeconds: number;
  hours: number;
} {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date());

  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0') % 24;
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  const second = Number(parts.find((p) => p.type === 'second')?.value ?? '0');

  const totalSeconds = hour * 3600 + minute * 60 + second;
  const hours = hour + minute / 60 + second / 3600;

  return { hour, minute, second, totalSeconds, hours };
}

function formatCurrentTimeInTz(timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date());
}

function getTodayDateStringInTz(timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

const PRAYER_ICONS: Record<string, string> = {
  fajr: 'weather-sunset-up',
  sunrise: 'white-balance-sunny',
  dhuhr: 'white-balance-sunny',
  asr: 'weather-sunny',
  maghrib: 'weather-sunset-down',
  isha: 'moon-waning-crescent',
};

export type SimplePrayer = {
  name: string;
  time: string;
  icon: string;
  isActive: boolean;
};

export type UsePrayerTimesResult = {
  items: PrayerEntry[];
  /** Simplified prayer list for UI components like PrayerTimesBar. */
  prayers: SimplePrayer[];
  nextPrayer: PrayerEntry | null;
  /** Live-formatted clock time in mosque tz, e.g. '4:01 PM'. */
  currentTimeFormatted: string;
  /** 'in 1h 53m' style countdown to next iqamah, or null when no next prayer. */
  countdownLabel: string | null;
  /** 'HH:MM' clock-style countdown to next iqamah, or null when no next prayer. */
  countdownClock: string | null;
  /** Decimal hours-of-day in mosque tz, used by the prayer screen ring. */
  nowHours: number;
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
};

/**
 * Reads today's prayer schedule from `todays_prayers` for the active mosque.
 *
 * The query key includes `todayDateStringInMosqueTz` so the hook auto-refetches
 * when the day rolls over. A 1-second internal tick keeps the next-prayer
 * status, countdown label, and clock display fresh without needing to refetch.
 */
export function usePrayerTimes(): UsePrayerTimesResult {
  const supabase = useSupabase();
  const config = useMasjidConfig();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const timezone = config.timezone || 'UTC';
  const todayDateStr = getTodayDateStringInTz(timezone);

  const query = useQuery({
    queryKey: ['prayer-times', mosqueUuid, todayDateStr],
    queryFn: async (): Promise<TodaysPrayerRow[]> => {
      const { data, error } = await supabase
        .from('todays_prayers')
        .select('prayer_name, athan_time, iqamah_time')
        .eq('mosque_id', mosqueUuid!)
        .eq('date', todayDateStr);
      if (error) throw new Error(error.message);
      return (data as TodaysPrayerRow[]) ?? [];
    },
    enabled: !!mosqueUuid,
  });

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const computed = useMemo(() => {
    const rows = (query.data ?? []).slice().sort((a, b) => {
      // Defensive secondary sort: canonical prayer order if athan_time tie.
      const cmp = a.athan_time.localeCompare(b.athan_time);
      if (cmp !== 0) return cmp;
      return (PRAYER_ORDER[a.prayer_name] ?? 99) - (PRAYER_ORDER[b.prayer_name] ?? 99);
    });

    const now = getNowInTimezone(timezone);

    const items: PrayerEntry[] = rows.map((r) => {
      const athanSec = timeToSeconds(r.athan_time);
      const status: PrayerStatus = athanSec <= now.totalSeconds ? 'passed' : 'upcoming';
      return {
        name: titleCase(r.prayer_name),
        rawName: r.prayer_name,
        athan: formatTo12Hour(r.athan_time),
        iqamah: formatTo12Hour(r.iqamah_time),
        athanTimeRaw: r.athan_time,
        iqamahTimeRaw: r.iqamah_time,
        status,
      };
    });

    // The first non-passed entry becomes "next".
    const nextIdx = items.findIndex((p) => p.status !== 'passed');
    if (nextIdx >= 0) items[nextIdx] = { ...items[nextIdx], status: 'next' };

    const nextPrayer = nextIdx >= 0 ? items[nextIdx] : null;
    const secondsToIqamah = nextPrayer
      ? timeToSeconds(nextPrayer.iqamahTimeRaw) - now.totalSeconds
      : null;
    const countdownLabel =
      secondsToIqamah !== null ? formatCountdown(secondsToIqamah) : null;
    const countdownClock =
      secondsToIqamah !== null ? formatCountdownClock(secondsToIqamah) : null;

    const prayers: SimplePrayer[] = items.map((p) => ({
      name: p.name,
      time: p.athan,
      icon: PRAYER_ICONS[p.rawName] ?? 'weather-sunny',
      isActive: p.status === 'next',
    }));

    return {
      items,
      prayers,
      nextPrayer,
      currentTimeFormatted: formatCurrentTimeInTz(timezone),
      countdownLabel,
      countdownClock,
      nowHours: now.hours,
    };
    // `tick` re-runs the memo every second so countdown / status / clock stay live.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data, timezone, tick]);

  const status: UsePrayerTimesResult['status'] = !mosqueUuid
    ? 'idle'
    : query.isPending
      ? 'loading'
      : query.isError
        ? 'error'
        : 'success';

  return {
    ...computed,
    status,
    error: query.error?.message ?? null,
  };
}

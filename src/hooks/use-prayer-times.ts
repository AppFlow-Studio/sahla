import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';

const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
type PrayerName = (typeof PRAYER_NAMES)[number];

const PRAYER_ICONS: Record<PrayerName, string> = {
  Fajr: 'weather-sunset-up',
  Dhuhr: 'white-balance-sunny',
  Asr: 'weather-sunny',
  Maghrib: 'weather-sunset-down',
  Isha: 'moon-waning-crescent',
};

export type PrayerTime = {
  name: string;
  time: string;
  icon: string;
  isActive: boolean;
};

export type NextPrayer = {
  name: string;
  timeRemaining: string;
  type: 'athan' | 'iqamah';
};

type AlAdhanResponse = {
  data: {
    timings: Record<string, string>;
    date: {
      hijri: {
        day: string;
        month: { en: string; number: number };
        year: string;
      };
    };
  };
};

function formatTime12h(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function parseTime(time24: string, timezone: string): Date {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-CA', { timeZone: timezone });
  const [h, m] = time24.split(':').map(Number);
  return new Date(`${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return '0m';
  const totalMin = Math.floor(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function getCurrentTimeFormatted(timezone: string): string {
  return new Date().toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getTodayDateStr(timezone: string): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
}

/** Compute prayers array + next prayer from a list of {name, time24} */
function buildPrayerState(
  times: { name: PrayerName; time24: string }[],
  timezone: string
) {
  const now = new Date();
  let foundNext = false;
  let nextPrayer: NextPrayer | null = null;

  const prayers: PrayerTime[] = times.map(({ name, time24 }) => {
    const prayerDate = parseTime(time24, timezone);
    const isNext = !foundNext && prayerDate > now;
    if (isNext) {
      foundNext = true;
      nextPrayer = {
        name,
        timeRemaining: formatRemaining(prayerDate.getTime() - now.getTime()),
        type: 'athan',
      };
    }
    return {
      name,
      time: formatTime12h(time24),
      icon: PRAYER_ICONS[name],
      isActive: isNext,
    };
  });

  if (!foundNext && prayers.length > 0) {
    nextPrayer = { name: 'Fajr', timeRemaining: 'tomorrow', type: 'athan' };
  }

  return { prayers, nextPrayer };
}

export function usePrayerTimes() {
  const config = useMasjidConfig();
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const timezone = config.timezone || 'America/New_York';
  const todayStr = getTodayDateStr(timezone);

  // 1. Try DB first (synced bi-weekly by edge function)
  const dbQuery = useQuery({
    queryKey: ['prayer-times-db', mosqueUuid, todayStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('todays_prayers')
        .select('prayer_name, athan_time, iqamah_time')
        .eq('mosque_id', mosqueUuid!)
        .eq('date', todayStr)
        .order('athan_time', { ascending: true });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: !!mosqueUuid,
    staleTime: 1000 * 60 * 30, // 30 min
  });

  const hasDbData = (dbQuery.data?.length ?? 0) > 0;

  // 2. Fall back to Al Adhan API if DB has no data for today
  const apiQuery = useQuery({
    queryKey: ['prayer-times-api', todayStr, config.id],
    queryFn: async (): Promise<AlAdhanResponse> => {
      let city = 'New York';
      let country = 'US';
      let method = 2;
      let school = 0;

      if (mosqueUuid) {
        const { data: mosque } = await supabase
          .from('mosques')
          .select('city, state, calculation_method, school')
          .eq('id', mosqueUuid)
          .single();
        if (mosque) {
          city = mosque.city || city;
          method = mosque.calculation_method ?? method;
          school = mosque.school ?? school;
        }
      }

      const [y, mo, d] = todayStr.split('-');
      const dateParam = `${d}-${mo}-${y}`;
      const url = `https://api.aladhan.com/v1/timingsByCity/${dateParam}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}&school=${school}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Al Adhan API error: ${res.status}`);
      return res.json();
    },
    enabled: !hasDbData && !dbQuery.isPending,
    staleTime: 1000 * 60 * 60,
  });

  // Tick every 30s so countdown updates
  const [_tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // Build output
  let prayers: PrayerTime[] = [];
  let nextPrayer: NextPrayer | null = null;
  let hijriDate = '';
  const currentTime = getCurrentTimeFormatted(timezone);

  if (hasDbData && dbQuery.data) {
    // Build from DB rows
    const times = PRAYER_NAMES.map((name) => {
      const row = dbQuery.data.find(
        (r) => r.prayer_name?.toLowerCase() === name.toLowerCase()
      );
      // athan_time comes as "HH:MM:SS" from DB
      const raw = row?.athan_time?.substring(0, 5) ?? '00:00';
      return { name, time24: raw };
    });
    const state = buildPrayerState(times, timezone);
    prayers = state.prayers;
    nextPrayer = state.nextPrayer;

    // Hijri date: compute client-side via Intl API
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        calendar: 'islamic-umalqura',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: timezone,
      }).formatToParts(new Date());
      const month = parts.find((p) => p.type === 'month')?.value ?? '';
      const day = parts.find((p) => p.type === 'day')?.value ?? '';
      const year = parts.find((p) => p.type === 'year')?.value ?? '';
      hijriDate = `${month} ${day}, ${year}`;
    } catch {
      // Intl islamic calendar not supported on this device
    }
  } else if (apiQuery.data) {
    // Build from API response
    const timings = apiQuery.data.data.timings;
    const hijri = apiQuery.data.data.date.hijri;
    hijriDate = `${hijri.month.en} ${hijri.day}, ${hijri.year}`;

    const times = PRAYER_NAMES.map((name) => {
      const raw = timings[name]?.replace(/\s*\(.*\)/, '') ?? '00:00';
      return { name, time24: raw };
    });
    const state = buildPrayerState(times, timezone);
    prayers = state.prayers;
    nextPrayer = state.nextPrayer;
  }

  const isLoading =
    (!!mosqueUuid && dbQuery.isPending) || (!hasDbData && apiQuery.isPending);
  const isError = dbQuery.isError && apiQuery.isError;

  return {
    prayers,
    nextPrayer,
    currentTime,
    hijriDate,
    status: isLoading
      ? ('loading' as const)
      : isError
        ? ('error' as const)
        : ('success' as const),
    error: apiQuery.error?.message ?? dbQuery.error?.message ?? null,
  };
}

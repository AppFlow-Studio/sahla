import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';
import { computeIqamahTime, useIqamahConfig, type IqamahRule } from '@/src/hooks/use-iqamah';

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
  /** Computed iqamah time-of-day, or null when no rule/value applies. */
  iqamahTimeRaw: string | null;
  status: PrayerStatus;
};

type TodaysPrayerRow = {
  prayer_name: string;
  athan_time: string;
  iqamah_time: string | null;
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
  if (typeof hhmmss !== 'string') return 0;
  const [hh = '0', mm = '0', ss = '0'] = hhmmss.split(':');
  return Number(hh) * 3600 + Number(mm) * 60 + Number(ss);
}

/**
 * Numerals are pinned to Latin digits (`-nu-latn`) in every locale. Arabic and
 * Urdu would otherwise render Arabic-Indic digits here while the countdown
 * clock — formatted by hand below — stays Latin, putting two numbering systems
 * side by side in the same header. Only the AM/PM marker localizes.
 */
function localeTag(locale: string): string {
  return `${locale.split('-')[0] || 'en'}-u-nu-latn`;
}

function formatTo12Hour(hhmmss: string | null | undefined, locale: string): string {
  if (typeof hhmmss !== 'string') return '';
  const [hh = '0', mm = '0'] = hhmmss.split(':');
  const h = Number(hh);
  const m = Number(mm);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return '';
  const period = h >= 12 ? 'PM' : 'AM';
  const fallback = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${period}`;
  try {
    return new Intl.DateTimeFormat(localeTag(locale), {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(2000, 0, 1, h, m));
  } catch {
    return fallback;
  }
}

type Translate = (key: string, opts?: Record<string, unknown>) => string;

function formatCountdown(totalSeconds: number, t: Translate): string {
  if (totalSeconds <= 0) return t('prayer.countdownNow', { defaultValue: 'now' });
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return t('prayer.countdownHm', { h, m, defaultValue: '{{h}}h {{m}}m' });
  if (m > 0) return t('prayer.countdownM', { m, defaultValue: '{{m}}m' });
  return t('prayer.countdownUnderMinute', { defaultValue: '<1m' });
}

function formatCountdownClock(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** 'H:MM:SS' second-resolution countdown, e.g. '1:52:45' (for the countdown header). */
function formatCountdownClockFull(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0:00:00';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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

function formatCurrentTimeInTz(timeZone: string, locale: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  try {
    return new Intl.DateTimeFormat(localeTag(locale), opts).format(new Date());
  } catch {
    return new Intl.DateTimeFormat('en-US', opts).format(new Date());
  }
}

function getTodayDateStringInTz(timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function getHijriDate(locale: string): string | null {
  const base = locale.split('-')[0] || 'en';
  const opts: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  const format = (tag: string) =>
    new Intl.DateTimeFormat(tag, opts).formatToParts(new Date());
  try {
    let parts: Intl.DateTimeFormatPart[];
    try {
      parts = format(`${base}-u-ca-islamic-umalqura-nu-latn`);
    } catch {
      parts = format('en-u-ca-islamic-umalqura');
    }
    const month = parts.find((p) => p.type === 'month')?.value ?? '';
    const day = parts.find((p) => p.type === 'day')?.value ?? '';
    const year = parts.find((p) => p.type === 'year')?.value ?? '';
    return `${month} ${day}, ${year}`;
  } catch {
    return null;
  }
}

const PRAYER_ICONS: Record<string, string> = {
  fajr: 'weather-sunset-up',
  sunrise: 'weather-sunny',
  dhuhr: 'white-balance-sunny',
  asr: 'weather-partly-cloudy',
  maghrib: 'weather-sunset-down',
  isha: 'weather-night',
};

export type SimplePrayer = {
  /** Title-case English name — display via `t('prayer.' + rawName)` instead. */
  name: string;
  /** Raw lowercase DB name, e.g. 'fajr'. Doubles as the `prayer.*` i18n key. */
  rawName: string;
  time: string;
  icon: string;
  isActive: boolean;
};

export type NextPrayerInfo = {
  /** Title-case English name — display via `t('prayer.' + rawName)` instead. */
  name: string;
  /** Raw lowercase DB name, e.g. 'fajr'. Doubles as the `prayer.*` i18n key. */
  rawName: string;
  type: string;
  timeRemaining: string;
};

export type UsePrayerTimesResult = {
  items: PrayerEntry[];
  /** Simplified prayer list for UI components like PrayerTimesBar. */
  prayers: SimplePrayer[];
  nextPrayer: NextPrayerInfo | null;
  /** Live-formatted clock time in mosque tz, e.g. '4:18 PM'. */
  currentTime: string;
  currentTimeFormatted: string;
  /** Hijri date string, e.g. "Dhu'l-Qi'dah 17, 1447". */
  hijriDate: string | null;
  /** 'in 1h 53m' style countdown to next iqamah, or null when no next prayer. */
  countdownLabel: string | null;
  /** 'HH:MM' clock-style countdown to next iqamah, or null when no next prayer. */
  countdownClock: string | null;
  /** 'H:MM:SS' second-resolution countdown (countdown header), or null. */
  countdownClockFull: string | null;
  /** Raw seconds until the next iqamah/Fajr, or null when no next prayer. */
  secondsToIqamah: number | null;
  /** Decimal hours-of-day in mosque tz, used by the prayer screen ring. */
  nowHours: number;
  status: 'idle' | 'loading' | 'success' | 'error';
  /** True when a background refetch is in-flight (e.g. switching dates). */
  isFetching: boolean;
  error: string | null;
  /** Manually trigger a refetch of prayer times from the server. */
  refetch: () => Promise<unknown>;
};

/**
 * Reads today's prayer schedule from `todays_prayers` for the active mosque.
 *
 * The query key includes `todayDateStringInMosqueTz` so the hook auto-refetches
 * when the day rolls over. A 1-second internal tick keeps the next-prayer
 * status, countdown label, and clock display fresh without needing to refetch.
 */
export function usePrayerTimes(dateOverride?: string): UsePrayerTimesResult {
  const supabase = useSupabase();
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'en';
  const config = useMasjidConfig();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const timezone = config.timezone || 'UTC';
  const todayDateStr = getTodayDateStringInTz(timezone);
  const dateStr = dateOverride ?? todayDateStr;
  const isToday = dateStr === todayDateStr;

  const query = useQuery({
    queryKey: ['prayer-times', mosqueUuid, dateStr],
    queryFn: async (): Promise<TodaysPrayerRow[]> => {
      // Demo-day workaround: F-RLS-01 added per-org RLS on todays_prayers, but
      // the Clerk → Supabase JWT bridge isn't returning a usable auth context
      // to the helpers, so direct reads come back empty. Route through the
      // service-role edge function until that's resolved (or until prayer
      // times move to the external API per the team roadmap).
      const { data, error } = await supabase.functions.invoke<{
        rows: TodaysPrayerRow[];
        error?: string;
      }>('get-todays-prayers', {
        body: { mosque_id: mosqueUuid, date: dateStr },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      // iqamah_time may be null when the mosque hasn't configured iqamah_config —
      // athan_time is still useful on its own, so only require those two.
      return (data?.rows ?? []).filter(
        (r) =>
          typeof r.prayer_name === 'string' &&
          typeof r.athan_time === 'string',
      );
    },
    enabled: !!mosqueUuid,
  });

  // Iqamah is derived from per-prayer rules (fixed time or athan+offset) rather
  // than stored per day, so sync-prayer-times can leave todays_prayers.iqamah_time
  // null and we compute it here from the day's athan.
  const { rules } = useIqamahConfig();
  const ruleMap = useMemo(() => {
    const m = new Map<string, IqamahRule>();
    for (const r of rules) m.set(r.prayer_name.toLowerCase(), r);
    return m;
  }, [rules]);

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

    const items: PrayerEntry[] = rows.map((r, i) => {
      // A prayer is only "passed" once the next prayer's athan has arrived,
      // since you can still pray it until then.
      const nextAthanSec = i < rows.length - 1
        ? timeToSeconds(rows[i + 1].athan_time)
        : null;
      const isPassed = isToday && nextAthanSec !== null && nextAthanSec <= now.totalSeconds;
      const status: PrayerStatus =
        isPassed ? 'passed' : 'upcoming';
      // Prefer the configured rule; fall back to any iqamah_time already stored.
      const iqamahRaw =
        computeIqamahTime(r.athan_time, ruleMap.get(r.prayer_name.toLowerCase())) ??
        r.iqamah_time;
      return {
        name: titleCase(r.prayer_name),
        rawName: r.prayer_name,
        athan: formatTo12Hour(r.athan_time, locale),
        iqamah: formatTo12Hour(iqamahRaw, locale),
        athanTimeRaw: r.athan_time,
        iqamahTimeRaw: iqamahRaw,
        status,
      };
    });

    // The first prayer whose athan hasn't arrived yet is the countdown target.
    const upcomingIdx = isToday
      ? items.findIndex((p) => timeToSeconds(p.athanTimeRaw) > now.totalSeconds)
      : -1;

    // Once Isha (the last prayer) has passed there's no upcoming athan today, so
    // the next prayer is tomorrow's Fajr — count down to it and highlight Fajr.
    const fajrIdx = items.findIndex((p) => p.rawName.toLowerCase() === 'fajr');
    const fallbackToFajr = isToday && upcomingIdx < 0 && fajrIdx >= 0;

    // Which row is "next": the upcoming prayer, tomorrow's Fajr once everything
    // has passed, otherwise the current (athan-passed) prayer window.
    const nextIdx = upcomingIdx >= 0
      ? upcomingIdx
      : fallbackToFajr
        ? fajrIdx
        : items.findIndex((p) => p.status !== 'passed');
    if (isToday && nextIdx >= 0) items[nextIdx] = { ...items[nextIdx], status: 'next' };

    // Countdown targets the upcoming prayer's iqamah, or tomorrow's Fajr.
    const countdownPrayer = isToday && upcomingIdx >= 0 ? items[upcomingIdx] : null;

    let secondsToIqamah: number | null = null;

    if (countdownPrayer) {
      const nextTimeRaw = countdownPrayer.iqamahTimeRaw || countdownPrayer.athanTimeRaw;
      secondsToIqamah = timeToSeconds(nextTimeRaw) - now.totalSeconds;
    } else if (fallbackToFajr) {
      const fajr = items[fajrIdx];
      const fajrTimeRaw = fajr.iqamahTimeRaw || fajr.athanTimeRaw;
      const DAY = 86400;
      secondsToIqamah = timeToSeconds(fajrTimeRaw) + DAY - now.totalSeconds;
    }

    const countdownLabel =
      secondsToIqamah !== null ? formatCountdown(secondsToIqamah, t) : null;
    const countdownClock =
      secondsToIqamah !== null ? formatCountdownClock(secondsToIqamah) : null;
    const countdownClockFull =
      secondsToIqamah !== null ? formatCountdownClockFull(secondsToIqamah) : null;

    const prayers: SimplePrayer[] = items.map((p) => ({
      name: p.name,
      rawName: p.rawName.toLowerCase(),
      time: p.athan,
      icon: PRAYER_ICONS[p.rawName.toLowerCase()] ?? 'weather-sunny',
      isActive: p.status === 'next',
    }));

    const currentTimeStr = formatCurrentTimeInTz(timezone, locale);
    const nextPrayerInfo: NextPrayerInfo | null = countdownPrayer
      ? {
          name: countdownPrayer.name,
          rawName: countdownPrayer.rawName.toLowerCase(),
          type: 'iqamah',
          timeRemaining: countdownLabel ?? '',
        }
      : fallbackToFajr
        ? {
            name: items[fajrIdx].name,
            rawName: items[fajrIdx].rawName.toLowerCase(),
            type: 'athan',
            timeRemaining: countdownLabel ?? '',
          }
        : null;

    return {
      items,
      prayers,
      nextPrayer: nextPrayerInfo,
      currentTime: currentTimeStr,
      currentTimeFormatted: currentTimeStr,
      hijriDate: getHijriDate(locale),
      countdownLabel,
      countdownClock,
      countdownClockFull,
      secondsToIqamah,
      nowHours: now.hours,
    };
    // `tick` re-runs the memo every second so countdown / status / clock stay live.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data, timezone, tick, isToday, ruleMap, locale]);

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
    isFetching: query.isFetching,
    error: query.error?.message ?? null,
    refetch: () => query.refetch(),
  };
}

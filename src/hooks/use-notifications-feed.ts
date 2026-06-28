import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';

import type { NotificationItem } from '@/components/notifications/NotificationsList';
import { useSupabase } from '@/src/hooks/use-supabase';
import { useJummahSchedule } from '@/src/hooks/use-jummah-schedule';
import { usePrayerTimes } from '@/src/hooks/use-prayer-times';

/** One content item the user opted into reminders for. */
type NotifOptin = {
  content_id: string;
  name: string | null;
  type: string | null;
  image: string | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  days: string[] | null;
  is_weekly_program: boolean | null;
  opted_in_at: string | null;
};

/** Fetches the content this user opted into reminders for (via ct02-actions). */
function useNotifOptins() {
  const supabase = useSupabase();
  const { userId, isLoaded } = useAuth();

  return useQuery({
    queryKey: ['notif-optins', userId],
    queryFn: async (): Promise<NotifOptin[]> => {
      const { data, error } = await supabase.functions.invoke<{
        items: NotifOptin[];
        error?: string;
      }>('ct02-actions', {
        body: { action: 'list_notif_optins', user_id: userId },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data?.items ?? [];
    },
    enabled: isLoaded && !!userId,
    staleTime: 60 * 1000,
  });
}

/** '16:00' → '4:00 PM'. Returns the input unchanged if it can't be parsed. */
function formatTime12h(time: string | null): string | null {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h)) return time;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m ?? 0).padStart(2, '0')} ${period}`;
}

/** Local YYYY-MM-DD for "today", to bucket items without timezone math. */
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

const ICON_BY_TYPE: Record<string, NotificationItem['icon']> = {
  event: 'calendar-outline',
  program: 'book-outline',
  class: 'school-outline',
};

// Section order the Notification Center renders groups in.
const GROUP_ORDER = ['Today', 'This week', 'Upcoming', 'Earlier'] as const;

/**
 * Builds the Notification Center feed from real data:
 *  - Events: the content the user opted into reminders for (their actual
 *    notification choices), bucketed by when each item happens.
 *  - Prayer: the next prayer and the upcoming Jummah khutbah (masjid data).
 *
 * There's no delivered-notification log yet, so this reflects what the user
 * will be reminded about rather than a history of past pushes.
 */
export function useNotificationsFeed(): {
  items: NotificationItem[];
  isLoading: boolean;
} {
  const optinsQ = useNotifOptins();
  const { nextPrayer, countdownLabel, status: prayerStatus } = usePrayerTimes();
  const { slots: jummahSlots } = useJummahSchedule();

  const today = todayISO();
  const buckets: Record<string, NotificationItem[]> = {
    Today: [],
    'This week': [],
    Upcoming: [],
    Earlier: [],
  };

  // ── Prayer: next prayer (live) ────────────────────────────────────────────
  if (nextPrayer) {
    buckets.Today.push({
      id: `prayer-next`,
      category: 'prayer',
      group: 'Today',
      title: `${nextPrayer.name} is next`,
      subtitle: countdownLabel ? `Iqamah ${countdownLabel}` : nextPrayer.timeRemaining,
      time: 'now',
      icon: 'time-outline',
      unread: true,
    });
  }

  // ── Prayer: upcoming Jummah ───────────────────────────────────────────────
  const jummah = jummahSlots[0];
  if (jummah) {
    buckets['This week'].push({
      id: `jummah-${jummah.id}`,
      category: 'prayer',
      group: 'This week',
      title: `Jummah · ${jummah.speaker}`,
      subtitle: jummah.title,
      time: jummah.time,
      icon: 'people-outline',
    });
  }

  // ── Events: the user's content reminder opt-ins ───────────────────────────
  for (const item of optinsQ.data ?? []) {
    const schedule = item.is_weekly_program
      ? (item.days ?? []).map((d) => d.slice(0, 3)).join(', ')
      : item.start_date ?? '';
    const subtitle = [schedule, formatTime12h(item.start_time)].filter(Boolean).join(' · ');

    let group: string;
    if (item.is_weekly_program) group = 'This week';
    else if (!item.start_date) group = 'Upcoming';
    else if (item.start_date === today) group = 'Today';
    else if (item.start_date > today) group = 'Upcoming';
    else group = 'Earlier';

    buckets[group].push({
      id: `content-${item.content_id}`,
      category: 'event',
      group,
      title: item.name ?? 'Untitled',
      subtitle: subtitle || undefined,
      time: formatTime12h(item.start_time) ?? undefined,
      icon: ICON_BY_TYPE[item.type ?? 'event'] ?? 'notifications-outline',
    });
  }

  const items = GROUP_ORDER.flatMap((g) => buckets[g]);

  return {
    items,
    isLoading: optinsQ.isPending || prayerStatus === 'loading',
  };
}

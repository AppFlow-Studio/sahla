import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';

export type PrayerNotificationOption =
  | 'prayer_time'
  | 'iqamah_time'
  | 'reminder_30m';

export const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
export type PrayerName = (typeof PRAYER_NAMES)[number];

export const DEFAULT_PRAYER_NOTIFICATIONS: PrayerNotificationOption[] = [
  'prayer_time',
  'iqamah_time',
];

type MosqueRow = {
  id: string;
  name: string;
  brand_color: string | null;
  accent_color: string | null;
  secondary_color: string | null;
  logo_url: string | null;
};

type ContentNotificationRow = {
  id: number;
  content_id: string;
  mosque_id: string;
  created_at: string | null;
  content_items: {
    name: string | null;
    description: string | null;
    image: string | null;
    type: string | null;
    start_date: string | null;
    start_time: string | null;
  } | null;
};

type JummahNotificationRow = {
  id: number;
  mosque_id: string;
  jummah: string | null;
  notification_settings: string[] | null;
  created_at: string;
};

export type JummahPrayerRow = {
  id: number;
  mosque_id: string;
  prayer_time: string | null;
  topic: string | null;
  speaker: string | null;
  capacity_status: string | null;
};

export type JummahNotificationOption =
  | 'prayer_time'
  | 'reminder_30m'
  | 'reminder_1h';

export const DEFAULT_JUMMAH_NOTIFICATIONS: JummahNotificationOption[] = [
  'prayer_time',
];

type TodaysPrayerRow = {
  id: number;
  mosque_id: string;
  prayer_name: string | null;
  athan_time: string | null;
  iqamah_time: string | null;
};

type PrayerNotificationSettingRow = {
  id: number;
  user_id: string;
  mosque_id: string;
  prayer: string | null;
  notification_settings: string[] | null;
};

const MOSQUE_COLUMNS =
  'id, name, brand_color, accent_color, secondary_color, logo_url' as const;

const CONTENT_NOTIFICATION_SELECT =
  'id, content_id, mosque_id, created_at, content_items(name, description, image, type, start_date, start_time)' as const;

const JUMMAH_NOTIFICATION_COLUMNS =
  'id, mosque_id, jummah, notification_settings, created_at' as const;

const JUMMAH_COLUMNS =
  'id, mosque_id, prayer_time, topic, speaker, capacity_status' as const;

const TODAYS_PRAYERS_COLUMNS =
  'id, mosque_id, prayer_name, athan_time, iqamah_time' as const;

const PRAYER_NOTIFICATION_SETTINGS_COLUMNS =
  'id, user_id, mosque_id, prayer, notification_settings' as const;

export function useNotifications() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const { userId, isLoaded } = useAuth();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);

  const prayerSettingsKey = [
    'use-notifications',
    'prayer-settings',
    mosqueUuid,
    userId,
  ] as const;

  const jummahNotificationsKey = [
    'use-notifications',
    'jummah',
    mosqueUuid,
    userId,
  ] as const;

  const mosqueQuery = useQuery({
    queryKey: ['use-notifications', 'mosque', mosqueUuid],
    queryFn: async (): Promise<MosqueRow | null> => {
      const { data, error } = await supabase
        .from('mosques')
        .select(MOSQUE_COLUMNS)
        .eq('id', mosqueUuid!)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as MosqueRow) ?? null;
    },
    enabled: !!mosqueUuid,
  });

  const contentNotificationQuery = useQuery({
    queryKey: ['use-notifications', 'content', mosqueUuid, userId],
    queryFn: async (): Promise<ContentNotificationRow[]> => {
      const { data, error } = await supabase
        .from('content_notifications')
        .select(CONTENT_NOTIFICATION_SELECT)
        .eq('mosque_id', mosqueUuid!)
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as ContentNotificationRow[];
    },
    enabled: isLoaded && !!mosqueUuid && !!userId,
  });

  const jummahNotificationQuery = useQuery({
    queryKey: jummahNotificationsKey,
    queryFn: async (): Promise<JummahNotificationRow[]> => {
      const { data, error } = await supabase
        .from('jummah_notifications')
        .select(JUMMAH_NOTIFICATION_COLUMNS)
        .eq('mosque_id', mosqueUuid!)
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as JummahNotificationRow[];
    },
    enabled: isLoaded && !!mosqueUuid && !!userId,
  });

  const jummahQuery = useQuery({
    queryKey: ['use-notifications', 'jummah-times', mosqueUuid],
    queryFn: async (): Promise<JummahPrayerRow[]> => {
      const { data, error } = await supabase
        .from('jummah')
        .select(JUMMAH_COLUMNS)
        .eq('mosque_id', mosqueUuid!)
        .order('prayer_time', { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as JummahPrayerRow[];
    },
    enabled: !!mosqueUuid,
  });

  const todaysPrayersQuery = useQuery({
    queryKey: ['use-notifications', 'todays-prayers', mosqueUuid],
    queryFn: async (): Promise<TodaysPrayerRow[]> => {
      const { data, error } = await supabase
        .from('todays_prayers')
        .select(TODAYS_PRAYERS_COLUMNS)
        .eq('mosque_id', mosqueUuid!);
      if (error) throw new Error(error.message);
      return (data ?? []) as TodaysPrayerRow[];
    },
    enabled: !!mosqueUuid,
  });

  const prayerNotificationSettingsQuery = useQuery({
    queryKey: prayerSettingsKey,
    queryFn: async (): Promise<PrayerNotificationSettingRow[]> => {
      const { data, error } = await supabase
        .from('prayer_notification_settings')
        .select(PRAYER_NOTIFICATION_SETTINGS_COLUMNS)
        .eq('mosque_id', mosqueUuid!)
        .eq('user_id', userId!);
      if (error) throw new Error(error.message);
      return (data ?? []) as PrayerNotificationSettingRow[];
    },
    enabled: isLoaded && !!mosqueUuid && !!userId,
  });

  const upsertOnePrayerSettings = useMutation({
    mutationFn: async (input: {
      prayer: PrayerName;
      settings: PrayerNotificationOption[];
    }) => {
      if (!mosqueUuid || !userId) {
        throw new Error('Cannot save — user or mosque not ready.');
      }
      const { error } = await supabase
        .from('prayer_notification_settings')
        .upsert(
          {
            user_id: userId,
            mosque_id: mosqueUuid,
            prayer: input.prayer,
            notification_settings: input.settings,
          },
          { onConflict: 'user_id,mosque_id,prayer' },
        );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: prayerSettingsKey });
    },
  });

  const upsertJummahSettings = useMutation({
    mutationFn: async (input: {
      jummahId: number;
      settings: JummahNotificationOption[];
    }) => {
      if (!mosqueUuid || !userId) {
        throw new Error('Cannot save — user or mosque not ready.');
      }
      const { error } = await supabase
        .from('jummah_notifications')
        .upsert(
          {
            user_id: userId,
            mosque_id: mosqueUuid,
            jummah: String(input.jummahId),
            notification_settings: input.settings,
          },
          { onConflict: 'user_id,mosque_id,jummah' },
        );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jummahNotificationsKey });
    },
  });

  const upsertAllPrayerSettings = useMutation({
    mutationFn: async (settings: PrayerNotificationOption[]) => {
      if (!mosqueUuid || !userId) {
        throw new Error('Cannot save — user or mosque not ready.');
      }
      const rows = PRAYER_NAMES.map((prayer) => ({
        user_id: userId,
        mosque_id: mosqueUuid,
        prayer,
        notification_settings: settings,
      }));
      const { error } = await supabase
        .from('prayer_notification_settings')
        .upsert(rows, { onConflict: 'user_id,mosque_id,prayer' });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: prayerSettingsKey });
    },
  });

  return {
    mosque: mosqueQuery.data ?? null,
    contentNotifications: contentNotificationQuery.data ?? [],
    jummahNotifications: jummahNotificationQuery.data ?? [],
    jummahPrayers: jummahQuery.data ?? [],
    todaysPrayers: todaysPrayersQuery.data ?? [],
    prayerNotificationSettings: prayerNotificationSettingsQuery.data ?? [],
    isLoading:
      mosqueQuery.isPending ||
      contentNotificationQuery.isPending ||
      jummahNotificationQuery.isPending ||
      jummahQuery.isPending ||
      todaysPrayersQuery.isPending ||
      prayerNotificationSettingsQuery.isPending,
    isError:
      mosqueQuery.isError ||
      contentNotificationQuery.isError ||
      jummahNotificationQuery.isError ||
      jummahQuery.isError ||
      todaysPrayersQuery.isError ||
      prayerNotificationSettingsQuery.isError,
    error:
      mosqueQuery.error?.message ??
      contentNotificationQuery.error?.message ??
      jummahNotificationQuery.error?.message ??
      jummahQuery.error?.message ??
      todaysPrayersQuery.error?.message ??
      prayerNotificationSettingsQuery.error?.message ??
      null,
    savePrayerSettings: upsertOnePrayerSettings.mutateAsync,
    applyPrayerSettingsToAll: upsertAllPrayerSettings.mutateAsync,
    saveJummahSettings: upsertJummahSettings.mutateAsync,
    isSaving:
      upsertOnePrayerSettings.isPending ||
      upsertAllPrayerSettings.isPending ||
      upsertJummahSettings.isPending,
  };
}

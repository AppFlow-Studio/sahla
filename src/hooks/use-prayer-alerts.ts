import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';

export const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
export type PrayerName = (typeof PRAYER_NAMES)[number];

/** Tokens stored in the `notification_settings` text[] column. */
export const NOTIF_TOKENS = {
  PRAYER_TIME: 'prayer_time',
  IQAMAH_TIME: 'iqamah_time',
  THIRTY_MIN: '30_min_before',
} as const;

export type NotifToken = (typeof NOTIF_TOKENS)[keyof typeof NOTIF_TOKENS];

const DEFAULT_ON_SETTINGS: string[] = ['prayer_time', 'iqamah_time'];

export type PrayerSettingRow = {
  prayer: string | null;
  notification_settings: string[] | null;
};

type PrayerToggleMap = Record<PrayerName, boolean>;

export function usePrayerAlerts() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const { userId, isLoaded } = useAuth();
  const mosqueId = useConfigStore((s) => s.mosqueUuid);

  const ready = isLoaded && !!mosqueId && !!userId;
  const queryKey = [
    'notification-prefs',
    'prayer-settings',
    mosqueId,
    userId,
  ] as const;

  const prayerQuery = useQuery({
    queryKey,
    queryFn: async (): Promise<PrayerSettingRow[]> => {
      const { data, error } = await supabase
        .from('prayer_notification_settings')
        .select('prayer, notification_settings')
        .eq('mosque_id', mosqueId!)
        .eq('user_id', userId!);
      if (error) throw new Error(error.message);
      return (data ?? []) as PrayerSettingRow[];
    },
    enabled: ready,
  });

  const rows = prayerQuery.data ?? [];

  /** Get the notification_settings array for a single prayer. */
  const getSettings = (prayer: PrayerName): string[] => {
    const row = rows.find((r) => r.prayer === prayer);
    return row?.notification_settings ?? [];
  };

  const isOn = (prayer: PrayerName): boolean => getSettings(prayer).length > 0;

  const toggles: PrayerToggleMap = {
    Fajr: isOn('Fajr'),
    Dhuhr: isOn('Dhuhr'),
    Asr: isOn('Asr'),
    Maghrib: isOn('Maghrib'),
    Isha: isOn('Isha'),
  };

  /** Save exact notification_settings array for a single prayer. */
  const savePrayerSettingsMutation = useMutation<
    void,
    Error,
    { prayer: PrayerName; settings: string[] },
    { previous: PrayerSettingRow[] | undefined }
  >({
    mutationFn: async ({ prayer, settings }) => {
      if (!mosqueId || !userId) {
        throw new Error('Cannot save — user or mosque not ready.');
      }
      const { error } = await supabase
        .from('prayer_notification_settings')
        .upsert(
          {
            user_id: userId,
            mosque_id: mosqueId,
            prayer,
            notification_settings: settings,
          },
          { onConflict: 'user_id,mosque_id,prayer' },
        );
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ prayer, settings }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<PrayerSettingRow[]>(queryKey);
      const base = previous ?? [];
      const filtered = base.filter((r) => r.prayer !== prayer);
      queryClient.setQueryData<PrayerSettingRow[]>(queryKey, [
        ...filtered,
        { prayer, notification_settings: settings },
      ]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  /** Apply the same notification_settings to all 5 prayers at once. */
  const applyToAllMutation = useMutation<
    void,
    Error,
    { settings: string[] },
    { previous: PrayerSettingRow[] | undefined }
  >({
    mutationFn: async ({ settings }) => {
      if (!mosqueId || !userId) {
        throw new Error('Cannot save — user or mosque not ready.');
      }
      const upsertRows = PRAYER_NAMES.map((prayer) => ({
        user_id: userId,
        mosque_id: mosqueId,
        prayer,
        notification_settings: settings,
      }));
      const { error } = await supabase
        .from('prayer_notification_settings')
        .upsert(upsertRows, { onConflict: 'user_id,mosque_id,prayer' });
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ settings }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<PrayerSettingRow[]>(queryKey);
      const next: PrayerSettingRow[] = PRAYER_NAMES.map((prayer) => ({
        prayer,
        notification_settings: settings,
      }));
      queryClient.setQueryData<PrayerSettingRow[]>(queryKey, next);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Keep the old simple toggle for backwards compat (PrayerAlerts screen)
  const setPrayerMutation = useMutation<
    void,
    Error,
    { prayer: PrayerName; value: boolean },
    { previous: PrayerSettingRow[] | undefined }
  >({
    mutationFn: async ({ prayer, value }) => {
      if (!mosqueId || !userId) {
        throw new Error('Cannot save — user or mosque not ready.');
      }
      const { error } = await supabase
        .from('prayer_notification_settings')
        .upsert(
          {
            user_id: userId,
            mosque_id: mosqueId,
            prayer,
            notification_settings: value ? DEFAULT_ON_SETTINGS : [],
          },
          { onConflict: 'user_id,mosque_id,prayer' },
        );
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ prayer, value }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<PrayerSettingRow[]>(queryKey);
      const base = previous ?? [];
      const filtered = base.filter((r) => r.prayer !== prayer);
      const nextRow: PrayerSettingRow = {
        prayer,
        notification_settings: value ? DEFAULT_ON_SETTINGS : [],
      };
      queryClient.setQueryData<PrayerSettingRow[]>(queryKey, [
        ...filtered,
        nextRow,
      ]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    toggles,
    rows,
    getSettings,
    setPrayer: (prayer: PrayerName, value: boolean) =>
      setPrayerMutation.mutateAsync({ prayer, value }),
    savePrayerSettings: (prayer: PrayerName, settings: string[]) =>
      savePrayerSettingsMutation.mutateAsync({ prayer, settings }),
    applyToAll: (settings: string[]) =>
      applyToAllMutation.mutateAsync({ settings }),
    isLoading: prayerQuery.isPending,
    isSaving:
      setPrayerMutation.isPending ||
      savePrayerSettingsMutation.isPending ||
      applyToAllMutation.isPending,
    error:
      prayerQuery.error?.message ??
      setPrayerMutation.error?.message ??
      savePrayerSettingsMutation.error?.message ??
      applyToAllMutation.error?.message ??
      null,
  };
}

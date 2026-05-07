import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';

export const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
export type PrayerName = (typeof PRAYER_NAMES)[number];

const DEFAULT_ON_SETTINGS: string[] = ['prayer_time', 'iqamah_time'];

type PrayerSettingRow = {
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
  const isOn = (prayer: PrayerName): boolean => {
    const row = rows.find((r) => r.prayer === prayer);
    return (row?.notification_settings ?? []).length > 0;
  };

  const toggles: PrayerToggleMap = {
    Fajr: isOn('Fajr'),
    Dhuhr: isOn('Dhuhr'),
    Asr: isOn('Asr'),
    Maghrib: isOn('Maghrib'),
    Isha: isOn('Isha'),
  };

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
    setPrayer: (prayer: PrayerName, value: boolean) =>
      setPrayerMutation.mutateAsync({ prayer, value }),
    isLoading: prayerQuery.isPending,
    isSaving: setPrayerMutation.isPending,
    error:
      prayerQuery.error?.message ?? setPrayerMutation.error?.message ?? null,
  };
}

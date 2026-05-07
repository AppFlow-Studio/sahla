import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';

const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
type PrayerName = (typeof PRAYER_NAMES)[number];

const ATHAN_TOKEN = 'prayer_time';
const IQAMAH_TOKEN = 'iqamah_time';
const JUMMAH_TOKEN = 'prayer_time';

export type SettingsToggleKey =
  | 'athan'
  | 'iqamah'
  | 'eventReminders'
  | 'newPrograms'
  | 'jummah'
  | 'announcements';

type PrayerSettingRow = {
  prayer: string | null;
  notification_settings: string[] | null;
};

type JummahNotifRow = {
  jummah: string | null;
  notification_settings: string[] | null;
};

type JummahTimeRow = { id: number };

type UserPrefsRow = {
  event_reminders_enabled: boolean;
  new_programs_enabled: boolean;
  masjid_announcements_enabled: boolean;
};

export function useNotificationSettings() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const { userId, isLoaded } = useAuth();
  const mosqueId = useConfigStore((s) => s.mosqueUuid);

  const ready = isLoaded && !!mosqueId && !!userId;

  const prayerKey = ['notification-prefs', 'prayer-settings', mosqueId, userId] as const;
  const jummahNotifKey = ['notification-prefs', 'jummah-notifs', mosqueId, userId] as const;
  const jummahTimesKey = ['notification-prefs', 'jummah-times', mosqueId] as const;
  const userPrefsKey = ['notification-prefs', 'user-prefs', mosqueId, userId] as const;

  const prayerQuery = useQuery({
    queryKey: prayerKey,
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

  const jummahNotifQuery = useQuery({
    queryKey: jummahNotifKey,
    queryFn: async (): Promise<JummahNotifRow[]> => {
      const { data, error } = await supabase
        .from('jummah_notifications')
        .select('jummah, notification_settings')
        .eq('mosque_id', mosqueId!)
        .eq('user_id', userId!);
      if (error) throw new Error(error.message);
      return (data ?? []) as JummahNotifRow[];
    },
    enabled: ready,
  });

  const jummahTimesQuery = useQuery({
    queryKey: jummahTimesKey,
    queryFn: async (): Promise<JummahTimeRow[]> => {
      const { data, error } = await supabase
        .from('jummah')
        .select('id')
        .eq('mosque_id', mosqueId!);
      if (error) throw new Error(error.message);
      return (data ?? []) as JummahTimeRow[];
    },
    enabled: !!mosqueId,
  });

  const userPrefsQuery = useQuery({
    queryKey: userPrefsKey,
    queryFn: async (): Promise<UserPrefsRow | null> => {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select(
          'event_reminders_enabled, new_programs_enabled, masjid_announcements_enabled',
        )
        .eq('mosque_id', mosqueId!)
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as UserPrefsRow | null) ?? null;
    },
    enabled: ready,
  });

  const prayerRows = prayerQuery.data ?? [];
  const jummahNotifRows = jummahNotifQuery.data ?? [];
  const jummahTimes = jummahTimesQuery.data ?? [];
  const userPrefs = userPrefsQuery.data ?? null;

  const allPrayersHave = (token: string): boolean =>
    PRAYER_NAMES.every((p) => {
      const row = prayerRows.find((r) => r.prayer === p);
      return (row?.notification_settings ?? []).includes(token);
    });

  const allJummahsHave = (token: string): boolean =>
    jummahTimes.length > 0 &&
    jummahTimes.every((t) => {
      const row = jummahNotifRows.find((r) => r.jummah === String(t.id));
      return (row?.notification_settings ?? []).includes(token);
    });

  const toggles = {
    athan: allPrayersHave(ATHAN_TOKEN),
    iqamah: allPrayersHave(IQAMAH_TOKEN),
    jummah: allJummahsHave(JUMMAH_TOKEN),
    eventReminders: userPrefs?.event_reminders_enabled ?? false,
    newPrograms: userPrefs?.new_programs_enabled ?? true,
    announcements: userPrefs?.masjid_announcements_enabled ?? false,
  };

  type RollbackContext =
    | { kind: 'prayer'; previous: PrayerSettingRow[] | undefined }
    | { kind: 'jummah'; previous: JummahNotifRow[] | undefined }
    | { kind: 'user-prefs'; previous: UserPrefsRow | null | undefined };

  const setToggleMutation = useMutation<
    void,
    Error,
    { key: SettingsToggleKey; value: boolean },
    RollbackContext
  >({
    mutationFn: async ({
      key,
      value,
    }: {
      key: SettingsToggleKey;
      value: boolean;
    }) => {
      if (!mosqueId || !userId) {
        throw new Error('Cannot save — user or mosque not ready.');
      }

      if (key === 'athan' || key === 'iqamah') {
        const token = key === 'athan' ? ATHAN_TOKEN : IQAMAH_TOKEN;
        const rows = PRAYER_NAMES.map((prayer) => {
          const existing = prayerRows.find((r) => r.prayer === prayer);
          const current = existing?.notification_settings ?? [];
          const stripped = current.filter((s) => s !== token);
          return {
            user_id: userId,
            mosque_id: mosqueId,
            prayer,
            notification_settings: value ? [...stripped, token] : stripped,
          };
        });
        const { error } = await supabase
          .from('prayer_notification_settings')
          .upsert(rows, { onConflict: 'user_id,mosque_id,prayer' });
        if (error) throw new Error(error.message);
        return;
      }

      if (key === 'jummah') {
        if (jummahTimes.length === 0) return;
        const rows = jummahTimes.map((t) => {
          const existing = jummahNotifRows.find(
            (r) => r.jummah === String(t.id),
          );
          const current = existing?.notification_settings ?? [];
          const stripped = current.filter((s) => s !== JUMMAH_TOKEN);
          return {
            user_id: userId,
            mosque_id: mosqueId,
            jummah: String(t.id),
            notification_settings: value
              ? [...stripped, JUMMAH_TOKEN]
              : stripped,
          };
        });
        const { error } = await supabase
          .from('jummah_notifications')
          .upsert(rows, { onConflict: 'user_id,mosque_id,jummah' });
        if (error) throw new Error(error.message);
        return;
      }

      const baseRow = {
        user_id: userId,
        mosque_id: mosqueId,
        event_reminders_enabled:
          userPrefs?.event_reminders_enabled ?? false,
        new_programs_enabled: userPrefs?.new_programs_enabled ?? true,
        masjid_announcements_enabled:
          userPrefs?.masjid_announcements_enabled ?? false,
      };
      const next = { ...baseRow };
      if (key === 'eventReminders') next.event_reminders_enabled = value;
      else if (key === 'newPrograms') next.new_programs_enabled = value;
      else if (key === 'announcements')
        next.masjid_announcements_enabled = value;

      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert(next, { onConflict: 'user_id,mosque_id' });
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ key, value }): Promise<RollbackContext> => {
      if (key === 'athan' || key === 'iqamah') {
        const token = key === 'athan' ? ATHAN_TOKEN : IQAMAH_TOKEN;
        await queryClient.cancelQueries({ queryKey: prayerKey });
        const previous =
          queryClient.getQueryData<PrayerSettingRow[]>(prayerKey);
        const base = previous ?? [];
        const next: PrayerSettingRow[] = PRAYER_NAMES.map((p) => {
          const existing = base.find((r) => r.prayer === p);
          const current = existing?.notification_settings ?? [];
          const stripped = current.filter((s) => s !== token);
          return {
            prayer: p,
            notification_settings: value ? [...stripped, token] : stripped,
          };
        });
        queryClient.setQueryData<PrayerSettingRow[]>(prayerKey, next);
        return { kind: 'prayer', previous };
      }
      if (key === 'jummah') {
        await queryClient.cancelQueries({ queryKey: jummahNotifKey });
        const previous =
          queryClient.getQueryData<JummahNotifRow[]>(jummahNotifKey);
        const base = previous ?? [];
        const next: JummahNotifRow[] = jummahTimes.map((t) => {
          const existing = base.find((r) => r.jummah === String(t.id));
          const current = existing?.notification_settings ?? [];
          const stripped = current.filter((s) => s !== JUMMAH_TOKEN);
          return {
            jummah: String(t.id),
            notification_settings: value
              ? [...stripped, JUMMAH_TOKEN]
              : stripped,
          };
        });
        queryClient.setQueryData<JummahNotifRow[]>(jummahNotifKey, next);
        return { kind: 'jummah', previous };
      }
      await queryClient.cancelQueries({ queryKey: userPrefsKey });
      const previous =
        queryClient.getQueryData<UserPrefsRow | null>(userPrefsKey);
      const fallback: UserPrefsRow = {
        event_reminders_enabled: false,
        new_programs_enabled: true,
        masjid_announcements_enabled: false,
      };
      const baseRow: UserPrefsRow = previous ?? fallback;
      const nextRow: UserPrefsRow = { ...baseRow };
      if (key === 'eventReminders') nextRow.event_reminders_enabled = value;
      else if (key === 'newPrograms') nextRow.new_programs_enabled = value;
      else if (key === 'announcements')
        nextRow.masjid_announcements_enabled = value;
      queryClient.setQueryData<UserPrefsRow>(userPrefsKey, nextRow);
      return { kind: 'user-prefs', previous };
    },
    onError: (_err, _vars, context) => {
      if (!context) return;
      if (context.kind === 'prayer') {
        queryClient.setQueryData(prayerKey, context.previous);
      } else if (context.kind === 'jummah') {
        queryClient.setQueryData(jummahNotifKey, context.previous);
      } else {
        queryClient.setQueryData(userPrefsKey, context.previous);
      }
    },
    onSettled: (_data, _err, vars) => {
      if (vars.key === 'athan' || vars.key === 'iqamah') {
        queryClient.invalidateQueries({ queryKey: prayerKey });
      } else if (vars.key === 'jummah') {
        queryClient.invalidateQueries({ queryKey: jummahNotifKey });
      } else {
        queryClient.invalidateQueries({ queryKey: userPrefsKey });
      }
    },
  });

  return {
    toggles,
    setToggle: (key: SettingsToggleKey, value: boolean) =>
      setToggleMutation.mutateAsync({ key, value }),
    isLoading:
      prayerQuery.isPending ||
      jummahNotifQuery.isPending ||
      jummahTimesQuery.isPending ||
      userPrefsQuery.isPending,
    isSaving: setToggleMutation.isPending,
    error:
      prayerQuery.error?.message ??
      jummahNotifQuery.error?.message ??
      jummahTimesQuery.error?.message ??
      userPrefsQuery.error?.message ??
      setToggleMutation.error?.message ??
      null,
  };
}

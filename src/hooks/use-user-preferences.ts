import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';

const COLUMNS =
  'id, user_id, mosque_id, attendance_reasons, programs_for, attendance_windows, additional_preferences, gender, birth_year, has_children, children_ages, is_revert, islamic_knowledge_level, preferred_days, preferred_times, preferred_language, personalization_completed_at, quran_daily_goal' as const;

export type UserPreferencesRow = {
  id: number;
  user_id: string;
  mosque_id: string;
  attendance_reasons: string[];
  programs_for: string[];
  attendance_windows: string[];
  additional_preferences: string[];
  gender: string | null;
  birth_year: number | null;
  has_children: boolean | null;
  children_ages: number[] | null;
  is_revert: boolean | null;
  islamic_knowledge_level: string | null;
  preferred_days: string[] | null;
  preferred_times: string[] | null;
  /** Free-text language name collected at onboarding (e.g. "English", "Arabic"). */
  preferred_language: string | null;
  personalization_completed_at: string | null;
  /** Daily Quran page goal — drives the NT-ENGAGE-01 reading-goal nudge. */
  quran_daily_goal: number;
};

/**
 * Read + upsert hook for the per-user, per-mosque preferences row backing
 * the personalization flow. Returns `null` when no row exists yet — that's
 * the "user hasn't filled anything in" state, which the screens render as
 * empty selections.
 */
export function useUserPreferences() {
  const { userId, isLoaded } = useAuth();
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);

  const queryKey = ['user-preferences', userId, mosqueUuid] as const;

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<UserPreferencesRow | null> => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select(COLUMNS)
        .eq('user_id', userId!)
        .eq('mosque_id', mosqueUuid!)
        .maybeSingle();

      if (error) throw new Error(error.message);
      // Cast via `unknown`: `quran_daily_goal` is declared in migration
      // 20260628120000_user_reading_goal_and_progress.sql but `database.types.ts`
      // is regenerated *after* a migration is applied to staging, so the
      // typed shape doesn't include the column until then.
      return (data as unknown as UserPreferencesRow) ?? null;
    },
    enabled: isLoaded && !!userId && !!mosqueUuid,
  });

  const upsertAttendanceReasons = useMutation({
    mutationFn: async (reasons: string[]) => {
      if (!userId || !mosqueUuid) {
        throw new Error('Cannot save — user or mosque not ready.');
      }
      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: userId,
            mosque_id: mosqueUuid,
            attendance_reasons: reasons,
          },
          { onConflict: 'user_id,mosque_id' },
        );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const upsertProgramsFor = useMutation({
    mutationFn: async (audience: string[]) => {
      if (!userId || !mosqueUuid) {
        throw new Error('Cannot save — user or mosque not ready.');
      }
      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: userId,
            mosque_id: mosqueUuid,
            programs_for: audience,
          },
          { onConflict: 'user_id,mosque_id' },
        );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const upsertAttendanceWindows = useMutation({
    mutationFn: async (windows: string[]) => {
      if (!userId || !mosqueUuid) {
        throw new Error('Cannot save — user or mosque not ready.');
      }
      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: userId,
            mosque_id: mosqueUuid,
            attendance_windows: windows,
          },
          { onConflict: 'user_id,mosque_id' },
        );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const upsertIslamicKnowledgeLevel = useMutation({
    mutationFn: async (level: string | null) => {
      if (!userId || !mosqueUuid) {
        throw new Error('Cannot save — user or mosque not ready.');
      }
      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: userId,
            mosque_id: mosqueUuid,
            islamic_knowledge_level: level,
          },
          { onConflict: 'user_id,mosque_id' },
        );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Step 5 — atomic write of two columns: the is_revert demographic flag and
  // the catch-all additional_preferences array (languages, accessibility,
  // sisters/brothers-only filters).
  const upsertAnythingElse = useMutation({
    mutationFn: async (input: { isRevert: boolean; additionalPreferences: string[] }) => {
      if (!userId || !mosqueUuid) {
        throw new Error('Cannot save — user or mosque not ready.');
      }
      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: userId,
            mosque_id: mosqueUuid,
            is_revert: input.isRevert,
            additional_preferences: input.additionalPreferences,
          },
          { onConflict: 'user_id,mosque_id' },
        );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // NT-ENGAGE-01: sync the daily Quran page goal up to user_preferences so
  // the engagement-nudge scheduler reads the user's actual goal (not just
  // the migration default of 2). Called from QuranTrackerScreen after the
  // local MMKV-side setGoals() write.
  const upsertQuranDailyGoal = useMutation({
    mutationFn: async (goal: number) => {
      if (!userId || !mosqueUuid) {
        throw new Error('Cannot save — user or mosque not ready.');
      }
      const safe = Math.max(1, Math.floor(goal));
      // Payload cast: `quran_daily_goal` lives in the new migration, not yet
      // in the typed Insert shape — same reason as the `select` cast above.
      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: userId,
            mosque_id: mosqueUuid,
            quran_daily_goal: safe,
          } as never,
          { onConflict: 'user_id,mosque_id' },
        );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Stamp completion when the user reaches the end of the personalization flow.
  const markPersonalizationComplete = useMutation({
    mutationFn: async () => {
      if (!userId || !mosqueUuid) {
        throw new Error('Cannot save — user or mosque not ready.');
      }
      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: userId,
            mosque_id: mosqueUuid,
            personalization_completed_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,mosque_id' },
        );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    preferences: query.data ?? null,
    status: !isLoaded || !mosqueUuid
      ? ('idle' as const)
      : query.isPending
        ? ('loading' as const)
        : query.isError
          ? ('error' as const)
          : ('success' as const),
    error: query.error?.message ?? null,
    upsertAttendanceReasons,
    upsertProgramsFor,
    upsertAttendanceWindows,
    upsertIslamicKnowledgeLevel,
    upsertAnythingElse,
    upsertQuranDailyGoal,
    markPersonalizationComplete,
  };
}

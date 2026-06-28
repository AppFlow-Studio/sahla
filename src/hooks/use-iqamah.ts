import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';

/**
 * Iqamah configuration — the per-prayer rule for when iqamah is called.
 *
 * Each of the five daily prayers is either:
 *   - 'fixed'  → a clock time the admin sets (e.g. Dhuhr 13:30), or
 *   - 'offset' → athan + N minutes (e.g. Fajr +20).
 *
 * Rules live in the `iqamah_config` table (one row per mosque+prayer). The app
 * reads them with the public client (public-read RLS) and computes the actual
 * iqamah time from the day's athan via `computeIqamahTime`, so there's no daily
 * data entry. Mosque admins write them from the in-app admin panel
 * (iqamah_config_mosque_write RLS).
 */

export type IqamahMode = 'fixed' | 'offset';

/** The five daily prayers iqamah applies to, in order. */
export const IQAMAH_PRAYERS = [
  { key: 'fajr', label: 'Fajr' },
  { key: 'dhuhr', label: 'Dhuhr' },
  { key: 'asr', label: 'Asr' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isha', label: 'Isha' },
] as const;

export type IqamahRule = {
  prayer_name: string;
  mode: IqamahMode;
  /** 'HH:MM' or 'HH:MM:SS' — used when mode === 'fixed'. */
  fixed_time: string | null;
  /** Minutes after athan — used when mode === 'offset'. */
  offset_minutes: number | null;
};

const pad = (n: number) => String(n).padStart(2, '0');

/** 'HH:MM' or 'HH:MM:SS' → minutes-of-day, or null when unparseable. */
function timeToMinutes(time: string | null | undefined): number | null {
  if (typeof time !== 'string') return null;
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

/**
 * True when a FIXED iqamah time falls before the athan — an impossible config.
 * Returns false when either value is missing (nothing to validate against).
 */
export function isFixedIqamahBeforeAthan(
  fixedTime: string | null | undefined,
  athanRaw: string | null | undefined,
): boolean {
  const fixed = timeToMinutes(fixedTime);
  const athan = timeToMinutes(athanRaw);
  if (fixed == null || athan == null) return false;
  return fixed < athan;
}

/**
 * Resolve an iqamah rule against a day's athan time.
 * @param athanRaw athan time-of-day, 'HH:MM' or 'HH:MM:SS'
 * @returns 'HH:MM:SS' iqamah time, or null if the rule can't be resolved.
 */
export function computeIqamahTime(
  athanRaw: string | null | undefined,
  rule: IqamahRule | undefined,
): string | null {
  if (!rule) return null;

  if (rule.mode === 'fixed') {
    if (!rule.fixed_time) return null;
    const [h = '0', m = '0', s = '0'] = rule.fixed_time.split(':');
    return `${pad(Number(h))}:${pad(Number(m))}:${pad(Number(s))}`;
  }

  // offset: athan + N minutes, wrapped within the day.
  if (typeof athanRaw !== 'string' || rule.offset_minutes == null) return null;
  const [h = '0', m = '0', s = '0'] = athanRaw.split(':');
  const total = (((Number(h) * 60 + Number(m) + rule.offset_minutes) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}:${pad(Number(s))}`;
}

/** Reads this mosque's iqamah rules (public-read). */
export function useIqamahConfig() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);

  const query = useQuery({
    queryKey: ['iqamah-config', mosqueUuid],
    queryFn: async (): Promise<IqamahRule[]> => {
      const { data, error } = await supabase
        .from('iqamah_config')
        .select('prayer_name, mode, fixed_time, offset_minutes')
        .eq('mosque_id', mosqueUuid!);
      if (error) throw new Error(error.message);
      return (data as IqamahRule[]) ?? [];
    },
    enabled: !!mosqueUuid,
  });

  return {
    rules: query.data ?? [],
    isLoading: query.isPending,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

export type IqamahRuleInput = {
  prayer_name: string;
  mode: IqamahMode;
  fixed_time: string | null;
  offset_minutes: number | null;
};

/** Upserts all five prayer rules for this mosque in one write. */
export function useSaveIqamahConfig() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rules: IqamahRuleInput[]) => {
      if (!mosqueUuid) throw new Error('No mosque configured');
      const rows = rules.map((r) => ({
        mosque_id: mosqueUuid,
        prayer_name: r.prayer_name,
        mode: r.mode,
        // Only persist the field that backs the chosen mode; clear the other.
        fixed_time: r.mode === 'fixed' ? r.fixed_time : null,
        offset_minutes: r.mode === 'offset' ? r.offset_minutes : null,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase
        .from('iqamah_config')
        .upsert(rows, { onConflict: 'mosque_id,prayer_name' });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iqamah-config', mosqueUuid] });
      // Prayer countdowns derive iqamah from these rules — refresh them too.
      queryClient.invalidateQueries({ queryKey: ['prayer-times'] });
    },
  });
}

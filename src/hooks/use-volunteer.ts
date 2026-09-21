import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';

/**
 * Where this masjid takes volunteer sign-ups.
 *
 * A free-form external URL on the `mosques` row — a Google Form, a page on the
 * masjid's own site, whatever they already use. The Home screen opens it in an
 * in-app browser. A masjid with nothing set gets no Volunteer tile at all,
 * rather than a button that goes nowhere, so `null` is a meaningful value here
 * and not just "still loading".
 *
 * Read via public-read RLS; written by mosque admins in-app under
 * mosques_admin_update.
 */

/** Accept what an admin actually types ("masjid.org/volunteer") as a URL. */
export function normalizeVolunteerUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** Loose sanity check — enough to catch typos, not a URL validator. */
export function isPlausibleUrl(raw: string): boolean {
  const url = normalizeVolunteerUrl(raw);
  if (!url) return false;
  try {
    const { hostname } = new URL(url);
    return hostname.includes('.') && !hostname.startsWith('.') && !hostname.endsWith('.');
  } catch {
    return false;
  }
}

export function useVolunteerUrl() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);

  const { data, isLoading } = useQuery({
    queryKey: ['volunteer-url', mosqueUuid],
    enabled: !!mosqueUuid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mosques')
        .select('volunteer_url')
        .eq('id', mosqueUuid!)
        .single();
      if (error) throw new Error(error.message);
      return (data?.volunteer_url as string | null) ?? null;
    },
  });

  return { volunteerUrl: data ?? null, isLoading };
}

export function useSaveVolunteerUrl() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (raw: string) => {
      if (!mosqueUuid) throw new Error('No mosque configured');
      const { error } = await supabase
        .from('mosques')
        .update({ volunteer_url: normalizeVolunteerUrl(raw) })
        .eq('id', mosqueUuid);
      if (error) throw new Error(error.message);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['volunteer-url', mosqueUuid] }),
  });
}

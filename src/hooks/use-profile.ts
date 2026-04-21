import { useSupabase } from '@/src/hooks/use-supabase';
import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';

import { env } from '@/src/lib/env';

const PROFILE_COLUMNS =
  'id, first_name, last_name, profile_email, phone_number, profile_pic, stripe_id, created_at' as const;

export type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  profile_email: string | null;
  phone_number: string | null;
  profile_pic: string | null;
  stripe_id: string | null;
  created_at: string | null;
};

type Status = 'idle' | 'loading' | 'success' | 'error';

const DEV_PREVIEW_PROFILE: ProfileRow = {
  id: 'dev-preview',
  first_name: 'Dee',
  last_name: 'Chauhan',
  profile_email: 'dev@example.com',
  phone_number: '555-0100',
  profile_pic: null,
  stripe_id: null,
  created_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
};

export function useProfile() {
  const { userId, isLoaded } = useAuth();
  const supabase = useSupabase();
  const supabaseRef = useRef(supabase);
  supabaseRef.current = supabase;

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!isLoaded) return;

    if (__DEV__ && env.DEV_BYPASS_AUTH && !userId) {
      setProfile(DEV_PREVIEW_PROFILE);
      setError(null);
      setStatus('success');
      return;
    }

    if (!userId) return;

    let cancelled = false;
    setStatus('loading');

    (async () => {
      const { data, error: qError } = await supabaseRef.current
        .from('profiles')
        .select(PROFILE_COLUMNS)
        .eq('id', userId)
        .maybeSingle();

      if (cancelled) return;

      if (qError) {
        setError(qError.message);
        setStatus('error');
        return;
      }

      if (!data) {
        setError('Profile not found');
        setStatus('error');
        return;
      }

      setProfile(data as ProfileRow);
      setStatus('success');
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId, refreshKey]);

  return { profile, status, error, refetch };
}

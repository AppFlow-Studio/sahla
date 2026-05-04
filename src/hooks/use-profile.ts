import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';

import { useSupabase } from '@/src/hooks/use-supabase';

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

export function useProfile() {
  const { userId, isLoaded } = useAuth();
  const supabase = useSupabase();

  const query = useQuery({
    queryKey: ['profile', userId],
    queryFn: async (): Promise<ProfileRow | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select(PROFILE_COLUMNS)
        .eq('id', userId!)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return (data as ProfileRow) ?? null;
    },
    enabled: isLoaded && !!userId,
  });

  return {
    profile: query.data ?? null,
    status: !isLoaded
      ? ('idle' as const)
      : query.isPending
        ? ('loading' as const)
        : query.isError
          ? ('error' as const)
          : ('success' as const),
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

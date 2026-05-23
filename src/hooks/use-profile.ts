import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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

// --- MOCK PROFILE: used when auth is bypassed ---
const MOCK_PROFILE: ProfileRow = {
  id: 'mock-user-001',
  first_name: 'Kareem',
  last_name: 'Williams',
  profile_email: 'kareem.w@example.com',
  phone_number: '(718) 555-0142',
  profile_pic: null,
  stripe_id: null,
  created_at: '2024-09-15T00:00:00Z',
};

export function useProfile() {
  const { userId, isLoaded } = useAuth();
  const supabase = useSupabase();

  const query = useQuery({
    queryKey: ['profile', userId],
    queryFn: async (): Promise<ProfileRow | null> => {
      // Return mock data when auth is bypassed (no userId)
      if (!userId) return MOCK_PROFILE;

      const { data, error } = await supabase
        .from('profiles')
        .select(PROFILE_COLUMNS)
        .eq('id', userId!)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return (data as ProfileRow) ?? null;
    },
    enabled: isLoaded || !userId,
  });

  // When auth is bypassed, skip the idle/loading gate
  if (!userId) {
    return {
      profile: query.data ?? MOCK_PROFILE,
      status: 'success' as const,
      error: null,
      refetch: query.refetch,
    };
  }

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

export type ProfileUpdate = {
  first_name?: string | null;
  last_name?: string | null;
  profile_email?: string | null;
  phone_number?: string | null;
  profile_pic?: string | null;
};

export function useUpdateProfile() {
  const { userId } = useAuth();
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: ProfileUpdate) => {
      if (!userId) return;

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });
}

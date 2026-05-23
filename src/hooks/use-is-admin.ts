import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';

import { useSupabase } from '@/src/hooks/use-supabase';

export function useIsAdmin() {
  const { userId, isLoaded } = useAuth();
  const supabase = useSupabase();

  const query = useQuery({
    queryKey: ['is-mosque-admin', userId],
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.rpc('is_mosque_admin');
      if (error) throw new Error(error.message);
      return data ?? false;
    },
    enabled: isLoaded && !!userId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    isAdmin: query.data ?? false,
    isLoading: query.isPending && isLoaded && !!userId,
  };
}

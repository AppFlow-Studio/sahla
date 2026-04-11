import { useAuth } from '@clerk/clerk-expo';
import { createContext, useMemo } from 'react';

import { createClerkSupabaseClient, type TypedSupabaseClient } from '@/src/lib/supabase';

export const SupabaseContext = createContext<TypedSupabaseClient | null>(null);

/**
 * Creates one Supabase client per mount, bound to Clerk's `getToken`.
 * `getToken` is a stable reference from Clerk, so this memoises to a single
 * instance for the life of the auth session.
 */
export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  const client = useMemo(() => createClerkSupabaseClient(getToken), [getToken]);
  return <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>;
}

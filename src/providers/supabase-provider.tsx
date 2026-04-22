import { useSession } from '@clerk/clerk-expo';
import { createContext, useMemo } from 'react';

import {
  createAuthenticatedSupabaseClient,
  createSupabaseClient,
  type TypedSupabaseClient,
} from '@/src/lib/supabase';

export const SupabaseContext = createContext<TypedSupabaseClient | null>(null);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const { session } = useSession();

  const client = useMemo(
    () =>
      session
        ? createAuthenticatedSupabaseClient(session)
        : createSupabaseClient(),
    [session],
  );

  return <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>;
}

// AUTH DISABLED — Clerk dependency removed
// import { useAuth } from '@clerk/clerk-expo';
import { createContext, useMemo } from 'react';

import { createSupabaseClient, type TypedSupabaseClient } from '@/src/lib/supabase';

export const SupabaseContext = createContext<TypedSupabaseClient | null>(null);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => createSupabaseClient(), []);
  return <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>;
}

import { useContext } from 'react';

import type { TypedSupabaseClient } from '@/src/lib/supabase';
import { SupabaseContext } from '@/src/providers/supabase-provider';

/**
 * Typed accessor for the shared Supabase client. Throws if used outside the
 * provider — that's a programming error, not a runtime state we want to
 * handle silently.
 */
export function useSupabase(): TypedSupabaseClient {
  const client = useContext(SupabaseContext);
  if (!client) {
    throw new Error('useSupabase must be called inside <SupabaseProvider>');
  }
  return client;
}

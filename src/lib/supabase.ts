import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/database.types';
import { env } from './env';

export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Session-like object — matches the shape of Clerk's `Session`.
 * Kept minimal so the module doesn't import Clerk directly.
 */
type TokenSource = { getToken: () => Promise<string | null> };

/**
 * Authenticated Supabase client that injects a Clerk session token on every
 * request via the native third-party auth integration (post April 2025 —
 * replaces the deprecated JWT-template approach).
 */
export function createAuthenticatedSupabaseClient(
  session: TokenSource | null,
): TypedSupabaseClient {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_PUB_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    async accessToken() {
      return (await session?.getToken()) ?? null;
    },
  });
}

/** Anonymous Supabase client — used before the user is signed in. */
export function createSupabaseClient(): TypedSupabaseClient {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_PUB_KEY);
}

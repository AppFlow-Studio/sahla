import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/database.types';
import { env } from './env';

/**
 * Strongly-typed alias so call sites don't have to re-spell the `Database`
 * generic. Use this everywhere instead of the bare `SupabaseClient`.
 */
export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Clerk exposes `getToken` from its `useAuth()` hook; we take it as a
 * parameter (instead of importing Clerk here) so this file stays pure and
 * easy to test.
 */
type GetToken = (options?: { template?: string }) => Promise<string | null>;

/**
 * Builds a Supabase client that attaches a Clerk session JWT to every request.
 *
 * Supabase's `accessToken` option is called for each request, so Clerk's
 * internal token rotation (60s lifetime, refreshed every 50s) is transparent
 * to us — we just ask for the current token.
 *
 * Requires the "Clerk" third-party auth integration to be enabled in the
 * Supabase dashboard, and `"role": "authenticated"` to be present in the
 * Clerk session token customization.
 *
 * Docs: https://supabase.com/docs/guides/auth/third-party/clerk
 */
export function createClerkSupabaseClient(getToken: GetToken): TypedSupabaseClient {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_PUB_KEY, {
    auth: {
      // We rely entirely on Clerk for session state — turn off Supabase's
      // own auth persistence to avoid two competing sources of truth.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    async accessToken() {
      return (await getToken()) ?? null;
    },
  });
}

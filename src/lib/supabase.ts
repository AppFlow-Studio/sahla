import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/database.types';
import { env } from './env';

export type TypedSupabaseClient = SupabaseClient<Database>;

// AUTH DISABLED — Clerk-bound client commented out
// type GetToken = (options?: { template?: string }) => Promise<string | null>;
//
// export function createClerkSupabaseClient(getToken: GetToken): TypedSupabaseClient {
//   return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_PUB_KEY, {
//     auth: {
//       persistSession: false,
//       autoRefreshToken: false,
//       detectSessionInUrl: false,
//     },
//     async accessToken() {
//       return (await getToken()) ?? null;
//     },
//   });
// }

export function createSupabaseClient(): TypedSupabaseClient {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_PUB_KEY);
}

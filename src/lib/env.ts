/**
 * Typed environment variable reader.
 *
 * Every required var is eagerly validated at module import time so a missing
 * key crashes the dev build immediately instead of surfacing as a confusing
 * downstream error (e.g. "invalid Clerk publishable key" halfway through
 * sign-in).
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[env] Missing required environment variable: ${name}. ` +
        `Add it to your .env file (see .env.example) and rebuild the dev client.`,
    );
  }
  return value;
}

export const env = {
  CLERK_PUBLISHABLE_KEY: required('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'),
  SUPABASE_URL: required('EXPO_PUBLIC_SUPABASE_URL'),
  // Supabase renamed "anon key" to "publishable key" in 2025 — the env var
  // name here tracks the newer naming used in the dashboard.
  SUPABASE_PUB_KEY: required('EXPO_PUBLIC_SUPABASE_PUB_KEY'),
} as const;

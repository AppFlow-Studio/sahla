import Constants from 'expo-constants';

// Each process.env.X here is a literal Metro can statically replace.
const raw = {
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_PUB_KEY: process.env.EXPO_PUBLIC_SUPABASE_PUB_KEY,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
} as const;

function required<K extends keyof typeof raw>(name: K): string {
  const value = raw[name];
  if (!value) {
    throw new Error(
      `[env] Missing required environment variable: ${name}. ` +
        `Add it to your .env file (see .env.example) and rebuild the dev client.`,
    );
  }
  return value;
}

const extra = Constants.expoConfig?.extra as { devBypassAuth?: boolean } | undefined;
const devBypassAuth =
  process.env.EXPO_PUBLIC_DEV_BYPASS_AUTH === 'true' || extra?.devBypassAuth === true;

export const env = {
  CLERK_PUBLISHABLE_KEY: required('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'),
  SUPABASE_URL: required('EXPO_PUBLIC_SUPABASE_URL'),
  SUPABASE_PUB_KEY: required('EXPO_PUBLIC_SUPABASE_PUB_KEY'),
  SUPABASE_ANON_KEY: required('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  STRIPE_PUBLISHABLE_KEY: required('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
  DEV_BYPASS_AUTH: devBypassAuth,
} as const;
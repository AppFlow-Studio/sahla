import '../global.css';

import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ThemeRoot } from '@/src/components/theme-root';
import { env } from '@/src/lib/env';
import { ConfigProvider } from '@/src/providers/config-provider';
import { SupabaseProvider } from '@/src/providers/supabase-provider';

export const unstable_settings = {
  anchor: '(main)',
};

/**
 * Auth-aware navigator. Uses Expo Router v6's `Stack.Protected` to gate the
 * `(main)` and `(auth)` groups on Clerk's session state. The `isLoaded` check
 * prevents a flash of the sign-in screen during cold boot while Clerk
 * rehydrates its session from SecureStore.
 */
function RootNavigator() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    // Returning null keeps the native splash visible until Clerk is ready.
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!isSignedIn}>
        <Stack.Screen name="(main)" />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={env.CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <SupabaseProvider>
        <ConfigProvider>
          <ThemeRoot>
            <RootNavigator />
            <StatusBar style="auto" />
          </ThemeRoot>
        </ConfigProvider>
      </SupabaseProvider>
    </ClerkProvider>
  );
}

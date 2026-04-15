import '../global.css';

import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { Amiri_400Regular } from '@expo-google-fonts/amiri';
import { PlayfairDisplay_500Medium } from '@expo-google-fonts/playfair-display';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { ThemeRoot } from '@/src/components/theme-root';
import { env } from '@/src/lib/env';
import { ConfigProvider } from '@/src/providers/config-provider';
import { SupabaseProvider } from '@/src/providers/supabase-provider';

export const unstable_settings = {
  anchor: '(onboarding)',
};

/**
 * Auth-aware navigator. Uses Expo Router v6's `Stack.Protected` to gate the
 * `(main)` and `(auth)` groups on Clerk's session state. The `isLoaded` check
 * prevents a flash of the sign-in screen during cold boot while Clerk
 * rehydrates its session from SecureStore.
 */
function RootNavigator() {
  const { isLoaded } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // TEMP: while building onboarding, always force into the onboarding flow.
  useEffect(() => {
    if (!isLoaded) return;
    if (segments[0] !== '(onboarding)') {
      router.replace('/(onboarding)/welcome');
    }
  }, [isLoaded, segments, router]);

  if (!isLoaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(main)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_500Medium,
    Amiri_400Regular,
  });

  if (!fontsLoaded) return null;

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

import '../global.css';

// AUTH DISABLED — Clerk sign-in commented out
// import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
// import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { CormorantGaramond_400Regular } from '@expo-google-fonts/cormorant-garamond';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
} from '@expo-google-fonts/playfair-display';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeRoot } from '@/src/components/theme-root';
// import { env } from '@/src/lib/env';
import { ConfigProvider } from '@/src/providers/config-provider';
import { DonationProvider } from '@/src/providers/donation-provider';
import { SupabaseProvider } from '@/src/providers/supabase-provider';
import {useEffect} from 'react';
import {Inter_800ExtraBold,useFonts} from '@expo-google-fonts/inter';
import { PlayfairDisplay_500Medium, PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
  anchor: '(onboarding)',
};
SplashScreen.preventAutoHideAsync();
/**
 * Auth-aware navigator. Uses Expo Router v6's `Stack.Protected` to gate the
 * `(main)` and `(auth)` groups on Clerk's session state. The `isLoaded` check
 * prevents a flash of the sign-in screen during cold boot while Clerk
 * rehydrates its session from SecureStore.
 */
function RootNavigator() {
  const { isLoaded, isSignedIn } = useAuth();
  const devBypass = __DEV__ && env.DEV_BYPASS_AUTH;

  if (!isLoaded) {
    // Returning null keeps the native splash visible until Clerk is ready.
    return null;
  }

  const showMain = !!isSignedIn || devBypass;
  const showAuth = !isSignedIn && !devBypass;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={showMain}>
        <Stack.Screen name="(main)" />
        <Stack.Screen
          name="content/[id]"
          options={{
            presentation: 'transparentModal',
            headerShown: false,
            animation: 'none',
          }}
        />
      </Stack.Protected>
      <Stack.Protected guard={showAuth}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    CormorantGaramond_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SupabaseProvider>
      <ConfigProvider>
        <ThemeRoot>
          <DonationProvider>
            <RootNavigator />
            <StatusBar style="auto" />
          </DonationProvider>
        </ThemeRoot>
      </ConfigProvider>
    </SupabaseProvider>
  );
}

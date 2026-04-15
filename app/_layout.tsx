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
import {useEffect} from 'react';
import {Inter_800ExtraBold,useFonts} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
export const unstable_settings = {
  anchor: '(main)',
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
      </Stack.Protected>
      <Stack.Protected guard={showAuth}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded,fontError] = useFonts({
    Inter_800ExtraBold
  })
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  },[fontsLoaded,fontError])
  if (!fontsLoaded && !fontError) {
    return null;
  }
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

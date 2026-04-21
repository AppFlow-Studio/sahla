import '../global.css';

import { ClerkLoaded, ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
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

import { ThemeRoot } from '@/src/components/theme-root';
import { env } from '@/src/lib/env';
import { ConfigProvider } from '@/src/providers/config-provider';
import { DonationProvider } from '@/src/providers/donation-provider';
import { SupabaseProvider } from '@/src/providers/supabase-provider';
import { useOnboardingStore } from '@/src/stores/onboarding-store';

SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
  anchor: '(onboarding)',
};

function RootNavigator() {
  const { isSignedIn, isLoaded } = useAuth();
  const onboardingComplete = useOnboardingStore((s) => s.complete);

  if (!isLoaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {isSignedIn ? (
        <Stack.Screen name="(main)" />
      ) : !onboardingComplete ? (
        <Stack.Screen name="(onboarding)" />
      ) : (
        <Stack.Screen name="(auth)" />
      )}
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
    <ClerkProvider publishableKey={env.CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ClerkLoaded>
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
      </ClerkLoaded>
    </ClerkProvider>
  );
}

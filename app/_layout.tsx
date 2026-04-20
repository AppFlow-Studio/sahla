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

import { ThemeRoot } from '@/src/components/theme-root';
// import { env } from '@/src/lib/env';
import { ConfigProvider } from '@/src/providers/config-provider';
import { DonationProvider } from '@/src/providers/donation-provider';
import { SupabaseProvider } from '@/src/providers/supabase-provider';

SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
  anchor: '(main)',
};

function RootNavigator() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(main)" />
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

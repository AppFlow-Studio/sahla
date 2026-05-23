import '../global.css';

import { LogBox, Platform } from 'react-native';
LogBox.ignoreLogs(['forwardRef render functions']);

// Configure how notifications behave when the app is in the foreground.
// Wrapped in try/catch so the app doesn't crash before a fresh EAS build
// links the native ExpoPushTokenManager module.
if (Platform.OS !== 'web') {
  try {
    const Notifications = require('expo-notifications') as typeof import('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    // Native module not yet available — will work after next EAS build.
  }
}

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
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const StripeProvider =
  Platform.OS !== 'web'
    ? require('@stripe/stripe-react-native').StripeProvider
    : ({ children }: { children: React.ReactNode }) => children;

import { ThemeRoot } from '@/src/components/theme-root';
import { env } from '@/src/lib/env';
import { ConfigProvider } from '@/src/providers/config-provider';
import { DonationProvider } from '@/src/providers/donation-provider';
import { StripeAccountProvider, useStripeAccount } from '@/src/providers/stripe-account-provider';
import { QueryProvider } from '@/src/providers/query-provider';
import { SupabaseProvider } from '@/src/providers/supabase-provider';
import { useOnboardingSync } from '@/src/hooks/use-onboarding-sync';
import { useOnboardingStore } from '@/src/stores/onboarding-store';

SplashScreen.preventAutoHideAsync();

function StripeProviderWithConnect({ children }: { children: React.ReactNode }) {
  const { stripeAccountId } = useStripeAccount();
  return (
    <StripeProvider
      publishableKey={env.STRIPE_PUBLISHABLE_KEY}
      stripeAccountId={stripeAccountId}
      merchantIdentifier="merchant.com.sahla"
    >
      {children}
    </StripeProvider>
  );
}

export const unstable_settings = {
  anchor: '(auth)',
};

/**
 * Auth-aware navigator. Uses Expo Router v6's `Stack.Protected` to gate the
 * `(main)` and `(auth)` groups on Clerk's session state. The `isLoaded` check
 * prevents a flash of the sign-in screen during cold boot while Clerk
 * rehydrates its session from SecureStore.
 */
function RootNavigator() {
  const { isLoaded, isSignedIn } = useAuth();
  const onboardingComplete = useOnboardingStore((s) => s.complete);
  const devBypass = __DEV__ && env.DEV_BYPASS_AUTH;

  // Sync onboarding state from Clerk metadata (handles new-device scenario)
  useOnboardingSync();

  if (!isLoaded) {
    // Returning null keeps the native splash visible until Clerk is ready.
    return null;
  }

  const authenticated = !!isSignedIn || devBypass;
  const showAuth = !authenticated;
  const showOnboarding = authenticated && !onboardingComplete && !devBypass;
  const showMain = authenticated && (onboardingComplete || devBypass);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={showMain}>
        <Stack.Screen name="(main)" />
        <Stack.Screen name="(personalization)" />
        <Stack.Screen
          name="content/[id]"
          options={{
            presentation: 'transparentModal',
            headerShown: false,
            animation: 'none',
          }}
        />
        <Stack.Screen
          name="change-password"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="advertise"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="advertise-apply"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
      </Stack.Protected>
      <Stack.Protected guard={showOnboarding}>
        <Stack.Screen name="(onboarding)" />
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
    UthmanicHafs: require('../assets/fonts/UthmanicHafs_V22.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ClerkProvider publishableKey={env.CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ClerkLoaded>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <QueryProvider>
            <SupabaseProvider>
              <ConfigProvider>
                <StripeAccountProvider>
                  <StripeProviderWithConnect>
                    <ThemeRoot>
                      <DonationProvider>
                        <RootNavigator />
                        <StatusBar style="auto" />
                      </DonationProvider>
                    </ThemeRoot>
                  </StripeProviderWithConnect>
                </StripeAccountProvider>
              </ConfigProvider>
            </SupabaseProvider>
          </QueryProvider>
        </GestureHandlerRootView>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

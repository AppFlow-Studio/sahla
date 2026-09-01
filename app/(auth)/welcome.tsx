import { useAuth } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, Text, View } from 'react-native';

import { useGuestStore } from '@/src/stores/guest-store';
import { useOnboardingStore } from '@/src/stores/onboarding-store';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import Mosque from '@/assets/onboarding/mosque.svg';
import { useFontFamily } from '@/src/hooks/use-font-family';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

const ARABIC = 'Amiri_400Regular';

const triplet = (t: string) => `rgb(${t.replace(/ /g, ',')})`;

function Halo({
  c1,
  c2,
  c3,
  style,
}: {
  c1: string;
  c2: string;
  c3: string;
  style?: any;
}) {
  return (
    <Animated.View
      pointerEvents="none"
      className="absolute inset-x-0 items-center"
      style={[{ top: '18%' }, style]}
    >
      <Svg width={360} height={360} viewBox="0 0 360 360">
        <Circle cx="180" cy="180" r="155" fill={c1} opacity={0.45} />
        <Circle cx="180" cy="180" r="130" fill={c2} opacity={0.6} />
        <Circle cx="180" cy="180" r="105" fill={c3} opacity={0.7} />
      </Svg>
    </Animated.View>
  );
}

export default function WelcomeScreen() {
  const enterGuest = useGuestStore((s) => s.enterGuest);
  const router = useRouter();
  const { t } = useTranslation();
  const config = useMasjidConfig();
  const fonts = useFontFamily();
  const { signOut, isSignedIn } = useAuth();
  const resetOnboarding = useOnboardingStore((s) => s.reset);

  const mosqueY = useSharedValue(200);
  const mosqueOpacity = useSharedValue(0);
  const haloPulse = useSharedValue(1);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    mosqueOpacity.value = withDelay(
      700,
      withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) }),
    );
    mosqueY.value = withDelay(
      700,
      withTiming(0, { duration: 1400, easing: Easing.out(Easing.cubic) }),
    );
    haloPulse.value = withDelay(
      2100,
      withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        ),
        2,
        false,
      ),
    );
    textOpacity.value = withDelay(300, withTiming(1, { duration: 700 }));
  }, [mosqueOpacity, mosqueY, haloPulse, textOpacity]);

  const mosqueStyle = useAnimatedStyle(() => ({
    opacity: mosqueOpacity.value,
    transform: [{ translateY: mosqueY.value }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: haloPulse.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));

  return (
    <View className="flex-1 bg-onboarding-bg">
      <Halo
        c1={triplet(config.colors.onboardingHalo1)}
        c2={triplet(config.colors.onboardingHalo2)}
        c3={triplet(config.colors.onboardingHalo3)}
        style={haloStyle}
      />

      <Animated.View
        pointerEvents="none"
        className="absolute inset-x-0 bottom-0"
        style={[{ height: '66%' }, mosqueStyle]}
      >
        {/* mosque.svg draws in `currentColor`; the silhouette is the tenant's
            layering color so it reads as depth against its own background. */}
        <Mosque
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMax meet"
          color={triplet(config.colors.onboardingLayer)}
        />
      </Animated.View>

      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <Animated.View className="items-center pt-2" style={textStyle}>
          {__DEV__ && (
            <Text
              onPress={() => {
                console.log('[DEV] Logout pressed, isSignedIn:', isSignedIn);
                Alert.alert(t('auth.devLogoutTitle'), t('auth.devLogoutMessage', { signedIn: isSignedIn }), [
                  { text: t('common.cancel') },
                  {
                    text: t('auth.devSignOutAndReset'),
                    style: 'destructive',
                    onPress: async () => {
                      console.log('[DEV] Signing out...');
                      resetOnboarding();
                      try {
                        await signOut();
                        console.log('[DEV] Signed out');
                      } catch (err) {
                        console.warn('[DEV] Sign out error:', err);
                      }
                    },
                  },
                ]);
              }}
              style={{
                fontSize: 12,
                color: triplet(config.colors.danger),
                fontWeight: '600',
                marginBottom: 8,
                padding: 8,
              }}
            >
              {t('auth.devSignOutReset')}
            </Text>
          )}
          <Text
            className="text-onboarding-surface"
            style={{ fontFamily: ARABIC, fontSize: 20 }}
          >
            السلام عليكم
          </Text>
          <Text
            className="text-onboarding-surface"
            style={{ fontFamily: fonts.display, fontSize: 30, fontWeight: '500', marginTop: 6 }}
          >
            {t('auth.welcome')}
          </Text>
          <Text
            className="text-onboarding-accent"
            style={{ fontSize: 12, marginTop: 10, letterSpacing: 0.3 }}
          >
            {config.displayName}
          </Text>
        </Animated.View>

        <View className="flex-1" />

        <Animated.View style={[{ paddingHorizontal: 59 }, textStyle]} className="pb-2">
          <Pressable
            onPress={() => router.push('/(auth)/create-account')}
            className="h-[38px] items-center justify-center rounded-full bg-onboarding-surface active:opacity-90"
          >
            <Text className="text-onboarding-bg" style={{ fontSize: 14, fontWeight: '600' }}>
              {t('auth.getStarted')}
            </Text>
          </Pressable>
          <View className="mt-4 flex-row justify-center">
            <Text className="text-onboarding-surface/50" style={{ fontSize: 12 }}>
              {t('auth.alreadyMember')}
            </Text>
            <Link
              href="/(auth)/sign-in"
              className="text-onboarding-accent"
              style={{ fontSize: 12, fontWeight: '500' }}
            >
              {t('auth.signIn')}
            </Link>
          </View>
          {/* Browsing without an account: prayer times, programs, the reels
              feed and the Quran all work signed out, so requiring registration
              to see any of it would be gating features that don't need it. */}
          <Pressable
            onPress={enterGuest}
            hitSlop={8}
            accessibilityRole="button"
            className="mt-5 items-center py-2 active:opacity-60"
          >
            <Text
              className="text-onboarding-surface/60"
              style={{ fontSize: 12, fontWeight: '500', textDecorationLine: 'underline' }}
            >
              {t('auth.browseAsGuest')}
            </Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

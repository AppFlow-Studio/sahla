import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import Mandala from '@/assets/onboarding/mandala.svg';
import { useFontFamily } from '@/src/hooks/use-font-family';
import { useUserPreferences } from '@/src/hooks/use-user-preferences';
import { useOnboardingStore } from '@/src/stores/onboarding-store';

const MANDALA_SIZE = 402;
const HALO_SIZE = 324;
const DISC_RADIUS = 112;

// Cream variant of the gold halo: same gold radial bloom but a cream center
// disc that blends into the personalization background, rather than the dark
// green disc used by the onboarding completion screen.
function CreamHalo() {
  return (
    <Svg width={HALO_SIZE} height={HALO_SIZE} viewBox="0 0 324 324">
      <Defs>
        <RadialGradient id="haloGlowCream" cx="162" cy="162" r="162" gradientUnits="userSpaceOnUse">
          <Stop offset="0.62" stopColor="#B8922A" stopOpacity="0" />
          <Stop offset="0.72" stopColor="#B8922A" stopOpacity="0.22" />
          <Stop offset="0.88" stopColor="#B8922A" stopOpacity="0.05" />
          <Stop offset="1" stopColor="#B8922A" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx="162" cy="162" r="162" fill="url(#haloGlowCream)" />
      <Circle cx="162" cy="162" r={DISC_RADIUS} fill="#FFFBF2" />
    </Svg>
  );
}

export default function AllSetScreen() {
  const router = useRouter();
  const { user } = useUser();
  const fonts = useFontFamily();
  const { t } = useTranslation();
  const { markPersonalizationComplete } = useUserPreferences();

  // Reaching this screen means the personalization flow is finished — stamp it
  // server-side so completion follows the user across devices.
  useEffect(() => {
    markPersonalizationComplete.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const storedName = useOnboardingStore((s) => s.firstName);
  const firstName =
    user?.firstName?.trim() ||
    storedName.trim().split(/\s+/)[0] ||
    t('personalization.allSetDefaultName');

  // Mandala rotates continuously — 60s per revolution, linear, infinite. Slow
  // enough to feel meditative rather than busy.
  const rotation = useSharedValue(0);
  // Halo + name fade in first, then the bottom subtitle + button. Layered so
  // the screen "settles" rather than appearing all at once.
  const haloOpacity = useSharedValue(0);
  const haloScale = useSharedValue(0.92);
  const bottomOpacity = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 60000, easing: Easing.linear }),
      -1,
      false,
    );
    haloOpacity.value = withDelay(300, withTiming(1, { duration: 700 }));
    haloScale.value = withDelay(
      300,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) }),
    );
    bottomOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
  }, [rotation, haloOpacity, haloScale, bottomOpacity]);

  const mandalaStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: haloOpacity.value,
    transform: [{ scale: haloScale.value }],
  }));
  const bottomStyle = useAnimatedStyle(() => ({
    opacity: bottomOpacity.value,
  }));

  // Tapping "Explore" fades a green layer (the same green the notification
  // takeover uses) over this cream screen, THEN navigates — so the hand-off into
  // `(main)` lands already-green and the onboarding reads as one continuous
  // motion into the notifications prompt rather than a cream→green jump.
  const leave = useSharedValue(0);
  const leaveStyle = useAnimatedStyle(() => ({ opacity: leave.value }));
  const goToApp = () => router.replace('/(main)/discover');
  const onExplore = () => {
    leave.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) }, (done) => {
      if (done) runOnJS(goToApp)();
    });
  };

  return (
    <View className="flex-1 bg-onboarding-surface">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center">
          <View
            style={{
              width: MANDALA_SIZE,
              height: MANDALA_SIZE,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Animated.View style={[{ position: 'absolute', opacity: 0.35 }, mandalaStyle]}>
              <Mandala width={MANDALA_SIZE} height={MANDALA_SIZE} />
            </Animated.View>

            <Animated.View
              style={[
                {
                  width: HALO_SIZE,
                  height: HALO_SIZE,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                haloStyle,
              ]}
            >
              <View style={{ position: 'absolute' }}>
                <CreamHalo />
              </View>

              <View style={{ alignItems: 'center' }}>
                <Text
                  className="text-onboarding-bg"
                  style={{ fontFamily: fonts.display, fontSize: 22, lineHeight: 28 }}
                >
                  {t('personalization.allSetTitle')}
                </Text>
                <Text
                  className="text-onboarding-bg mt-1"
                  style={{ fontFamily: fonts.display, fontSize: 22, lineHeight: 28 }}
                >
                  {firstName}
                </Text>
              </View>
            </Animated.View>
          </View>
        </View>

        <Animated.View style={[{ paddingHorizontal: 59, paddingBottom: 32 }, bottomStyle]}>
          <Text
            className="text-onboarding-bg/60 mb-5 text-center"
            style={{ fontSize: 12, lineHeight: 16 }}
          >
            {t('personalization.allSetSubtitle')}
          </Text>
          <Pressable
            onPress={onExplore}
            className="h-[43px] items-center justify-center rounded-full bg-onboarding-bg active:opacity-90"
          >
            <Text className="text-onboarding-surface" style={{ fontSize: 14, fontWeight: '600' }}>
              {t('personalization.allSetExplore')}
            </Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>

      {/* Green wipe that covers the cream screen on "Explore", so the next
          surface (the notifications takeover) appears already-green. */}
      <Animated.View
        pointerEvents="none"
        className="absolute inset-0 bg-onboarding-bg"
        style={leaveStyle}
      />
    </View>
  );
}

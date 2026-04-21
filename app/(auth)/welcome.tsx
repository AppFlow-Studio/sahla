import { Link, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
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
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

const SERIF = 'PlayfairDisplay_500Medium';
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
  const router = useRouter();
  const config = useMasjidConfig();

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
        <Mosque
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMax meet"
          color="#071F18"
        />
      </Animated.View>

      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <Animated.View className="items-center pt-2" style={textStyle}>
          <Text
            className="text-onboarding-surface"
            style={{ fontFamily: ARABIC, fontSize: 20 }}
          >
            السلام عليكم
          </Text>
          <Text
            className="text-onboarding-surface"
            style={{ fontFamily: SERIF, fontSize: 30, fontWeight: '500', marginTop: 6 }}
          >
            Welcome
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
              Get Started
            </Text>
          </Pressable>
          <View className="mt-4 flex-row justify-center">
            <Text className="text-onboarding-surface/50" style={{ fontSize: 12 }}>
              Already a member?{' '}
            </Text>
            <Link
              href="/(auth)/sign-in"
              className="text-onboarding-accent"
              style={{ fontSize: 12, fontWeight: '500' }}
            >
              Sign In
            </Link>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

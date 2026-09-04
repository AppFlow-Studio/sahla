import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import Mandala from '@/assets/onboarding/mandala.svg';
import { useFontFamily } from '@/src/hooks/use-font-family';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useAutoStatusBarStyle } from '@/src/hooks/use-status-bar-style';
import { useOnboardingStore } from '@/src/stores/onboarding-store';

const MANDALA_SIZE = 402;
const HALO_SIZE = 324;
const DISC_RADIUS = 112;

function GoldHalo() {
  const { colors } = useMasjidConfig();
  const accentRgb = `rgb(${colors.onboardingAccent.replace(/ /g, ',')})`;
  const bgRgb = `rgb(${colors.onboardingBackground.replace(/ /g, ',')})`;

  return (
    <Svg width={HALO_SIZE} height={HALO_SIZE} viewBox="0 0 324 324">
      <Defs>
        <RadialGradient id="haloGlow" cx="162" cy="162" r="162" gradientUnits="userSpaceOnUse">
          <Stop offset="0.62" stopColor={accentRgb} stopOpacity="0" />
          <Stop offset="0.72" stopColor={accentRgb} stopOpacity="0.22" />
          <Stop offset="0.88" stopColor={accentRgb} stopOpacity="0.05" />
          <Stop offset="1" stopColor={accentRgb} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx="162" cy="162" r="162" fill="url(#haloGlow)" />
      <Circle cx="162" cy="162" r={DISC_RADIUS} fill={bgRgb} />
    </Svg>
  );
}

export default function WelcomeFullScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const config = useMasjidConfig();
  const fonts = useFontFamily();
  useAutoStatusBarStyle(config.colors.onboardingLayer);
  const storedName = useOnboardingStore((s) => s.firstName);
  const firstName = storedName.trim().split(/\s+/)[0] || t('onboarding.friendFallback');

  const surfaceRgb = `rgba(${config.colors.onboardingSurface.replace(/ /g, ',')}, 0.5)`;
  const bgRgb = `rgb(${config.colors.onboardingBackground.replace(/ /g, ',')})`;

  return (
    <View className="flex-1 bg-onboarding-layer">
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
            <View style={{ position: 'absolute' }}>
              <Mandala width={MANDALA_SIZE} height={MANDALA_SIZE} />
            </View>

            <View
              style={{
                width: HALO_SIZE,
                height: HALO_SIZE,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View style={{ position: 'absolute' }}>
                <GoldHalo />
              </View>

              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: surfaceRgb }}>
                  {t('onboarding.allSet')}
                </Text>

                <View style={{ marginTop: 18, alignItems: 'center' }}>
                  <Text
                    className="text-onboarding-surface"
                    style={{ fontFamily: fonts.displayRegular, fontSize: 30, lineHeight: 35 }}
                  >
                    {t('onboarding.welcome')}
                  </Text>
                  <Text
                    className="text-onboarding-surface"
                    style={{ fontFamily: fonts.displayRegular, fontSize: 30, lineHeight: 35 }}
                  >
                    {firstName}
                  </Text>
                </View>

                <Text
                  className="text-onboarding-accent"
                  style={{ fontSize: 12, marginTop: 18 }}
                >
                  {config.displayName}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 59, paddingBottom: 24 }}>
          <Pressable
            onPress={() => router.replace('/(main)')}
            className="h-[37px] items-center justify-center rounded-full bg-onboarding-surface active:opacity-90"
          >
            <Text
              className="text-onboarding-bg"
              style={{ fontSize: 14, fontWeight: '600' }}
            >
              {t('onboarding.enter')}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

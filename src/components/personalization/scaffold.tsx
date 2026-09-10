import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFontFamily } from '@/src/hooks/use-font-family';
import { BackButton } from '@/src/components/ui/back-button';
import { useIsRTL } from '@/src/hooks/use-is-rtl';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useAutoStatusBarStyle } from '@/src/hooks/use-status-bar-style';

type PersonalizationScaffoldProps = {
  step: number;
  totalSteps?: number;
  title: React.ReactNode;
  body?: string;
  children?: React.ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  /** When omitted, the Skip button is hidden. */
  onSkip?: () => void;
};

/**
 * Scaffold for the 5-step personalization flow. Mirrors `OnboardingScaffold`
 * structurally, but uses the inverted palette (cream surface, dark-green ink)
 * and a single continuous progress bar with a gold filled portion — per the
 * Figma design (node 1:538).
 */
export function PersonalizationScaffold({
  step,
  totalSteps = 5,
  title,
  body,
  children,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  onSkip,
}: PersonalizationScaffoldProps) {
  const router = useRouter();
  const fonts = useFontFamily();
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const { colors } = useMasjidConfig();
  useAutoStatusBarStyle(colors.onboardingSurface);
  const progress = Math.max(0, Math.min(1, step / totalSteps));

  return (
    <View className="flex-1 bg-onboarding-surface">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-row items-center justify-between px-5 pt-2">
          <BackButton
            color="rgba(10,38,30,0.6)"
            style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}
          />
          {onSkip ? (
            <Pressable onPress={onSkip} hitSlop={12} className="active:opacity-60">
              <Text style={{ fontSize: 13, color: 'rgba(10,38,30,0.6)' }}>
                {t('personalization.skip')}
              </Text>
            </Pressable>
          ) : (
            <View />
          )}
        </View>

        <View className="mt-3 px-5">
          <View className="h-[2px] w-full overflow-hidden rounded-full bg-onboarding-bg/15">
            <View
              className="h-full rounded-full bg-onboarding-accent"
              style={{ width: `${progress * 100}%` }}
            />
          </View>
          <Text
            className="mt-3 text-onboarding-bg/60"
            style={{ fontSize: 11, letterSpacing: 0.6 }}
          >
            {t('personalization.stepOf', { step, total: totalSteps })}
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 32, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <Text
            className="text-onboarding-bg"
            style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 35 }}
          >
            {title}
          </Text>
          {body && (
            <Text
              className="mt-5 text-onboarding-bg/60"
              style={{ fontSize: 13, lineHeight: 18 }}
            >
              {body}
            </Text>
          )}
          <View className="mt-8">{children}</View>
        </ScrollView>

        <View className="px-9 pb-6">
          <Pressable
            onPress={onPrimary}
            disabled={primaryDisabled}
            className="h-[43px] items-center justify-center rounded-full bg-onboarding-bg active:opacity-90"
            style={{ opacity: primaryDisabled ? 0.4 : 1 }}
          >
            <Text className="text-onboarding-surface" style={{ fontSize: 14, fontWeight: '600' }}>
              {primaryLabel}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFontFamily } from '@/src/hooks/use-font-family';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { BackButton } from '@/src/components/ui/back-button';
import { OnboardingPattern } from './onboarding-pattern';

type OnboardingScaffoldProps = {
  step: number;
  totalSteps?: number;
  title: React.ReactNode;
  body?: string;
  children?: React.ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  footerNote?: string;
  scrollable?: boolean;
};

export function OnboardingScaffold({
  step,
  totalSteps = 4,
  title,
  body,
  children,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  secondaryLabel,
  onSecondary,
  footerNote,
  scrollable = false,
}: OnboardingScaffoldProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const config = useMasjidConfig();
  const fonts = useFontFamily();
  const surfaceRgb = `rgba(${config.colors.onboardingSurface.replace(/ /g, ',')}, 0.6)`;
  const resolvedFooterNote = footerNote ?? t('onboarding.footerTerms');

  const content = (
    <>
      <View style={{ marginTop: 48 }}>
        <Text
          className="text-onboarding-surface"
          style={{ fontFamily: fonts.display, fontSize: 30, fontWeight: '500', lineHeight: 36 }}
        >
          {title}
        </Text>
        {body && (
          <Text
            className="text-onboarding-surface/80 mt-6"
            style={{ fontSize: 11, lineHeight: 15 }}
          >
            {body}
          </Text>
        )}
      </View>
      {children}
    </>
  );

  return (
    <View className="flex-1 bg-onboarding-bg z-100">
      <View pointerEvents="none" className="absolute inset-x-0 top-0" style={{ height: '30%' }}>
        <OnboardingPattern />
      </View>

      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-row items-center px-5 pt-2">
          <BackButton
            color={surfaceRgb}
            style={{
              marginEnd: 12,
              width: 24,
              height: 24,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
          <View className="flex-1 flex-row" style={{ gap: 6 }}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View
                key={i}
                className={i < step ? 'bg-onboarding-accent' : 'bg-onboarding-surface/20'}
                style={{ flex: 1, height: 2, borderRadius: 1 }}
              />
            ))}
          </View>
          <Text className="text-onboarding-surface/40 ms-3" style={{ fontSize: 8 }}>
            {t('onboarding.stepOf', { step, total: totalSteps })}
          </Text>
        </View>

        {scrollable ? (
          <ScrollView
            className="flex-1 px-5"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {content}
          </ScrollView>
        ) : (
          <View className="flex-1 px-5">
            {content}
            <View className="flex-1" />
          </View>
        )}

        <View className="px-5 pb-6" style={{ paddingHorizontal: 36 }}>
          <Pressable
            onPress={onPrimary}
            disabled={primaryDisabled}
            className="h-[43px] items-center justify-center rounded-full bg-onboarding-surface active:opacity-90"
            style={{ opacity: primaryDisabled ? 0.4 : 1 }}
          >
            <Text className="text-onboarding-bg" style={{ fontSize: 14, fontWeight: '600' }}>
              {primaryLabel}
            </Text>
          </Pressable>
          {secondaryLabel && onSecondary && (
            <Pressable onPress={onSecondary} className="mt-4 items-center active:opacity-70">
              <Text className="text-onboarding-surface" style={{ fontSize: 14 }}>
                {secondaryLabel}
              </Text>
            </Pressable>
          )}
          <Text
            className="text-onboarding-surface/20 mt-6 text-center"
            style={{ fontSize: 10 }}
          >
            {footerNote !== undefined ? (
              resolvedFooterNote
            ) : (
              <>
                {t('auth.agreeLead')}
                <Text
                  style={{ textDecorationLine: 'underline' }}
                  onPress={() => router.push('/legal/terms')}
                >
                  {t('auth.agreeTerms')}
                </Text>
                {t('auth.agreeMid')}
                <Text
                  style={{ textDecorationLine: 'underline' }}
                  onPress={() => router.push('/legal/privacy')}
                >
                  {t('auth.agreePrivacy')}
                </Text>
                {t('auth.agreeTail')}
              </>
            )}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

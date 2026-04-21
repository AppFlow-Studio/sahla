import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Pattern from '@/assets/onboarding/pattern.svg';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

const SERIF = 'PlayfairDisplay_500Medium';

type OnboardingScaffoldProps = {
  step: number;
  totalSteps?: number;
  title: React.ReactNode;
  body?: string;
  children?: React.ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  footerNote?: string;
};

export function OnboardingScaffold({
  step,
  totalSteps = 4,
  title,
  body,
  children,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  footerNote = 'By continuing you agree to our Terms of Service',
}: OnboardingScaffoldProps) {
  const router = useRouter();
  const config = useMasjidConfig();
  const accentHex = `rgb(${config.colors.onboardingAccent.replace(/ /g, ',')})`;

  return (
    <View className="flex-1 bg-onboarding-bg">
      <View pointerEvents="none" className="absolute inset-x-0 top-0" style={{ height: '30%' }}>
        <Pattern width="100%" height="100%" preserveAspectRatio="xMidYMin slice" />
      </View>

      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-row items-center px-5 pt-2">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="mr-3 h-6 w-6 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={20} color="rgba(255,251,242,0.6)" />
          </Pressable>
          <View className="flex-1 flex-row" style={{ gap: 6 }}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View
                key={i}
                className={i < step ? 'bg-onboarding-accent' : 'bg-onboarding-surface/20'}
                style={{ flex: 1, height: 2, borderRadius: 1 }}
              />
            ))}
          </View>
          <Text className="text-onboarding-surface/40 ml-3" style={{ fontSize: 8 }}>
            STEP {step} OF {totalSteps}
          </Text>
        </View>

        <View className="flex-1 px-5">
          <View className="mt-48">
            <Text
              className="text-onboarding-surface"
              style={{ fontFamily: SERIF, fontSize: 30, fontWeight: '500', lineHeight: 36 }}
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
            {children}
          </View>

          <View className="flex-1" />

          <View className="pb-6" style={{ paddingHorizontal: 36 }}>
            <Pressable
              onPress={onPrimary}
              className="h-[43px] items-center justify-center rounded-full bg-onboarding-surface active:opacity-90"
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
              {footerNote}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

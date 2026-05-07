import { useUser } from '@clerk/clerk-expo';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useOnboardingStore } from '@/src/stores/onboarding-store';
import { usePrayerTimes } from '@/src/hooks/use-prayer-times';
import { PrayerTimesBar } from './prayer-times-bar';

const patternSource = require('@/assets/islamic-pattern.png');

export function HomeHeader() {
  const insets = useSafeAreaInsets();
  const { colors, clerkOrgId } = useMasjidConfig();
  const { user } = useUser();
  const storedFirstName = useOnboardingStore((s) => s.firstName);
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;
  const { currentTime, hijriDate, nextPrayer } = usePrayerTimes();

  // Read firstName: Clerk metadata (org-keyed) → onboarding store → Clerk user
  const meta = user?.publicMetadata as Record<string, any> | undefined;
  const firstName =
    (clerkOrgId ? meta?.[clerkOrgId]?.firstName : null) ??
    (storedFirstName.trim() || null) ??
    user?.firstName ??
    '';

  return (
    <View className="overflow-hidden bg-[#0A261E]" style={{ paddingTop: insets.top + 16 }}>
      <Image
        source={patternSource}
        tintColor={accentRgb}
        style={{
          position: 'absolute',
          top: -10,
          right: -10,
          width: 180,
          height: 200,
          opacity: 0.35,
          transform: [{ rotate: '180deg' }],
        }}
        contentFit="cover"
        pointerEvents="none"
      />

      <View className="px-5">
        <Text
          className="text-primary-foreground/50"
          style={{
            fontSize: 9,
            fontWeight: '700',
            letterSpacing: 1.62,
            textTransform: 'uppercase',
          }}
        >
          Assalamu Alaikum{firstName ? ` ${firstName}` : ''}!
        </Text>

        <Text
          className="text-primary-foreground"
          style={{
            fontSize: 45,
            lineHeight: 52,
            marginTop: 8,
            letterSpacing: -2,
            fontFamily: 'PlayfairDisplay_400Regular',
          }}
        >
          {currentTime}
        </Text>

        {hijriDate ? (
          <Text
            className="text-primary-foreground"
            style={{ fontSize: 13, fontWeight: '600', marginTop: 4 }}
          >
            {hijriDate}
          </Text>
        ) : null}

        {nextPrayer && (
          <View className="mt-3 flex-row items-center">
            <View
              className="mr-1.5 bg-accent"
              style={{ height: 6, width: 6, borderRadius: 3 }}
            />
            <Text style={{ fontSize: 13 }}>
              <Text className="text-primary-foreground/50">{nextPrayer.name}</Text>
              <Text className="text-primary-foreground/80">
                {' '}
                {nextPrayer.type} in {nextPrayer.timeRemaining}
              </Text>
            </Text>
          </View>
        )}
      </View>

      <View className="mt-6 pb-6">
        <PrayerTimesBar />
      </View>
    </View>
  );
}

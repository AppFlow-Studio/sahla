import { useUser } from '@clerk/clerk-expo';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { usePrayerTimes } from '@/src/hooks/use-prayer-times';
import { getHijriDate } from '@/src/lib/hijri';
import { useOnboardingStore } from '@/src/stores/onboarding-store';
import { PrayerTimesBar } from './prayer-times-bar';

const patternSource = require('@/assets/islamic-pattern.png');

export function HomeHeader() {
  const insets = useSafeAreaInsets();
  const { colors, clerkOrgId } = useMasjidConfig();
  const { user } = useUser();
  const storedFirstName = useOnboardingStore((s) => s.firstName);
  const { nextPrayer, currentTimeFormatted, countdownLabel } = usePrayerTimes();
  const hijriDate = getHijriDate();
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;

  // Read firstName: Clerk metadata (org-keyed) → onboarding store → Clerk user
  const meta = user?.publicMetadata as Record<string, any> | undefined;
  const firstName =
    (clerkOrgId ? meta?.[clerkOrgId]?.firstName : null) ??
    (storedFirstName.trim() || null) ??
    user?.firstName ??
    '';

  return (
    <View className="overflow-hidden bg-primary" style={{ paddingTop: insets.top + 16 }}>
      <Image
        source={patternSource}
        tintColor={accentRgb}
        style={{
          position: 'absolute',
          top: -10,
          left: 0,
          right: 0,
          height: 280,
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
          {currentTimeFormatted}
        </Text>

        <Text
          className="text-primary-foreground"
          style={{ fontSize: 13, fontWeight: '600', marginTop: 4 }}
        >
          {hijriDate}
        </Text>

        <View className="mt-3 flex-row items-center">
          <View
            className="mr-1.5 bg-accent"
            style={{ height: 6, width: 6, borderRadius: 3 }}
          />
          <Text style={{ fontSize: 13 }}>
            {nextPrayer ? (
              <>
                <Text className="text-primary-foreground/50">{nextPrayer.name}</Text>
                <Text className="text-primary-foreground/80">
                  {' '}
                  iqamah in {countdownLabel}
                </Text>
              </>
            ) : (
              <Text className="text-primary-foreground/80">All prayers complete for today</Text>
            )}
          </Text>
        </View>
      </View>

      <View className="mt-6 pb-6">
        <PrayerTimesBar />
      </View>
    </View>
  );
}

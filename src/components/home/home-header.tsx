import { useUser } from '@clerk/clerk-expo';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useOnboardingStore } from '@/src/stores/onboarding-store';
import { usePrayerTimes } from '@/src/hooks/use-prayer-times';
import { PrayerTimesBar } from './prayer-times-bar';

const patternSource = require('@/assets/islamic-pattern-tall.png');

export function HomeHeader() {
  const insets = useSafeAreaInsets();
  const { colors, clerkOrgId } = useMasjidConfig();
  const { user } = useUser();
  const storedFirstName = useOnboardingStore((s) => s.firstName);
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;
  const primaryRgb = `rgb(${colors.primary.replace(/ /g, ',')})`;
  const primaryRgba0 = `rgba(${colors.primary.replace(/ /g, ',')}, 0)`;
  const { currentTime, hijriDate, nextPrayer } = usePrayerTimes();

  // Read firstName: Clerk metadata (org-keyed) → onboarding store → Clerk user
  const meta = user?.publicMetadata as Record<string, any> | undefined;
  const firstName =
    (clerkOrgId ? meta?.[clerkOrgId]?.firstName : null) ??
    (storedFirstName.trim() || null) ??
    user?.firstName ??
    '';

  return (
    <View className="overflow-hidden bg-primary" style={{ paddingTop: insets.top + 16 }}>
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: -10, right: -10, width: 220, height: 220, overflow: 'hidden' }}
      >
        {/* Render the pattern at a FIXED size (the approved zoom) so the box
            height above only controls where the decoration stops — shrinking
            the box clips it instead of zooming it. 341x400 = the tall asset
            scaled to the zoom the design engineer signed off on. */}
        <Image
          source={patternSource}
          tintColor={accentRgb}
          style={{ position: 'absolute', top: 0, right: 0, width: 341, height: 400, opacity: 0.35, transform: [{ rotate: '180deg' }] }}
          contentFit="cover"
        />
        {/* Soften the pattern's left edge so it dissolves into the
            background instead of ending in a hard vertical line. */}
        <LinearGradient
          colors={[primaryRgb, primaryRgba0]}
          locations={[0, 0.55]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Fade the pattern out vertically toward the bottom so it dissolves
            into the background just above the prayer bar, not a hard cut. */}
        <LinearGradient
          colors={[primaryRgba0, primaryRgb]}
          locations={[0.5, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

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

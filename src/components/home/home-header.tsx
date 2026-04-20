import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import {
  MOCK_CURRENT_TIME,
  MOCK_HIJRI_DATE,
  MOCK_NEXT_PRAYER,
} from '@/src/data/mock-home';
import { PrayerTimesBar } from './prayer-times-bar';

const patternSource = require('@/assets/islamic-pattern.png');

export function HomeHeader() {
  const insets = useSafeAreaInsets();
  const { colors } = useMasjidConfig();
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;

  return (
    <View className="overflow-hidden bg-primary" style={{ paddingTop: insets.top + 16 }}>
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
          Assalamu Alaikum D!
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
          {MOCK_CURRENT_TIME}
        </Text>

        <Text
          className="text-primary-foreground"
          style={{ fontSize: 13, fontWeight: '600', marginTop: 4 }}
        >
          {MOCK_HIJRI_DATE}
        </Text>

        <View className="mt-3 flex-row items-center">
          <View
            className="mr-1.5 bg-accent"
            style={{ height: 6, width: 6, borderRadius: 3 }}
          />
          <Text style={{ fontSize: 13 }}>
            <Text className="text-primary-foreground/50">{MOCK_NEXT_PRAYER.name}</Text>
            <Text className="text-primary-foreground/80">
              {' '}
              {MOCK_NEXT_PRAYER.type} in {MOCK_NEXT_PRAYER.timeRemaining}
            </Text>
          </Text>
        </View>
      </View>

      <View className="mt-6 pb-6">
        <PrayerTimesBar />
      </View>
    </View>
  );
}

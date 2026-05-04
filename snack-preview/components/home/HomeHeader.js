import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, withAlpha } from '../../config';
import { MOCK_CURRENT_TIME, MOCK_HIJRI_DATE, MOCK_NEXT_PRAYER } from '../../mock-data';
import { PrayerTimesBar } from './PrayerTimesBar';

export function HomeHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ overflow: 'hidden', backgroundColor: COLORS.primary, paddingTop: insets.top + 16 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Text
          style={{
            color: withAlpha(COLORS.primaryForeground, 0.5),
            fontSize: 9,
            fontWeight: '700',
            letterSpacing: 1.62,
            textTransform: 'uppercase',
          }}
        >
          Assalamu Alaikum D!
        </Text>

        <Text
          style={{
            color: COLORS.primaryForeground,
            fontSize: 45,
            lineHeight: 52,
            marginTop: 8,
            letterSpacing: -2,
          }}
        >
          {MOCK_CURRENT_TIME}
        </Text>

        <Text
          style={{
            color: COLORS.primaryForeground,
            fontSize: 13,
            fontWeight: '600',
            marginTop: 4,
          }}
        >
          {MOCK_HIJRI_DATE}
        </Text>

        <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              height: 6,
              width: 6,
              borderRadius: 3,
              backgroundColor: COLORS.accent,
              marginRight: 6,
            }}
          />
          <Text style={{ fontSize: 13 }}>
            <Text style={{ color: withAlpha(COLORS.primaryForeground, 0.5) }}>
              {MOCK_NEXT_PRAYER.name}
            </Text>
            <Text style={{ color: withAlpha(COLORS.primaryForeground, 0.8) }}>
              {' '}{MOCK_NEXT_PRAYER.type} in {MOCK_NEXT_PRAYER.timeRemaining}
            </Text>
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 24, paddingBottom: 24 }}>
        <PrayerTimesBar />
      </View>
    </View>
  );
}

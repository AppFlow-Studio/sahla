import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, withAlpha } from '../../config';
import { MOCK_PRAYER_TIMES } from '../../mock-data';

export function PrayerTimesBar() {
  const nameMuted = withAlpha(COLORS.primaryForeground, 0.4);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 }}>
      {MOCK_PRAYER_TIMES.map((prayer) => {
        const isActive = prayer.isActive;
        return (
          <View key={prayer.name} style={{ flex: 1, alignItems: 'center' }}>
            <View
              style={{
                width: 60,
                height: 67,
                borderRadius: 15,
                paddingVertical: 6,
                paddingHorizontal: 3,
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: isActive ? 0.5 : 0,
                borderColor: withAlpha(COLORS.accent, 0.2),
                backgroundColor: isActive ? withAlpha(COLORS.accent, 0.12) : 'transparent',
              }}
            >
              <Text
                style={{
                  fontSize: 8,
                  fontWeight: '600',
                  color: nameMuted,
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                }}
              >
                {prayer.name}
              </Text>
              <MaterialCommunityIcons
                name={prayer.icon}
                size={18}
                color={isActive ? COLORS.accent : COLORS.primaryForeground}
              />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '600',
                  color: isActive ? COLORS.accent : COLORS.primaryForeground,
                }}
              >
                {prayer.time}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

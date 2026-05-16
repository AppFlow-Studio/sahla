import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { usePrayerTimes } from '@/src/hooks/use-prayer-times';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const PRAYER_ICONS: Record<string, IconName> = {
  fajr: 'weather-sunset-up',
  sunrise: 'weather-sunny',
  dhuhr: 'white-balance-sunny',
  asr: 'weather-sunny',
  maghrib: 'weather-sunset-down',
  isha: 'moon-waning-crescent',
};

export function PrayerTimesBar() {
  const { colors } = useMasjidConfig();
  const { items } = usePrayerTimes();
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;
  const fgFull = `rgb(${colors.primaryForeground.replace(/ /g, ',')})`;
  const nameMuted = `rgba(${colors.primaryForeground.replace(/ /g, ',')},0.4)`;

  if (items.length === 0) {
    return <View className="px-5" style={{ height: 67 }} />;
  }

  return (
    <View className="flex-row items-center px-5">
      {items.map((prayer) => {
        const isActive = prayer.status === 'next';
        const icon = PRAYER_ICONS[prayer.rawName] ?? 'weather-sunny';
        return (
          <View key={prayer.rawName} className="flex-1 items-center">
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
                borderColor: `rgba(${colors.accent.replace(/ /g, ',')},0.2)`,
                backgroundColor: isActive
                  ? `rgba(${colors.accent.replace(/ /g, ',')},0.12)`
                  : 'transparent',
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
                name={icon}
                size={18}
                color={isActive ? accentRgb : fgFull}
              />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '600',
                  color: isActive ? accentRgb : fgFull,
                }}
              >
                {prayer.iqamah}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { usePrayerTimes } from '@/src/hooks/use-prayer-times';

// Prayers with a custom image glyph (keyed by lowercase name); any prayer not
// listed here falls back to its MaterialCommunityIcons glyph.
const CUSTOM_PRAYER_ICONS: Record<string, ReturnType<typeof require>> = {
  fajr: require('@/assets/images/fajr_2.png'),
  dhuhr: require('@/assets/images/dhuhr.png'),
  asr: require('@/assets/images/asr-icon-1.png'),
  maghrib: require('@/assets/images/maghrib.png'),
  isha: require('@/assets/images/isha.png'),
};

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export function PrayerTimesBar() {
  const { colors } = useMasjidConfig();
  const { prayers } = usePrayerTimes();
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;
  const fgFull = `rgb(${colors.primaryForeground.replace(/ /g, ',')})`;
  const nameMuted = `rgba(${colors.primaryForeground.replace(/ /g, ',')},0.4)`;

  if (prayers.length === 0) return null;

  return (
    <View className="flex-row items-center px-5">
      {prayers.map((prayer, i) => {
        const isActive = prayer.isActive;
        return (
          <View key={`${prayer.name}-${i}`} className="flex-1 items-center">
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
              {CUSTOM_PRAYER_ICONS[prayer.name.toLowerCase()] ? (
                <Image
                  source={CUSTOM_PRAYER_ICONS[prayer.name.toLowerCase()]}
                  style={{ width: 18, height: 18 }}
                  contentFit="contain"
                  tintColor={isActive ? accentRgb : fgFull}
                />
              ) : (
                <MaterialCommunityIcons
                  name={prayer.icon as IconName}
                  size={18}
                  color={isActive ? accentRgb : fgFull}
                />
              )}
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '600',
                  color: isActive ? accentRgb : fgFull,
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

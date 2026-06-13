import { View, Text } from 'react-native';

import { Icon } from '@/src/components/ui/icon';
import type { IconName } from '@/src/components/ui/icon';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { usePrayerTimes } from '@/src/hooks/use-prayer-times';

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
                  color: isActive ? accentRgb : nameMuted,
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                }}
              >
                {prayer.name}
              </Text>
              <Icon
                name={prayer.icon as IconName}
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
                {prayer.time}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

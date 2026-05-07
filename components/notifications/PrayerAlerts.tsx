import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Fragment } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  type PrayerName,
  usePrayerAlerts,
} from '@/src/hooks/use-prayer-alerts';

import { Toggle } from './Toggle';

const INK = '#0A261E';
const INK_MUTED = 'rgba(10,38,30,0.6)';
const SURFACE = '#FFFBF2';
const HAIRLINE = 'rgba(10,38,30,0.1)';

const PLAYFAIR = Platform.select({
  ios: 'PlayfairDisplay-Medium',
  default: 'PlayfairDisplay_500Medium',
});

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type PrayerMeta = {
  name: PrayerName;
  time: string;
  icon: IoniconName;
};

const PRAYERS: PrayerMeta[] = [
  { name: 'Fajr', time: '5:42 AM', icon: 'partly-sunny-outline' },
  { name: 'Dhuhr', time: '1:42 PM', icon: 'sunny-outline' },
  { name: 'Asr', time: '5:12 PM', icon: 'sunny-outline' },
  { name: 'Maghrib', time: '5:12 PM', icon: 'cloudy-outline' },
  { name: 'Isha', time: '5:12 PM', icon: 'moon-outline' },
];

function PrayerRow({
  prayer,
  on,
  onToggle,
}: {
  prayer: PrayerMeta;
  on: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
      }}
    >
      <View style={{ width: 24, marginRight: 14, alignItems: 'center' }}>
        <Ionicons name={prayer.icon} size={16} color={INK} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '500',
            lineHeight: 18,
            color: INK,
          }}
        >
          {prayer.name}
        </Text>
        <Text
          style={{
            fontSize: 12,
            lineHeight: 18,
            color: INK_MUTED,
            marginTop: 2,
          }}
        >
          {prayer.time}
        </Text>
      </View>
      <Toggle value={on} onChange={onToggle} />
    </View>
  );
}

function RemindMeRow({
  value,
  onPress,
}: {
  value: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
      }}
    >
      <View style={{ width: 24, marginRight: 14, alignItems: 'center' }}>
        <Ionicons name="notifications-outline" size={16} color={INK} />
      </View>
      <Text
        style={{
          flex: 1,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
          color: INK,
        }}
      >
        Remind me
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: INK_MUTED,
          marginRight: 6,
        }}
      >
        {value}
      </Text>
      <Ionicons name="chevron-forward" size={14} color={INK_MUTED} />
    </Pressable>
  );
}

export function PrayerAlerts({ onBack }: { onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  const { toggles, setPrayer } = usePrayerAlerts();

  const handleBack = onBack ?? (() => router.back());

  const handleToggle = (prayer: PrayerName, next: boolean) => {
    setPrayer(prayer, next).catch(() => {});
  };

  return (
    <View style={{ flex: 1, backgroundColor: INK, paddingTop: insets.top }}>
      <View style={{ flex: 1, backgroundColor: SURFACE }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
        <Pressable onPress={handleBack} hitSlop={12} style={{ marginBottom: 12 }}>
          <Ionicons name="arrow-back" size={22} color={INK_MUTED} />
        </Pressable>
        <Text
          style={{
            fontFamily: PLAYFAIR,
            fontWeight: '500',
            fontSize: 30,
            lineHeight: 38,
            color: INK,
          }}
        >
          Prayer alerts
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {PRAYERS.map((prayer) => (
          <Fragment key={prayer.name}>
            <PrayerRow
              prayer={prayer}
              on={toggles[prayer.name]}
              onToggle={(next) => handleToggle(prayer.name, next)}
            />
            <View style={{ height: 1, backgroundColor: HAIRLINE }} />
          </Fragment>
        ))}

        <RemindMeRow value="At Athan time" />

        <View style={{ height: 1, backgroundColor: HAIRLINE }} />

        <Text
          style={{
            marginTop: 18,
            fontSize: 12,
            lineHeight: 16,
            color: INK_MUTED,
          }}
        >
          You'll get a notification for each prayer you've selected.
        </Text>
      </ScrollView>
      </View>
    </View>
  );
}

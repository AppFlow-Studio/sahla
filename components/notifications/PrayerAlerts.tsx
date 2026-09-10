import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Fragment, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFontFamily } from '@/src/hooks/use-font-family';
import { useStatusBarStyle } from '@/src/hooks/use-status-bar-style';
import {
  type PrayerName,
  usePrayerAlerts,
} from '@/src/hooks/use-prayer-alerts';
import { PrayerNotificationSheet } from '@/src/components/prayer/prayer-notification-sheet';

import { Toggle } from './Toggle';
import { BackButton } from '@/src/components/ui/back-button';

const INK = '#0A261E';
const INK_MUTED = 'rgba(10,38,30,0.6)';
const SURFACE = '#FFFBF2';
const HAIRLINE = 'rgba(10,38,30,0.1)';

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
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
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
      <Toggle value={on} onChange={() => onToggle()} />
    </Pressable>
  );
}


export function PrayerAlerts({ onBack }: { onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  const fonts = useFontFamily();
  const { toggles, getSettings, savePrayerSettings, applyToAll } = usePrayerAlerts();
  const [sheetPrayer, setSheetPrayer] = useState<PrayerName | null>(null);
  useStatusBarStyle('dark');

  const handleBack = onBack ?? (() => router.back());

  return (
    <View style={{ flex: 1, backgroundColor: SURFACE, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
        <BackButton onPress={handleBack} color={INK_MUTED} style={{ marginBottom: 12 }} />
        <Text
          style={{
            fontFamily: fonts.display,
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
              onToggle={() => setSheetPrayer(prayer.name)}
            />
            <View style={{ height: 1, backgroundColor: HAIRLINE }} />
          </Fragment>
        ))}

        <Text
          style={{
            marginTop: 18,
            fontSize: 12,
            lineHeight: 16,
            color: INK_MUTED,
          }}
        >
          Tap a prayer to customize its notification settings.
        </Text>
      </ScrollView>

      <PrayerNotificationSheet
        prayer={sheetPrayer}
        currentSettings={sheetPrayer ? getSettings(sheetPrayer) : []}
        onSave={(settings) => {
          if (sheetPrayer) savePrayerSettings(sheetPrayer, settings).catch(() => {});
        }}
        onApplyToAll={(settings) => {
          applyToAll(settings).catch(() => {});
        }}
        onClose={() => setSheetPrayer(null)}
      />
    </View>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, Switch, Text, View } from 'react-native';

import type { PrayerName } from '@/src/hooks/use-notifications';

type Props = {
  prayer: PrayerName;
  athanTime: string | null;
  iqamahTime: string | null;
  mosqueLogoUrl: string | null;
  isOn: boolean;
  disabled?: boolean;
  onToggle: (next: boolean) => void;
  onPressEdit: () => void;
};

const COLORS = {
  cardBg: '#F5F3EE',
  cardBorder: 'rgba(10, 38, 30, 0.08)',
  logoBg: '#EFEDE6',
  titleText: '#0A261E',
  labelText: 'rgba(10, 38, 30, 0.6)',
  accent: '#B8922A',
  penBg: '#0A261E',
  penIcon: '#FFFBF2',
  switchTrackOff: 'rgba(10, 38, 30, 0.18)',
  switchTrackOn: '#0A261E',
};

function formatPrayerTime(raw: string | null): string {
  if (!raw) return '—';
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return raw;
  let hour = parseInt(match[1], 10);
  const minute = match[2];
  const suffix = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute}${suffix}`;
}

export function PrayerNotificationRow({
  prayer,
  athanTime,
  iqamahTime,
  mosqueLogoUrl,
  isOn,
  disabled,
  onToggle,
  onPressEdit,
}: Props) {
  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: COLORS.cardBg,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
      }}
    >
      <View
        style={{
          height: 40,
          width: 40,
          borderRadius: 20,
          backgroundColor: COLORS.logoBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {mosqueLogoUrl ? (
          <Image
            source={{ uri: mosqueLogoUrl }}
            style={{ height: 32, width: 32, borderRadius: 16 }}
            contentFit="cover"
          />
        ) : (
          <Ionicons name="moon" size={20} color={COLORS.labelText} />
        )}
      </View>

      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text
          style={{
            color: COLORS.titleText,
            fontSize: 16,
            fontWeight: '700',
          }}
        >
          {prayer}
        </Text>
        <Text
          style={{ marginTop: 2, fontSize: 12, color: COLORS.labelText }}
        >
          Athan{' '}
          <Text style={{ color: COLORS.accent, fontWeight: '600' }}>
            {formatPrayerTime(athanTime)}
          </Text>
        </Text>
        <Text
          style={{ marginTop: 2, fontSize: 12, color: COLORS.labelText }}
        >
          Iqamah{' '}
          <Text style={{ color: COLORS.accent, fontWeight: '600' }}>
            {formatPrayerTime(iqamahTime)}
          </Text>
        </Text>
      </View>

      <Pressable
        onPress={onPressEdit}
        disabled={disabled}
        hitSlop={6}
        style={{
          height: 32,
          width: 32,
          borderRadius: 16,
          backgroundColor: COLORS.penBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 8,
        }}
      >
        <Ionicons name="pencil" size={15} color={COLORS.penIcon} />
      </Pressable>

      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Switch
          value={isOn}
          onValueChange={onToggle}
          disabled={disabled}
          trackColor={{
            false: COLORS.switchTrackOff,
            true: COLORS.switchTrackOn,
          }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={COLORS.switchTrackOff}
        />
      </View>
    </View>
  );
}

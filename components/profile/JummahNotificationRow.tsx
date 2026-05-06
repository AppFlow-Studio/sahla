import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, Switch, Text, View } from 'react-native';

type Props = {
  label: string;
  prayerTime: string | null;
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
  return `${hour}:${minute} ${suffix}`;
}

export function JummahNotificationRow({
  label,
  prayerTime,
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
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: COLORS.cardBg,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
      }}
    >
      <View
        style={{
          height: 44,
          width: 44,
          borderRadius: 22,
          backgroundColor: COLORS.logoBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {mosqueLogoUrl ? (
          <Image
            source={{ uri: mosqueLogoUrl }}
            style={{ height: 36, width: 36, borderRadius: 18 }}
            contentFit="cover"
          />
        ) : (
          <Ionicons name="moon" size={22} color={COLORS.labelText} />
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
          {label}
        </Text>
        <Text
          style={{
            marginTop: 4,
            fontSize: 13,
            color: COLORS.accent,
            fontWeight: '600',
          }}
        >
          {formatPrayerTime(prayerTime)}
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

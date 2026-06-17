import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Icon, type IconName } from '@/src/components/ui/icon';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

export default function AdminHub() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useMasjidConfig();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ',')})`;
  const mutedRgb = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.5)`;
  const borderColor = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.1)`;

  return (
    <View className="flex-1 bg-card" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-5" style={{ height: 52 }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Icon name="chevron-back" size={22} color={fgRgb} />
        </Pressable>
        <Text
          style={{
            color: fgRgb,
            fontSize: 16,
            fontWeight: '600',
            marginLeft: 12,
          }}
        >
          Admin Portal
        </Text>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 40 }}>
        <Text
          style={{
            color: mutedRgb,
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 1.8,
            textTransform: 'uppercase',
            marginTop: 20,
            marginBottom: 12,
          }}
        >
          Manage
        </Text>

        <AdminRow
          title="Programs & Events"
          subtitle="Create and manage programs and events"
          icon="megaphone-outline"
          fgRgb={fgRgb}
          mutedRgb={mutedRgb}
          borderColor={borderColor}
          onPress={() => router.push('/profile/admin/programs')}
        />
        <AdminRow
          title="Sheikhs"
          subtitle="Add, edit, or remove speakers"
          icon="people-outline"
          fgRgb={fgRgb}
          mutedRgb={mutedRgb}
          borderColor={borderColor}
          onPress={() => router.push('/profile/admin/sheikhs')}
        />
        <AdminRow
          title="Program Categories"
          subtitle="Customize the Discover category cards"
          icon="images-outline"
          fgRgb={fgRgb}
          mutedRgb={mutedRgb}
          borderColor={borderColor}
          onPress={() => router.push('/profile/admin/program-categories')}
        />
        <AdminRow
          title="Jummah Schedule"
          subtitle="Assign speakers and topics"
          icon="calendar-outline"
          fgRgb={fgRgb}
          mutedRgb={mutedRgb}
          borderColor={borderColor}
          onPress={() => router.push('/profile/admin/jummah')}
        />
        <AdminRow
          title="Iqamah Times"
          subtitle="Set iqamah for each daily prayer"
          icon="time-outline"
          fgRgb={fgRgb}
          mutedRgb={mutedRgb}
          borderColor={borderColor}
          onPress={() => router.push('/profile/admin/iqamah')}
        />
        <AdminRow
          title="Business Ads"
          subtitle="Review and approve ad applications"
          icon="storefront-outline"
          fgRgb={fgRgb}
          mutedRgb={mutedRgb}
          borderColor={borderColor}
          onPress={() => router.push('/profile/admin/business-ads')}
        />
      </ScrollView>
    </View>
  );
}

function AdminRow({
  title,
  subtitle,
  icon,
  fgRgb,
  mutedRgb,
  borderColor,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: IconName;
  fgRgb: string;
  mutedRgb: string;
  borderColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center"
      style={{
        paddingVertical: 14,
        paddingHorizontal: 4,
        borderBottomWidth: 0.5,
        borderBottomColor: borderColor,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: borderColor,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Icon name={icon} size={18} color={fgRgb} />
      </View>
      <View className="flex-1">
        <Text style={{ color: fgRgb, fontSize: 14, fontWeight: '600' }}>{title}</Text>
        <Text style={{ color: mutedRgb, fontSize: 11, marginTop: 2 }}>{subtitle}</Text>
      </View>
      <Icon name="chevron-forward" size={16} color={mutedRgb} />
    </Pressable>
  );
}

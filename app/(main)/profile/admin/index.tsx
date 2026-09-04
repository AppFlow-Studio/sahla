import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Icon, type IconName } from '@/src/components/ui/icon';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useIsRTL } from '@/src/hooks/use-is-rtl';
import { useAutoStatusBarStyle } from '@/src/hooks/use-status-bar-style';

export default function AdminHub() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const { colors } = useMasjidConfig();
  useAutoStatusBarStyle(colors.card);
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ',')})`;
  const mutedRgb = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.5)`;
  const borderColor = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.1)`;

  return (
    <View className="flex-1 bg-card" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-5" style={{ height: 52 }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Icon name={isRTL ? 'chevron-forward' : 'chevron-back'} size={22} color={fgRgb} />
        </Pressable>
        <Text
          style={{
            color: fgRgb,
            fontSize: 16,
            fontWeight: '600',
            marginStart: 12,
          }}
        >
          {t('admin.adminPortal')}
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
          {t('admin.manage')}
        </Text>

        <AdminRow
          title={t('admin.programsEvents')}
          subtitle={t('admin.programsEventsSubtitle')}
          icon="megaphone-outline"
          fgRgb={fgRgb}
          mutedRgb={mutedRgb}
          borderColor={borderColor}
          onPress={() => router.push('/profile/admin/programs')}
        />
        <AdminRow
          title={t('admin.sheikhs')}
          subtitle={t('admin.sheikhsSubtitle')}
          icon="people-outline"
          fgRgb={fgRgb}
          mutedRgb={mutedRgb}
          borderColor={borderColor}
          onPress={() => router.push('/profile/admin/sheikhs')}
        />
        <AdminRow
          title={t('admin.jummahSchedule')}
          subtitle={t('admin.jummahScheduleSubtitle')}
          icon="calendar-outline"
          fgRgb={fgRgb}
          mutedRgb={mutedRgb}
          borderColor={borderColor}
          onPress={() => router.push('/profile/admin/jummah')}
        />
        <AdminRow
          title={t('admin.iqamahTimes')}
          subtitle={t('admin.iqamahTimesSubtitle')}
          icon="time-outline"
          fgRgb={fgRgb}
          mutedRgb={mutedRgb}
          borderColor={borderColor}
          onPress={() => router.push('/profile/admin/iqamah')}
        />
        <AdminRow
          title={t('admin.businessAds')}
          subtitle={t('admin.businessAdsSubtitle')}
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
  const isRTL = useIsRTL();
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
          marginEnd: 12,
        }}
      >
        <Icon name={icon} size={18} color={fgRgb} />
      </View>
      <View className="flex-1">
        <Text style={{ color: fgRgb, fontSize: 14, fontWeight: '600' }}>{title}</Text>
        <Text style={{ color: mutedRgb, fontSize: 11, marginTop: 2 }}>{subtitle}</Text>
      </View>
      <Icon name={isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={mutedRgb} />
    </Pressable>
  );
}

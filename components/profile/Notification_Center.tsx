import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DEFAULT_JUMMAH_NOTIFICATIONS,
  DEFAULT_PRAYER_NOTIFICATIONS,
  PRAYER_NAMES,
  useNotifications,
  type PrayerName,
} from '@/src/hooks/use-notifications';
import { JummahNotificationRow } from './JummahNotificationRow';
import { PrayerNotificationRow } from './PrayerNotificationRow';

type Tab = 'Prayer' | 'Programs' | 'Jummah';
const TABS: Tab[] = ['Prayer', 'Programs', 'Jummah'];

const COLORS = {
  screenBg: '#FFFBF2',
  titleText: '#0A261E',
  subtleText: 'rgba(10, 38, 30, 0.6)',
  tabActiveBg: '#0A261E',
  tabActiveBorder: '#0A261E',
  tabActiveText: '#FFFBF2',
  tabInactiveBg: 'transparent',
  tabInactiveBorder: 'rgba(10, 38, 30, 0.2)',
  tabInactiveText: 'rgba(10, 38, 30, 0.6)',
};

type Props = {
  onBack?: () => void;
  onEditPrayer?: (prayer: PrayerName) => void;
  initialTab?: Tab;
};

export default function NotificationCenter({
  onBack,
  onEditPrayer,
  initialTab = 'Prayer',
}: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const {
    mosque,
    todaysPrayers,
    prayerNotificationSettings,
    jummahPrayers,
    jummahNotifications,
    savePrayerSettings,
    saveJummahSettings,
    isSaving,
    isLoading,
    error,
  } = useNotifications();

  const prayerByName = useMemo(() => {
    const map = new Map<PrayerName, (typeof todaysPrayers)[number]>();
    for (const row of todaysPrayers) {
      const name = row.prayer_name as PrayerName | null;
      if (name && PRAYER_NAMES.includes(name)) map.set(name, row);
    }
    return map;
  }, [todaysPrayers]);

  const isOn = (prayer: PrayerName) => {
    const row = prayerNotificationSettings.find((r) => r.prayer === prayer);
    return (row?.notification_settings?.length ?? 0) > 0;
  };

  const handleToggle = (prayer: PrayerName, next: boolean) => {
    savePrayerSettings({
      prayer,
      settings: next ? DEFAULT_PRAYER_NOTIFICATIONS : [],
    }).catch(() => {});
  };

  const handleEditPrayer = (prayer: PrayerName) => {
    router.push(
      `/prayer-notification-edit?prayer=${encodeURIComponent(prayer)}` as Href,
    );
    onEditPrayer?.(prayer);
  };

  const jummahSettingsById = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const row of jummahNotifications) {
      if (row.jummah) map.set(row.jummah, row.notification_settings ?? []);
    }
    return map;
  }, [jummahNotifications]);

  const isJummahOn = (jummahId: number) =>
    (jummahSettingsById.get(String(jummahId))?.length ?? 0) > 0;

  const handleToggleJummah = (jummahId: number, next: boolean) => {
    saveJummahSettings({
      jummahId,
      settings: next ? DEFAULT_JUMMAH_NOTIFICATIONS : [],
    }).catch(() => {});
  };

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        backgroundColor: COLORS.screenBg,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 8,
        }}
      >
        <Pressable onPress={onBack} hitSlop={10} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={24} color={COLORS.titleText} />
        </Pressable>
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            color: COLORS.titleText,
            fontSize: 17,
            fontWeight: '700',
          }}
        >
          Notification Center
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 10,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 16,
        }}
      >
        {TABS.map((tab) => {
          const active = tab === activeTab;
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 8,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: active
                  ? COLORS.tabActiveBorder
                  : COLORS.tabInactiveBorder,
                backgroundColor: active
                  ? COLORS.tabActiveBg
                  : COLORS.tabInactiveBg,
              }}
            >
              <Text
                style={{
                  color: active ? COLORS.tabActiveText : COLORS.tabInactiveText,
                  fontSize: 14,
                  fontWeight: active ? '700' : '500',
                }}
              >
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.subtleText} />
        </View>
      ) : error ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 24,
          }}
        >
          <Text style={{ color: COLORS.subtleText, textAlign: 'center' }}>
            {error}
          </Text>
        </View>
      ) : activeTab === 'Prayer' ? (
        <ScrollView
          contentContainerStyle={{
            paddingTop: 4,
            paddingBottom: insets.bottom + 24,
          }}
        >
          {PRAYER_NAMES.map((prayer) => {
            const row = prayerByName.get(prayer);
            return (
              <PrayerNotificationRow
                key={prayer}
                prayer={prayer}
                athanTime={row?.athan_time ?? null}
                iqamahTime={row?.iqamah_time ?? null}
                mosqueLogoUrl={mosque?.logo_url ?? null}
                isOn={isOn(prayer)}
                disabled={isSaving}
                onToggle={(next) => handleToggle(prayer, next)}
                onPressEdit={() => handleEditPrayer(prayer)}
              />
            );
          })}
        </ScrollView>
      ) : activeTab === 'Jummah' ? (
        jummahPrayers.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 24,
            }}
          >
            <Text style={{ color: COLORS.subtleText, textAlign: 'center' }}>
              No Jummah times set for this masjid yet.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{
              paddingTop: 4,
              paddingBottom: insets.bottom + 24,
            }}
          >
            {jummahPrayers.map((row, index) => (
              <JummahNotificationRow
                key={row.id}
                label={
                  jummahPrayers.length === 1
                    ? 'Jummah Prayer'
                    : `Jummah Prayer ${index + 1}`
                }
                prayerTime={row.prayer_time}
                mosqueLogoUrl={mosque?.logo_url ?? null}
                isOn={isJummahOn(row.id)}
                disabled={isSaving}
                onToggle={(next) => handleToggleJummah(row.id, next)}
                onPressEdit={() =>
                  router.push(
                    `/jummah-notification-edit?id=${row.id}` as Href,
                  )
                }
              />
            ))}
          </ScrollView>
        )
      ) : activeTab === 'Programs' ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            paddingHorizontal: 32,
            paddingTop: 32,
          }}
        >
          <Text
            style={{
              color: COLORS.titleText,
              fontSize: 20,
              fontWeight: '700',
              textAlign: 'center',
              lineHeight: 28,
            }}
          >
            Start adding programs to your{'\n'}notifications
          </Text>
          <Ionicons
            name="notifications"
            size={48}
            color={COLORS.titleText}
            style={{ marginTop: 24 }}
          />
          <Text
            style={{
              marginTop: 24,
              color: COLORS.subtleText,
              fontSize: 15,
              fontWeight: '600',
              textAlign: 'center',
              lineHeight: 22,
            }}
          >
            Add programs and events by tapping the{'\n'}bell icon or sliding right on the flyer name
          </Text>
        </View>
      ) : (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 24,
          }}
        >
          <Text style={{ color: COLORS.subtleText }}>
            {activeTab} notifications coming soon.
          </Text>
        </View>
      )}
    </View>
  );
}

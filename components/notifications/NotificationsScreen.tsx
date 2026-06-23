import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFontFamily } from '@/src/hooks/use-font-family';
import { useConfigStore } from '@/src/stores/config-store';

import { NotificationTabs } from './NotificationTabs';
import { NotificationsEmpty } from './NotificationsEmpty';
import {
  NotificationsList,
  type NotificationCategory,
  type NotificationItem,
} from './NotificationsList';

const TAB_TO_CATEGORY: Record<NotificationTab, NotificationCategory | null> = {
  All: null,
  Prayer: 'prayer',
  Events: 'event',
  Updates: 'update',
};

const INK = '#0A261E';
const SURFACE = '#FFFBF2';

export const NOTIFICATION_TABS = ['All', 'Prayer', 'Events', 'Updates'] as const;
export type NotificationTab = (typeof NOTIFICATION_TABS)[number];

type Props = {
  items?: NotificationItem[];
  initialTab?: NotificationTab;
  onPressSettings?: () => void;
};

export function NotificationsScreen({ items = [], initialTab, onPressSettings }: Props) {
  const insets = useSafeAreaInsets();
  const fonts = useFontFamily();
  const masjidName = useConfigStore((s) => s.config.displayName);
  const [activeTab, setActiveTab] = useState<NotificationTab>(initialTab ?? 'All');

  const filterCategory = TAB_TO_CATEGORY[activeTab];
  const visibleItems = filterCategory
    ? items.filter((item) => item.category === filterCategory)
    : items;
  const isEmpty = visibleItems.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: SURFACE, paddingTop: insets.top }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
          paddingTop: 24,
          position: 'relative',
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={{
            position: 'absolute',
            left: 24,
            top: 24,
            bottom: 0,
            justifyContent: 'center',
          }}
        >
          <Image
            source={require('@/assets/images/left_arrow.png')}
            style={{ width: 16, height: 16 }}
            contentFit="contain"
          />
        </Pressable>
        <Text
          style={{
            fontFamily: fonts.display,
            fontWeight: '500',
            fontSize: 30,
            lineHeight: 38,
            color: INK,
            textAlign: 'center',
          }}
        >
          Notifications
        </Text>
        <Pressable
          onPress={onPressSettings}
          hitSlop={12}
          style={{
            position: 'absolute',
            right: 24,
            top: 24,
            bottom: 0,
            justifyContent: 'center',
          }}
        >
          <Ionicons name="settings-outline" size={22} color={INK} />
        </Pressable>
      </View>

      <View style={{ marginTop: 8 }}>
        <NotificationTabs
          tabs={NOTIFICATION_TABS}
          active={activeTab}
          onChange={setActiveTab}
        />
      </View>

      {isEmpty ? (
        <View style={{ flex: 1, marginTop: 32 }}>
          <NotificationsEmpty masjidName={masjidName} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
        >
          <NotificationsList items={visibleItems} />
        </ScrollView>
      )}
    </View>
  );
}

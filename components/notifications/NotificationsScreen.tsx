import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

const PLAYFAIR = Platform.select({
  ios: 'PlayfairDisplay-Medium',
  default: 'PlayfairDisplay_500Medium',
});

export const NOTIFICATION_TABS = ['All', 'Prayer', 'Events', 'Updates'] as const;
export type NotificationTab = (typeof NOTIFICATION_TABS)[number];

type Props = {
  items?: NotificationItem[];
  onPressSettings?: () => void;
};

export function NotificationsScreen({ items = [], onPressSettings }: Props) {
  const insets = useSafeAreaInsets();
  const masjidName = useConfigStore((s) => s.config.displayName);
  const [activeTab, setActiveTab] = useState<NotificationTab>('All');

  const filterCategory = TAB_TO_CATEGORY[activeTab];
  const visibleItems = filterCategory
    ? items.filter((item) => item.category === filterCategory)
    : items;
  const isEmpty = visibleItems.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: INK, paddingTop: insets.top }}>
      <View style={{ flex: 1, backgroundColor: SURFACE }}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={{ paddingHorizontal: 24, paddingTop: 16 }}
      >
        <Ionicons name="chevron-back" size={24} color={INK} />
      </Pressable>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 24,
          paddingTop: 8,
        }}
      >
        <Text
          style={{
            fontFamily: PLAYFAIR,
            fontWeight: '500',
            fontSize: 30,
            lineHeight: 38,
            color: INK,
          }}
        >
          Notifications
        </Text>
        <Pressable onPress={onPressSettings} hitSlop={12}>
          <Ionicons name="settings-outline" size={22} color={INK} />
        </Pressable>
      </View>

      <NotificationTabs
        tabs={NOTIFICATION_TABS}
        active={activeTab}
        onChange={setActiveTab}
      />

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
    </View>
  );
}

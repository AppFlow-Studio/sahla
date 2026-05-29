import { router, useLocalSearchParams, type Href } from 'expo-router';

import {
  NotificationsScreen,
  type NotificationTab,
  NOTIFICATION_TABS,
} from '@/components/notifications/NotificationsScreen';
import { useNotificationsFeed } from '@/src/hooks/use-notifications-feed';

export default function NotificationCenterScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const initialTab = NOTIFICATION_TABS.includes(tab as NotificationTab)
    ? (tab as NotificationTab)
    : undefined;

  const { items } = useNotificationsFeed();

  return (
    <NotificationsScreen
      items={items}
      initialTab={initialTab}
      onPressSettings={() =>
        router.push('/profile/notification-settings' as Href)
      }
    />
  );
}

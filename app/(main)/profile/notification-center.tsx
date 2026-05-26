import { router, useLocalSearchParams, type Href } from 'expo-router';

import {
  NotificationsScreen,
  type NotificationTab,
  NOTIFICATION_TABS,
} from '@/components/notifications/NotificationsScreen';
import type { NotificationItem } from '@/components/notifications/NotificationsList';

// Mock list — covers all three categories so each tab (Prayer / Events /
// Updates) renders something. Swap to a real query when the data layer is
// wired.
const MOCK_ITEMS: NotificationItem[] = [
  {
    id: 'n1',
    category: 'prayer',
    group: 'Today',
    title: 'Maghrib in 10 mins',
    subtitle: 'Athan 7:42 PM · Iqamah 7:52 PM',
    time: 'now',
    unread: true,
  },
  {
    id: 'n2',
    category: 'event',
    group: 'Today',
    title: 'Youth Soccer Program',
    subtitle: "April 11 • 4:00 PM - Don't Forget your gear",
    time: '10m ago',
    unread: true,
  },
  {
    id: 'n3',
    category: 'prayer',
    group: 'Today',
    title: 'Jummah Tomorrow',
    subtitle: 'Khutbah: "Patient in times of trial"',
    time: '11m ago',
  },
  {
    id: 'n4',
    category: 'update',
    group: 'Today',
    title: 'New Imam Joined',
    subtitle: 'Welcome Sheikh Abdullah to the masjid family',
    time: '2h ago',
  },
  {
    id: 'n5',
    category: 'update',
    group: 'Yesterday',
    title: 'Thank you Donating',
    subtitle: '$50 to Masjid Fund received',
  },
  {
    id: 'n6',
    category: 'event',
    group: 'Yesterday',
    title: 'Eid Fundraiser',
    subtitle: 'Sat April 18 • 6:00 PM - Help us reach our goal',
  },
  {
    id: 'n7',
    category: 'prayer',
    group: 'Yesterday',
    title: 'Jummah Tomorrow',
    subtitle: 'Khutbah: "Patient in times of trial"',
  },
];

export default function NotificationCenterScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const initialTab = NOTIFICATION_TABS.includes(tab as NotificationTab)
    ? (tab as NotificationTab)
    : undefined;

  return (
    <NotificationsScreen
      items={MOCK_ITEMS}
      initialTab={initialTab}
      onPressSettings={() =>
        router.push('/profile/notification-settings' as Href)
      }
    />
  );
}

import { router, useLocalSearchParams } from 'expo-router';

import NotificationCenter from '@/components/profile/Notification_Center';

type Tab = 'Prayer' | 'Programs' | 'Jummah';
const TABS: Tab[] = ['Prayer', 'Programs', 'Jummah'];

export default function NotificationCenterScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const initialTab = TABS.includes(params.tab as Tab)
    ? (params.tab as Tab)
    : 'Prayer';

  return (
    <NotificationCenter
      onBack={() => router.back()}
      initialTab={initialTab}
    />
  );
}

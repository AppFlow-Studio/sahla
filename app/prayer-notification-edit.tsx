import { router, useLocalSearchParams } from 'expo-router';

import { PrayerNotificationModal } from '@/components/profile/PrayerNotificationModal';
import {
  PRAYER_NAMES,
  useNotifications,
  type PrayerName,
  type PrayerNotificationOption,
} from '@/src/hooks/use-notifications';

export default function PrayerNotificationEditScreen() {
  const params = useLocalSearchParams<{ prayer?: string }>();
  const prayer = PRAYER_NAMES.includes(params.prayer as PrayerName)
    ? (params.prayer as PrayerName)
    : null;

  const {
    prayerNotificationSettings,
    savePrayerSettings,
    applyPrayerSettingsToAll,
    isSaving,
  } = useNotifications();

  const currentSettings: PrayerNotificationOption[] = prayer
    ? ((prayerNotificationSettings.find((r) => r.prayer === prayer)
        ?.notification_settings ?? []) as PrayerNotificationOption[])
    : [];

  return (
    <PrayerNotificationModal
      prayer={prayer}
      currentSettings={currentSettings}
      isSaving={isSaving}
      onClose={() => router.back()}
      onSave={async (settings) => {
        if (!prayer) return;
        await savePrayerSettings({ prayer, settings });
      }}
      onApplyToAll={async (settings) => {
        await applyPrayerSettingsToAll(settings);
      }}
    />
  );
}

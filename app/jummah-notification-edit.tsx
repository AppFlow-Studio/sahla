import { router, useLocalSearchParams } from 'expo-router';

import { JummahNotificationModal } from '@/components/profile/JummahNotificationModal';
import {
  useNotifications,
  type JummahNotificationOption,
} from '@/src/hooks/use-notifications';

export default function JummahNotificationEditScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const jummahId = params.id ? Number(params.id) : null;

  const { jummahNotifications, saveJummahSettings, isSaving } =
    useNotifications();

  const currentSettings: JummahNotificationOption[] =
    jummahId != null
      ? ((jummahNotifications.find((r) => r.jummah === String(jummahId))
          ?.notification_settings ?? []) as JummahNotificationOption[])
      : [];

  return (
    <JummahNotificationModal
      currentSettings={currentSettings}
      isSaving={isSaving}
      onClose={() => router.back()}
      onSave={async (settings) => {
        if (jummahId == null) return;
        await saveJummahSettings({ jummahId, settings });
      }}
    />
  );
}

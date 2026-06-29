import { useCallback, useEffect } from 'react';
import { AppState, Linking, Platform } from 'react-native';

import { useNotificationStatusStore } from '@/src/stores/notification-status-store';

function getNotificationsModule() {
  try {
    return require('expo-notifications') as typeof import('expo-notifications');
  } catch {
    return null;
  }
}

/**
 * Keep the cached OS notification-permission status fresh: refresh on mount and
 * whenever the app returns to the foreground — so enabling notifications in iOS
 * Settings clears the nudge dot as soon as the user comes back to the app.
 *
 * Mount once near the root of the authenticated tree (e.g. `(main)/_layout`).
 */
export function useNotificationStatusWatcher() {
  const refresh = useNotificationStatusStore((s) => s.refresh);
  useEffect(() => {
    void refresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => sub.remove();
  }, [refresh]);
}

/**
 * Returns a handler that turns notifications on: if the OS prompt has never been
 * answered we ask for permission inline; otherwise (already denied) we send the
 * user to Settings, since iOS only shows the system prompt once. Refreshes the
 * cached status afterwards so the nudge clears immediately on success.
 */
export function useEnableNotifications() {
  const refresh = useNotificationStatusStore((s) => s.refresh);
  return useCallback(async () => {
    if (Platform.OS === 'web') return;
    const Notifications = getNotificationsModule();
    let status: string | undefined;
    try {
      const res = await Notifications?.requestPermissionsAsync();
      status = res?.status;
    } catch {
      // Native module not ready — fall through to Settings.
    }
    await refresh();
    // requestPermissionsAsync resolves without UI when already determined; if
    // we still don't have permission, the only path left is Settings.
    if (status !== 'granted') Linking.openSettings();
  }, [refresh]);
}

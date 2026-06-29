import { Platform } from 'react-native';
import { create } from 'zustand';

import { storage } from '@/src/lib/mmkv';

/** Set once the user has answered/dismissed the notification soft prompt. */
export const NOTIF_PROMPT_SEEN_KEY = 'notifications.prompt.v1';

/**
 * Lazily load expo-notifications so reading permission status can't crash the
 * bundle on a stale native build (mirrors the other notification call sites).
 */
function getNotificationsModule() {
  try {
    return require('expo-notifications') as typeof import('expo-notifications');
  } catch {
    return null;
  }
}

type Permission = 'granted' | 'denied' | 'undetermined' | 'unknown';

type NotificationStatusState = {
  /** The soft prompt has been answered/dismissed at least once. */
  promptSeen: boolean;
  /** Last-known OS notification-permission status (`unknown` until first read). */
  permission: Permission;
  /** Persist + flip `promptSeen` (call when the soft prompt is dismissed). */
  markPromptSeen: () => void;
  /** Re-query the OS permission status (call on mount + every foreground). */
  refresh: () => Promise<void>;
};

/**
 * Reactive source of truth for the notifications nudge: whether the user has
 * been offered the soft prompt, and whether notifications are actually on. Kept
 * in a store (not bare MMKV) so the Profile dots update the instant the state
 * changes — when the prompt is dismissed, or when permission flips after the
 * user enables notifications from Settings.
 */
export const useNotificationStatusStore = create<NotificationStatusState>((set) => ({
  promptSeen: storage.getBoolean(NOTIF_PROMPT_SEEN_KEY) ?? false,
  permission: 'unknown',
  markPromptSeen: () => {
    storage.set(NOTIF_PROMPT_SEEN_KEY, true);
    set({ promptSeen: true });
  },
  refresh: async () => {
    if (Platform.OS === 'web') return;
    const Notifications = getNotificationsModule();
    if (!Notifications) return;
    try {
      const { status } = await Notifications.getPermissionsAsync();
      set({ permission: status as Permission });
    } catch {
      // Native module not ready (pre-EAS build) — leave the last value in place.
    }
  },
}));

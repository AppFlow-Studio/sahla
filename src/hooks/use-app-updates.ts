import { useCallback } from 'react';
import { Platform } from 'react-native';

/**
 * Single entry point for all OTA-update interactions.
 *
 * Disabled in dev (no manifest URL) and on web. When `enabled` is false,
 * action callbacks no-op so the UI can call them unconditionally.
 *
 * NOTE: `expo-updates` is a native module. Dev clients built before
 * temur-dev wired up EAS Update don't have it linked, so the bare
 * `require('expo-updates')` would throw at module-load time and crash any
 * screen that imports this hook (e.g. Profile). The try/catch lets such
 * builds keep running — Updates just appears `disabled`. Once dev clients
 * are rebuilt with the native side present, this fallback becomes a no-op.
 */
type UpdatesState = {
  isUpdateAvailable: boolean;
  isChecking: boolean;
  isDownloading: boolean;
  isUpdatePending: boolean;
  lastCheckForUpdateTimeSinceRestart: Date | null;
  checkError: Error | null;
  downloadError: Error | null;
};

const NOOP_STATE: UpdatesState = {
  isUpdateAvailable: false,
  isChecking: false,
  isDownloading: false,
  isUpdatePending: false,
  lastCheckForUpdateTimeSinceRestart: null,
  checkError: null,
  downloadError: null,
};

// All native-bridge touches happen inside this try so a stale dev client
// (built before expo-updates was wired in) doesn't crash on import. The
// `require` itself succeeds — expo-updates returns a JS proxy — but the
// "Cannot find native module 'ExpoUpdates'" error fires on the first
// property access that hits the native side. Probing `isEnabled` here forces
// that resolution to happen inside the catch.
let Updates: typeof import('expo-updates') | null = null;
let useUpdatesHook: () => UpdatesState = () => NOOP_STATE;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('expo-updates');
  void mod.isEnabled;
  Updates = mod;
  useUpdatesHook = mod.useUpdates;
} catch {
  Updates = null;
}

export function useAppUpdates() {
  const u = useUpdatesHook();

  const enabled =
    !!Updates && Updates.isEnabled && !__DEV__ && Platform.OS !== 'web';

  const checkNow = useCallback(async () => {
    if (!enabled || !Updates) return { isAvailable: false };
    return Updates.checkForUpdateAsync();
  }, [enabled]);

  const fetchNow = useCallback(async () => {
    if (!enabled || !Updates) return { isNew: false };
    return Updates.fetchUpdateAsync();
  }, [enabled]);

  const reloadNow = useCallback(async () => {
    if (!enabled || !Updates) return;
    await Updates.reloadAsync();
  }, [enabled]);

  return {
    enabled,
    isAvailable: u.isUpdateAvailable,
    isChecking: u.isChecking,
    isDownloading: u.isDownloading,
    isReady: u.isUpdatePending,
    lastCheckedAt: u.lastCheckForUpdateTimeSinceRestart,
    error: u.checkError ?? u.downloadError ?? null,
    channel: Updates?.channel ?? null,
    runtimeVersion: Updates?.runtimeVersion ?? null,
    checkNow,
    fetchNow,
    reloadNow,
  };
}

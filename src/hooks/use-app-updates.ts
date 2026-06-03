import * as Updates from 'expo-updates';
import { useCallback } from 'react';
import { Platform } from 'react-native';

/**
 * Single entry point for all OTA-update interactions.
 *
 * Disabled in dev (no manifest URL) and on web. When `enabled` is false,
 * action callbacks no-op so the UI can call them unconditionally.
 */
export function useAppUpdates() {
  const u = Updates.useUpdates();

  const enabled = Updates.isEnabled && !__DEV__ && Platform.OS !== 'web';

  const checkNow = useCallback(async () => {
    if (!enabled) return { isAvailable: false } as Updates.UpdateCheckResult;
    return Updates.checkForUpdateAsync();
  }, [enabled]);

  const fetchNow = useCallback(async () => {
    if (!enabled) return { isNew: false } as Updates.UpdateFetchResult;
    return Updates.fetchUpdateAsync();
  }, [enabled]);

  const reloadNow = useCallback(async () => {
    if (!enabled) return;
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
    channel: Updates.channel,
    runtimeVersion: Updates.runtimeVersion,
    checkNow,
    fetchNow,
    reloadNow,
  };
}

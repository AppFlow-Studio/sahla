import * as Updates from 'expo-updates';
import { createContext, lazy, Suspense, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';

import { useAppUpdates } from '@/src/hooks/use-app-updates';

const UpdatesBanner = lazy(() =>
  import('@/src/components/updates-banner').then((m) => ({ default: m.UpdatesBanner })),
);

type UpdatesContextValue = {
  checkAndNotify: () => Promise<void>;
};

const UpdatesContext = createContext<UpdatesContextValue | null>(null);

/**
 * On mount: silently check + fetch any pending OTA update.
 * When an update is staged (`isReady`), render a non-blocking banner with
 * Restart / Later. "Later" hides until next cold start — the staged update
 * is preserved on disk by expo-updates.
 *
 * Disabled in dev and on web (see `useAppUpdates`).
 */
export function UpdatesProvider({ children }: { children: React.ReactNode }) {
  const updates = useAppUpdates();
  const [dismissed, setDismissed] = useState(false);

  // Silent startup check + fetch
  useEffect(() => {
    if (!updates.enabled) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (cancelled || !result.isAvailable) return;
        await Updates.fetchUpdateAsync();
      } catch {
        // Silent — user can still manually retry from Profile.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [updates.enabled]);

  const checkAndNotify = async () => {
    if (!updates.enabled) {
      Alert.alert(
        'Updates disabled',
        __DEV__
          ? "OTA updates don't run in development builds."
          : Platform.OS === 'web'
            ? 'Updates are not available on the web.'
            : "Updates aren't enabled on this build.",
      );
      return;
    }
    try {
      const result = await updates.checkNow();
      if (!result.isAvailable) {
        Alert.alert("You're up to date", 'No new update is available right now.');
        return;
      }
      await updates.fetchNow();
    } catch (err) {
      Alert.alert('Update failed', err instanceof Error ? err.message : 'Try again later.');
    }
  };

  const showBanner = updates.isReady && !dismissed;

  return (
    <UpdatesContext.Provider value={{ checkAndNotify }}>
      {children}
      {showBanner && (
        <Suspense fallback={null}>
          <UpdatesBanner
            onRestart={() => {
              updates.reloadNow().catch(() => {});
            }}
            onDismiss={() => setDismissed(true)}
          />
        </Suspense>
      )}
    </UpdatesContext.Provider>
  );
}

export function useUpdatesActions() {
  const ctx = useContext(UpdatesContext);
  if (!ctx) throw new Error('useUpdatesActions must be used inside UpdatesProvider');
  return ctx;
}

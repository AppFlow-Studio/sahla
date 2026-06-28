import { useAuth } from '@clerk/clerk-expo';
import { useFocusEffect } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';

/**
 * Lazily load expo-notifications so the JS bundle doesn't crash if the native
 * module hasn't been linked yet (mirrors `use-register-push-token`).
 */
function getNotificationsModule() {
  try {
    return require('expo-notifications') as typeof import('expo-notifications');
  } catch {
    return null;
  }
}

/**
 * Reconciled "are push notifications actually live for this user" signal.
 *
 * Two AND'd conditions:
 *  - OS permission is `granted` (asked + accepted on this device)
 *  - At least one row in `push_tokens` for (user_id, mosque_id) with
 *    `is_active = true` (the registration step in `useRegisterPushToken`
 *    actually succeeded and hasn't been deactivated by a sign-out)
 *
 * Re-evaluates when the app returns to the foreground AND on screen focus,
 * so toggling permission in iOS Settings and coming back clears the badge
 * without an app restart — same flow `useRegisterPushToken` uses.
 */
export function useNotificationStatus() {
  const { userId, isLoaded, isSignedIn } = useAuth();
  const supabase = useSupabase();
  const mosqueId = useConfigStore((s) => s.mosqueUuid);
  const queryClient = useQueryClient();

  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    null,
  );

  const refreshPermission = useCallback(async () => {
    if (Platform.OS === 'web') {
      setPermissionGranted(false);
      return;
    }
    const Notifications = getNotificationsModule();
    if (!Notifications) {
      setPermissionGranted(false);
      return;
    }
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionGranted(status === 'granted');
  }, []);

  useEffect(() => {
    void refreshPermission();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshPermission();
    });
    return () => sub.remove();
  }, [refreshPermission]);

  const tokenQueryKey = ['push-tokens-active', userId, mosqueId] as const;
  const tokenQuery = useQuery({
    queryKey: tokenQueryKey,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('push_tokens')
        .select('id')
        .eq('user_id', userId!)
        .eq('mosque_id', mosqueId!)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data != null;
    },
    enabled: isLoaded && isSignedIn && !!userId && !!mosqueId,
  });

  // Re-fetch on screen focus so completion clears within the session.
  useFocusEffect(
    useCallback(() => {
      void refreshPermission();
      queryClient.invalidateQueries({ queryKey: tokenQueryKey });
    }, [queryClient, refreshPermission, userId, mosqueId]),
  );

  const hasActiveToken = tokenQuery.data ?? false;
  const granted = permissionGranted ?? false;

  return {
    enabled: granted && hasActiveToken,
    permissionGranted: granted,
    hasActiveToken,
    refresh: refreshPermission,
  };
}

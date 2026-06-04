import { useAuth } from '@clerk/clerk-expo';
import Constants from 'expo-constants';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';

/**
 * Lazily load expo-notifications so the JS bundle doesn't crash if the native
 * module hasn't been linked yet (e.g. before a fresh EAS build).
 */
function getNotificationsModule() {
  try {
    return require('expo-notifications') as typeof import('expo-notifications');
  } catch {
    return null;
  }
}

/**
 * Requests notification permissions, obtains an Expo push token, and upserts
 * it into the `push_tokens` table. Also re-registers on every app foreground
 * (tokens can change) and deactivates tokens on sign-out.
 *
 * Call this hook once, near the root of the authenticated tree (e.g. in the
 * layout that wraps `(main)`).
 */
export function useRegisterPushToken() {
  const supabase = useSupabase();
  const { userId, isLoaded, isSignedIn } = useAuth();
  const mosqueId = useConfigStore((s) => s.mosqueUuid);
  const registering = useRef(false);

  const register = useCallback(async () => {
    if (registering.current) return;
    if (!userId || !mosqueId) return;
    if (Platform.OS === 'web') return;

    const Notifications = getNotificationsModule();
    if (!Notifications) return;

    registering.current = true;
    try {
      const { status: existing } = await Notifications.getPermissionsAsync();
      if (existing !== 'granted') {
        registering.current = false;
        return;
      }

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;

      const { data: token } = await Notifications.getExpoPushTokenAsync({
        projectId: projectId as string,
      });

      await supabase.from('push_tokens').upsert(
        {
          user_id: userId,
          mosque_id: mosqueId,
          token,
          device_type: Platform.OS,
          is_active: true,
        },
        { onConflict: 'user_id,mosque_id,token' },
      );
    } finally {
      registering.current = false;
    }
  }, [supabase, userId, mosqueId]);

  // Register on mount + whenever userId/mosqueId change
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    void register();
  }, [isLoaded, isSignedIn, register]);

  // Re-register every time the app comes to the foreground
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void register();
    });
    return () => sub.remove();
  }, [isLoaded, isSignedIn, register]);

  // Deactivate tokens when user signs out
  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) return;
    if (!userId || !mosqueId) return;
    void supabase
      .from('push_tokens')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('mosque_id', mosqueId);
  }, [isLoaded, isSignedIn, userId, mosqueId, supabase]);

  return { register };
}

/**
 * Standalone helper for the onboarding flow. Requests permission, then
 * immediately registers the token if granted. Returns whether permission
 * was granted.
 */
export async function requestAndRegisterToken(
  supabase: ReturnType<typeof useSupabase>,
  userId: string,
  mosqueId: string,
): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const Notifications = getNotificationsModule();
  if (!Notifications) return false;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId: projectId as string,
  });

  await supabase.from('push_tokens').upsert(
    {
      user_id: userId,
      mosque_id: mosqueId,
      token,
      device_type: Platform.OS,
      is_active: true,
    },
    { onConflict: 'user_id,mosque_id,token' },
  );

  return true;
}

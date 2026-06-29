import Ionicons from '@expo/vector-icons/Ionicons';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { NotificationPermissionPrompt } from '@/src/components/notifications/permission-prompt';
import { AppTutorial } from '@/src/components/onboarding/app-tutorial';
import { ProfileTabDot } from '@/src/components/profile-tab-dot';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useNotificationStatusWatcher } from '@/src/hooks/use-notification-status';
import { useRegisterPushToken } from '@/src/hooks/use-register-push-token';

// Each tab uses a matched Ionicons outline/filled pair so the active tab simply
// fills in the same silhouette (rather than swapping to a different icon shape).
// Both render as template images, so the native bar tints them (gray when
// inactive, accent gold when active).
export default function TabLayout() {
  // Register/refresh push token on mount + every foreground event
  useRegisterPushToken();
  // Keep the cached notification-permission status fresh — drives the in-Profile
  // nudge dots (notifications card + tutorial row), refreshed on every foreground.
  useNotificationStatusWatcher();
  const { t } = useTranslation();
  const { colors } = useMasjidConfig();
  // `accent` (gold marigold) is the app's highlight color — used for the donate
  // button, prayer chips, dates, etc. `primary` is a near-black green, too dark
  // to read as an active-tab tint.
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;
  // Sequence the two first-run takeovers: the coach-mark tour waits until the
  // notification soft-prompt resolves so they never stack on first launch.
  const [notifResolved, setNotifResolved] = useState(false);
  const onNotifResolved = useCallback(() => setNotifResolved(true), []);
  return (
    <>
      <NotificationPermissionPrompt onResolved={onNotifResolved} />
      <AppTutorial enabled={notifResolved} />
      <NativeTabs tintColor={accentRgb}>
        <NativeTabs.Trigger name="index">
          <Label>{t('tabs.home')}</Label>
          <Icon
            src={{
              default: <VectorIcon family={Ionicons} name="home-outline" />,
              selected: <VectorIcon family={Ionicons} name="home" />,
            }}
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="discover">
          <Label>{t('tabs.discover')}</Label>
          <Icon
            src={{
              default: <VectorIcon family={Ionicons} name="compass-outline" />,
              selected: <VectorIcon family={Ionicons} name="compass" />,
            }}
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="watch">
          <Label>{t('tabs.watch')}</Label>
          <Icon
            src={{
              default: <VectorIcon family={Ionicons} name="play-circle-outline" />,
              selected: <VectorIcon family={Ionicons} name="play-circle" />,
            }}
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="prayer">
          <Label>{t('tabs.prayer')}</Label>
          <Icon
            src={{
              default: <VectorIcon family={Ionicons} name="time-outline" />,
              selected: <VectorIcon family={Ionicons} name="time" />,
            }}
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <Label>{t('tabs.profile')}</Label>
          <Icon
            src={{
              default: <VectorIcon family={Ionicons} name="person-outline" />,
              selected: <VectorIcon family={Ionicons} name="person" />,
            }}
          />
        </NativeTabs.Trigger>
      </NativeTabs>
      {/* Small custom dot over the Profile tab — the sized-down alternative to
          the native badge. Non-interactive, so it never blocks tab taps. */}
      <ProfileTabDot />
    </>
  );
}

import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { TabBar } from '@/src/components/navigation/tab-bar';
import { NotificationPermissionPrompt } from '@/src/components/notifications/permission-prompt';
import { AppTutorial } from '@/src/components/onboarding/app-tutorial';
import { ProfileTabDot } from '@/src/components/profile-tab-dot';
import { LIQUID_GLASS } from '@/src/components/ui/glass-surface';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useRegisterPushToken } from '@/src/hooks/use-register-push-token';

/**
 * `<NativeTabs>` is the iOS 26 liquid-glass bar. It's only used where that
 * effect actually exists — everywhere else (Android of any make, and iOS 16–25)
 * falls back to the JS `<Tabs>` navigator with our own floating blur bar, so
 * the app looks the same rather than dropping to a stock system bar.
 */
const USE_NATIVE_TABS = LIQUID_GLASS;

// Each tab uses a matched Ionicons outline/filled pair so the active tab simply
// fills in the same silhouette (rather than swapping to a different icon shape).
// Both render as template images, so the native bar tints them (gray when
// inactive, accent gold when active). `TAB_ICONS` in `tab-bar-button` mirrors
// these pairs for the fallback bar.
export default function TabLayout() {
  // Register/refresh push token on mount + every foreground event
  useRegisterPushToken();
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

      {USE_NATIVE_TABS ? (
        <>
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
          {/* Small custom dot over the Profile tab — the sized-down alternative
              to the native badge. Non-interactive, so it never blocks tab taps.
              The fallback bar draws its own dot inline instead. */}
          <ProfileTabDot />
        </>
      ) : (
        <Tabs
          screenOptions={{ headerShown: false }}
          tabBar={(props) => <TabBar {...props} />}
        >
          <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
          <Tabs.Screen name="discover" options={{ title: t('tabs.discover') }} />
          <Tabs.Screen name="watch" options={{ title: t('tabs.watch') }} />
          <Tabs.Screen name="prayer" options={{ title: t('tabs.prayer') }} />
          <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
        </Tabs>
      )}
    </>
  );
}

import Ionicons from '@expo/vector-icons/Ionicons';
import { Badge, Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';

import { NotificationPermissionPrompt } from '@/src/components/notifications/permission-prompt';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useRegisterPushToken } from '@/src/hooks/use-register-push-token';
import { useSetupCompleteness } from '@/src/hooks/use-setup-completeness';

// Each tab uses a matched Ionicons outline/filled pair so the active tab simply
// fills in the same silhouette (rather than swapping to a different icon shape).
// Both render as template images, so the native bar tints them (gray when
// inactive, accent gold when active).
export default function TabLayout() {
  // Register/refresh push token on mount + every foreground event
  useRegisterPushToken();
  const { t } = useTranslation();
  const { colors } = useMasjidConfig();
  const { incompleteCount } = useSetupCompleteness();
  // `accent` (gold marigold) is the app's highlight color — used for the donate
  // button, prayer chips, dates, etc. `primary` is a near-black green, too dark
  // to read as an active-tab tint.
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;
  return (
    <>
      <NotificationPermissionPrompt />
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
          {incompleteCount > 0 ? <Badge>{String(incompleteCount)}</Badge> : null}
        </NativeTabs.Trigger>
      </NativeTabs>
    </>
  );
}

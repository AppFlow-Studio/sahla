import Ionicons from '@expo/vector-icons/Ionicons';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';

import { NotificationPermissionPrompt } from '@/src/components/notifications/permission-prompt';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useRegisterPushToken } from '@/src/hooks/use-register-push-token';

// Each tab uses a matched Ionicons outline/filled pair so the active tab simply
// fills in the same silhouette (rather than swapping to a different icon shape).
// Both render as template images, so the native bar tints them (gray when
// inactive, accent gold when active).
export default function TabLayout() {
  // Register/refresh push token on mount + every foreground event
  useRegisterPushToken();
  const { colors } = useMasjidConfig();
  // `accent` (gold marigold) is the app's highlight color — used for the donate
  // button, prayer chips, dates, etc. `primary` is a near-black green, too dark
  // to read as an active-tab tint.
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;
  return (
    <>
      <NotificationPermissionPrompt />
      <NativeTabs tintColor={accentRgb}>
        <NativeTabs.Trigger name="index">
          <Label>Home</Label>
          <Icon
            src={{
              default: <VectorIcon family={Ionicons} name="home-outline" />,
              selected: <VectorIcon family={Ionicons} name="home" />,
            }}
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="discover">
          <Label>Discover</Label>
          <Icon
            src={{
              default: <VectorIcon family={Ionicons} name="compass-outline" />,
              selected: <VectorIcon family={Ionicons} name="compass" />,
            }}
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="watch">
          <Label>Watch</Label>
          <Icon
            src={{
              default: <VectorIcon family={Ionicons} name="play-circle-outline" />,
              selected: <VectorIcon family={Ionicons} name="play-circle" />,
            }}
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="prayer">
          <Label>Prayer</Label>
          <Icon
            src={{
              default: <VectorIcon family={Ionicons} name="time-outline" />,
              selected: <VectorIcon family={Ionicons} name="time" />,
            }}
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <Label>Profile</Label>
          <Icon
            src={{
              default: <VectorIcon family={Ionicons} name="person-outline" />,
              selected: <VectorIcon family={Ionicons} name="person" />,
            }}
          />
        </NativeTabs.Trigger>
      </NativeTabs>
    </>
  );
}

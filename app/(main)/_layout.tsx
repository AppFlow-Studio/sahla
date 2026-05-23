import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';

import { useRegisterPushToken } from '@/src/hooks/use-register-push-token';

export default function TabLayout() {
  // Register/refresh push token on mount + every foreground event
  useRegisterPushToken();
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon sf="house.fill" drawable="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="discover">
        <Label>Discover</Label>
        <Icon sf="safari" drawable="explore" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="watch">
        <Label>Watch</Label>
        <Icon sf="play.circle.fill" drawable="play" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="prayer">
        <Label>Prayer</Label>
        <Icon sf="clock" drawable="schedule" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon sf="person.crop.circle" drawable="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon sf="house.fill" drawable="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Label>Discover</Label>
        <Icon sf="gear" drawable="settings" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Label>Library</Label>
        <Icon sf="gear" drawable="settings" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Label>Prayer</Label>
        <Icon sf="gear" drawable="settings" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Label>Profile</Label>
        <Icon sf="gear" drawable="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
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

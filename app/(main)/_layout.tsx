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
      <NativeTabs.Trigger name="library">
        <Label>Library</Label>
        <Icon sf="books.vertical" drawable="library" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="prayer">
        <Label>Prayer</Label>
        <Icon sf="moon.stars" drawable="prayer" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon sf="person.fill" drawable="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

import { Stack } from 'expo-router';

export default function PersonalizationLayout() {
  return (
    <Stack
      initialRouteName="reasons"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#FFFBF2' },
      }}
    />
  );
}

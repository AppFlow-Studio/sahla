import { Stack } from 'expo-router';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

export default function AuthLayout() {
  const config = useMasjidConfig();
  const bg = `rgb(${config.colors.onboardingBackground.replace(/ /g, ',')})`;
  return (
    <Stack
      initialRouteName="welcome"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 400,
        contentStyle: { backgroundColor: bg },
      }}
    />
  );
}

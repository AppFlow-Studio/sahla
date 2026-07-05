import { Stack } from 'expo-router';

import { OnboardingDraftProvider } from '@/src/contexts/onboarding-draft-context';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

export default function OnboardingLayout() {
  const config = useMasjidConfig();
  const bg = `rgb(${config.colors.onboardingBackground.replace(/ /g, ',')})`;
  return (
    <OnboardingDraftProvider>
      <Stack
        initialRouteName="language"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          animationDuration: 400,
          contentStyle: { backgroundColor: bg },
        }}
      />
    </OnboardingDraftProvider>
  );
}

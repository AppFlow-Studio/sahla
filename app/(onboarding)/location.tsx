import { useRouter } from 'expo-router';

import { OnboardingScaffold } from '@/src/components/onboarding/scaffold';

export default function LocationScreen() {
  const router = useRouter();

  const requestPermission = async () => {
    // TODO: wire up expo-location permission request
    router.push('/(onboarding)/welcome-full');
  };

  return (
    <OnboardingScaffold
      step={3}
      title={`Where do\nyou pray?`}
      body="We use your location to show accurate prayer times. You can also enter your address manually."
      primaryLabel="Use my location"
      onPrimary={requestPermission}
      secondaryLabel="Enter address instead"
      onSecondary={() => router.push('/(onboarding)/welcome-full')}
    />
  );
}

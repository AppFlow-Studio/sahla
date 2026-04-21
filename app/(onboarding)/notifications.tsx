import { useRouter } from 'expo-router';

import { OnboardingScaffold } from '@/src/components/onboarding/scaffold';

export default function NotificationsScreen() {
  const router = useRouter();

  const requestPermission = async () => {
    // TODO: wire up expo-notifications permission request
    router.push('/(onboarding)/location');
  };

  return (
    <OnboardingScaffold
      step={2}
      title={`Never miss\na prayer`}
      body="Get athan and iqamah reminders right when you need them. You can customize which prayers and when in your settings later."
      primaryLabel="Enable Notifications"
      onPrimary={requestPermission}
      secondaryLabel="Maybe Later"
      onSecondary={() => router.push('/(onboarding)/location')}
    />
  );
}

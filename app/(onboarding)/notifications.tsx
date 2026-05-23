import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';

import { OnboardingScaffold } from '@/src/components/onboarding/scaffold';
import { requestAndRegisterToken } from '@/src/hooks/use-register-push-token';
import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';

export default function NotificationsScreen() {
  const router = useRouter();
  const supabase = useSupabase();
  const { userId } = useAuth();
  const mosqueId = useConfigStore((s) => s.mosqueUuid);

  const requestPermission = async () => {
    if (userId && mosqueId) {
      await requestAndRegisterToken(supabase, userId, mosqueId);
    }
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

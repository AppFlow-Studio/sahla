import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { OnboardingScaffold } from '@/src/components/onboarding/scaffold';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

export default function NameScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const config = useMasjidConfig();
  const surfaceHex = `rgb(${config.colors.onboardingSurface.replace(/ /g, ',')})`;

  return (
    <OnboardingScaffold
      step={1}
      title={`What should we\ncall you?`}
      primaryLabel="Continue"
      onPrimary={() => router.push('/(onboarding)/notifications')}
    >
      <View className="mt-10">
        <Text
          className="text-onboarding-surface/40"
          style={{ fontSize: 10, letterSpacing: 1.5 }}
        >
          FIRST NAME
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          autoFocus
          autoCapitalize="words"
          autoComplete="given-name"
          className="border-onboarding-surface/20 text-onboarding-surface mt-2 border-b pb-2"
          style={{ fontSize: 18 }}
          selectionColor={surfaceHex}
        />
      </View>
    </OnboardingScaffold>
  );
}

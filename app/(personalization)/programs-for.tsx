import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import { OptionRow } from '@/src/components/personalization/option-row';
import { PersonalizationScaffold } from '@/src/components/personalization/scaffold';
import { useUserPreferences } from '@/src/hooks/use-user-preferences';

const OPTIONS = ['Myself', 'My spouse', 'My kids', 'My parents'] as const;

export default function ProgramsForScreen() {
  const router = useRouter();
  const { preferences, status, upsertProgramsFor } = useUserPreferences();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'success') {
      setSelected(preferences?.programs_for ?? []);
    }
  }, [status, preferences?.programs_for]);

  const toggle = (option: string) => {
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((v) => v !== option) : [...prev, option],
    );
  };

  const handleContinue = async () => {
    try {
      await upsertProgramsFor.mutateAsync(selected);
      router.push('/(personalization)/journey');
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  const handleSkip = () => router.back();

  return (
    <PersonalizationScaffold
      step={2}
      title={`Who are you looking for\nprograms for?`}
      body="This helps us recommend family-appropriate content."
      primaryLabel={upsertProgramsFor.isPending ? 'Saving…' : 'Continue →'}
      onPrimary={handleContinue}
      primaryDisabled={upsertProgramsFor.isPending || status === 'loading'}
      onSkip={handleSkip}
    >
      <View>
        {OPTIONS.map((option, i) => (
          <OptionRow
            key={option}
            label={option}
            selected={selected.includes(option)}
            onToggle={() => toggle(option)}
            showDivider={i < OPTIONS.length - 1}
          />
        ))}
      </View>
    </PersonalizationScaffold>
  );
}

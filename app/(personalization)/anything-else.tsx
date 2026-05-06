import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import { OptionRow } from '@/src/components/personalization/option-row';
import { PersonalizationScaffold } from '@/src/components/personalization/scaffold';
import { useUserPreferences } from '@/src/hooks/use-user-preferences';

const REVERT_OPTION = "I'm a revert";

const OPTIONS = [
  REVERT_OPTION,
  'Arabic content',
  'Urdu Content',
  'Spanish Content',
  'Accessibility needs',
  'Sisters-only events',
  'Brothers-only events',
] as const;

export default function AnythingElseScreen() {
  const router = useRouter();
  const { preferences, status, upsertAnythingElse } = useUserPreferences();
  const [selected, setSelected] = useState<string[]>([]);

  // Hydrate from server: is_revert (boolean) becomes the REVERT_OPTION row,
  // and additional_preferences (text[]) supplies the rest.
  useEffect(() => {
    if (status === 'success') {
      const initial: string[] = [];
      if (preferences?.is_revert) initial.push(REVERT_OPTION);
      if (preferences?.additional_preferences) {
        initial.push(...preferences.additional_preferences);
      }
      setSelected(initial);
    }
  }, [status, preferences?.is_revert, preferences?.additional_preferences]);

  const toggle = (option: string) => {
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((v) => v !== option) : [...prev, option],
    );
  };

  const handleFinish = async () => {
    try {
      const isRevert = selected.includes(REVERT_OPTION);
      const additionalPreferences = selected.filter((o) => o !== REVERT_OPTION);
      await upsertAnythingElse.mutateAsync({ isRevert, additionalPreferences });
      router.replace('/(personalization)/all-set');
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  const handleSkip = () => router.replace('/(main)/profile');

  return (
    <PersonalizationScaffold
      step={5}
      totalSteps={5}
      title={`Anything else we\nshould know?`}
      body="Select all that apply This helps us show you relevant programs and events"
      primaryLabel={upsertAnythingElse.isPending ? 'Saving…' : 'Finish Setup'}
      onPrimary={handleFinish}
      primaryDisabled={upsertAnythingElse.isPending || status === 'loading'}
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

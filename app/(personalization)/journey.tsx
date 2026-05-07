import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import { OptionRow } from '@/src/components/personalization/option-row';
import { PersonalizationScaffold } from '@/src/components/personalization/scaffold';
import { useUserPreferences } from '@/src/hooks/use-user-preferences';

const OPTIONS = [
  "I'm new to Islam",
  'Learning the Basics',
  'Solid foundation',
  'Pursuing deeper knowledge',
] as const;

export default function JourneyScreen() {
  const router = useRouter();
  const { preferences, status, upsertIslamicKnowledgeLevel } = useUserPreferences();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'success') {
      setSelected(preferences?.islamic_knowledge_level ?? null);
    }
  }, [status, preferences?.islamic_knowledge_level]);

  // Single-select: tapping a different row replaces; tapping the active row clears.
  const select = (option: string) => {
    setSelected((prev) => (prev === option ? null : option));
  };

  const handleContinue = async () => {
    try {
      await upsertIslamicKnowledgeLevel.mutateAsync(selected);
      router.push('/(personalization)/availability');
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  const handleSkip = () => router.back();

  return (
    <PersonalizationScaffold
      step={3}
      title={`Where are you in\nyour journey?`}
      body="No judgment—we'll match content to where you are."
      primaryLabel={upsertIslamicKnowledgeLevel.isPending ? 'Saving…' : 'Continue →'}
      onPrimary={handleContinue}
      primaryDisabled={upsertIslamicKnowledgeLevel.isPending || status === 'loading'}
      onSkip={handleSkip}
    >
      <View>
        {OPTIONS.map((option, i) => (
          <OptionRow
            key={option}
            label={option}
            selected={selected === option}
            onToggle={() => select(option)}
            showDivider={i < OPTIONS.length - 1}
          />
        ))}
      </View>
    </PersonalizationScaffold>
  );
}

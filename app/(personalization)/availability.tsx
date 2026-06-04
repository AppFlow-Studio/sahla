import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import { OptionRow } from '@/src/components/personalization/option-row';
import { PersonalizationScaffold } from '@/src/components/personalization/scaffold';
import { useUserPreferences } from '@/src/hooks/use-user-preferences';

const OPTIONS = [
  'Weekday mornings',
  'Weekday evenings',
  'Weekend mornings',
  'Weekend afternoons',
  'After Jummah',
] as const;

export default function AvailabilityScreen() {
  const router = useRouter();
  const { preferences, status, upsertAttendanceWindows } = useUserPreferences();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'success') {
      setSelected(preferences?.attendance_windows ?? []);
    }
  }, [status, preferences?.attendance_windows]);

  const toggle = (option: string) => {
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((v) => v !== option) : [...prev, option],
    );
  };

  const handleContinue = async () => {
    try {
      await upsertAttendanceWindows.mutateAsync(selected);
      router.push('/(personalization)/anything-else');
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  const handleSkip = () => router.push('/(personalization)/anything-else');

  return (
    <PersonalizationScaffold
      step={4}
      totalSteps={5}
      title={`When can you usually\nattend?`}
      body="Select all that apply This helps us show you relevant programs and events"
      primaryLabel={upsertAttendanceWindows.isPending ? 'Saving…' : 'Continue →'}
      onPrimary={handleContinue}
      primaryDisabled={upsertAttendanceWindows.isPending || status === 'loading'}
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

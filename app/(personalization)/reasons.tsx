import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import { OptionRow } from '@/src/components/personalization/option-row';
import { PersonalizationScaffold } from '@/src/components/personalization/scaffold';
import { useUserPreferences } from '@/src/hooks/use-user-preferences';

const OPTIONS = [
  'Prayer & Worship',
  'Learning & lectures',
  'Community events',
  'Youth Programs',
  'Volunteering',
  'Donation & zakat',
] as const;

export default function ReasonsScreen() {
  const router = useRouter();
  const { preferences, status, upsertAttendanceReasons } = useUserPreferences();
  const [selected, setSelected] = useState<string[]>([]);

  // Hydrate from server once preferences finish loading. Re-runs if the row
  // changes (e.g. after a successful upsert refetch) so the UI stays in sync.
  useEffect(() => {
    if (status === 'success') {
      setSelected(preferences?.attendance_reasons ?? []);
    }
  }, [status, preferences?.attendance_reasons]);

  const toggle = (option: string) => {
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((v) => v !== option) : [...prev, option],
    );
  };

  const handleContinue = async () => {
    try {
      await upsertAttendanceReasons.mutateAsync(selected);
      router.push('/(personalization)/programs-for');
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  const handleSkip = () => router.back();

  return (
    <PersonalizationScaffold
      step={1}
      title={`What bring you to\nthe Masjid?`}
      body="Select all that apply This helps us show you relevant programs and events"
      primaryLabel={upsertAttendanceReasons.isPending ? 'Saving…' : 'Continue →'}
      onPrimary={handleContinue}
      primaryDisabled={upsertAttendanceReasons.isPending || status === 'loading'}
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

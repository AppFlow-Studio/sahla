import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { OptionRow } from '@/src/components/personalization/option-row';
import { PersonalizationScaffold } from '@/src/components/personalization/scaffold';
import { useUserPreferences } from '@/src/hooks/use-user-preferences';

// `value` is persisted to the DB (attendance_windows text[]) — never translate it.
const OPTIONS = [
  { value: 'Weekday mornings', labelKey: 'personalization.availabilityWeekdayMornings' },
  { value: 'Weekday evenings', labelKey: 'personalization.availabilityWeekdayEvenings' },
  { value: 'Weekend mornings', labelKey: 'personalization.availabilityWeekendMornings' },
  { value: 'Weekend afternoons', labelKey: 'personalization.availabilityWeekendAfternoons' },
  { value: 'After Jummah', labelKey: 'personalization.availabilityAfterJummah' },
] as const;

export default function AvailabilityScreen() {
  const router = useRouter();
  const { t } = useTranslation();
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
      Alert.alert(
        t('personalization.couldNotSave'),
        e instanceof Error ? e.message : t('personalization.unknownError'),
      );
    }
  };

  const handleSkip = () => router.push('/(personalization)/anything-else');

  return (
    <PersonalizationScaffold
      step={4}
      totalSteps={5}
      title={t('personalization.availabilityTitle')}
      body={t('personalization.selectAllApply')}
      primaryLabel={
        upsertAttendanceWindows.isPending
          ? t('personalization.saving')
          : t('personalization.continue')
      }
      onPrimary={handleContinue}
      primaryDisabled={upsertAttendanceWindows.isPending || status === 'loading'}
      onSkip={handleSkip}
    >
      <View>
        {OPTIONS.map((option, i) => (
          <OptionRow
            key={option.value}
            label={t(option.labelKey)}
            selected={selected.includes(option.value)}
            onToggle={() => toggle(option.value)}
            showDivider={i < OPTIONS.length - 1}
          />
        ))}
      </View>
    </PersonalizationScaffold>
  );
}

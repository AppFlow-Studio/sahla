import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { OptionRow } from '@/src/components/personalization/option-row';
import { PersonalizationScaffold } from '@/src/components/personalization/scaffold';
import { useUserPreferences } from '@/src/hooks/use-user-preferences';

// `value` is persisted to the DB (programs_for text[]) — never translate it.
const OPTIONS = [
  { value: 'Myself', labelKey: 'personalization.programsForMyself' },
  { value: 'My spouse', labelKey: 'personalization.programsForSpouse' },
  { value: 'My kids', labelKey: 'personalization.programsForKids' },
  { value: 'My parents', labelKey: 'personalization.programsForParents' },
] as const;

export default function ProgramsForScreen() {
  const router = useRouter();
  const { t } = useTranslation();
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
      Alert.alert(
        t('personalization.couldNotSave'),
        e instanceof Error ? e.message : t('personalization.unknownError'),
      );
    }
  };

  const handleSkip = () => router.back();

  return (
    <PersonalizationScaffold
      step={2}
      title={t('personalization.programsForTitle')}
      body={t('personalization.programsForBody')}
      primaryLabel={
        upsertProgramsFor.isPending
          ? t('personalization.saving')
          : t('personalization.continue')
      }
      onPrimary={handleContinue}
      primaryDisabled={upsertProgramsFor.isPending || status === 'loading'}
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

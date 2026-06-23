import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { OptionRow } from '@/src/components/personalization/option-row';
import { PersonalizationScaffold } from '@/src/components/personalization/scaffold';
import { useUserPreferences } from '@/src/hooks/use-user-preferences';

// `value` is persisted to the DB (islamic_knowledge_level) — never translate it.
const OPTIONS = [
  { value: "I'm new to Islam", labelKey: 'personalization.journeyNewToIslam' },
  { value: 'Learning the Basics', labelKey: 'personalization.journeyLearningBasics' },
  { value: 'Solid foundation', labelKey: 'personalization.journeySolidFoundation' },
  { value: 'Pursuing deeper knowledge', labelKey: 'personalization.journeyDeeperKnowledge' },
] as const;

export default function JourneyScreen() {
  const router = useRouter();
  const { t } = useTranslation();
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
      Alert.alert(
        t('personalization.couldNotSave'),
        e instanceof Error ? e.message : t('personalization.unknownError'),
      );
    }
  };

  const handleSkip = () => router.back();

  return (
    <PersonalizationScaffold
      step={3}
      title={t('personalization.journeyTitle')}
      body={t('personalization.journeyBody')}
      primaryLabel={
        upsertIslamicKnowledgeLevel.isPending
          ? t('personalization.saving')
          : t('personalization.continue')
      }
      onPrimary={handleContinue}
      primaryDisabled={upsertIslamicKnowledgeLevel.isPending || status === 'loading'}
      onSkip={handleSkip}
    >
      <View>
        {OPTIONS.map((option, i) => (
          <OptionRow
            key={option.value}
            label={t(option.labelKey)}
            selected={selected === option.value}
            onToggle={() => select(option.value)}
            showDivider={i < OPTIONS.length - 1}
          />
        ))}
      </View>
    </PersonalizationScaffold>
  );
}

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { OptionRow } from '@/src/components/personalization/option-row';
import { PersonalizationScaffold } from '@/src/components/personalization/scaffold';
import { useUserPreferences } from '@/src/hooks/use-user-preferences';

// `value` is persisted to the DB — REVERT_OPTION maps to is_revert (boolean)
// and the rest to additional_preferences (text[]). Never translate `value`;
// `labelKey` resolves to the localized display label only.
const REVERT_OPTION = "I'm a revert";

const OPTIONS = [
  { value: REVERT_OPTION, labelKey: 'personalization.anythingElseRevert' },
  { value: 'Arabic content', labelKey: 'personalization.anythingElseArabicContent' },
  { value: 'Urdu Content', labelKey: 'personalization.anythingElseUrduContent' },
  { value: 'Spanish Content', labelKey: 'personalization.anythingElseSpanishContent' },
  { value: 'Accessibility needs', labelKey: 'personalization.anythingElseAccessibility' },
  { value: 'Sisters-only events', labelKey: 'personalization.anythingElseSistersEvents' },
  { value: 'Brothers-only events', labelKey: 'personalization.anythingElseBrothersEvents' },
] as const;

export default function AnythingElseScreen() {
  const router = useRouter();
  const { t } = useTranslation();
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
      Alert.alert(
        t('personalization.couldNotSave'),
        e instanceof Error ? e.message : t('personalization.unknownError'),
      );
    }
  };

  const handleSkip = () => router.replace('/(main)/profile');

  return (
    <PersonalizationScaffold
      step={5}
      totalSteps={5}
      title={t('personalization.anythingElseTitle')}
      body={t('personalization.selectAllApply')}
      primaryLabel={
        upsertAnythingElse.isPending
          ? t('personalization.saving')
          : t('personalization.anythingElseFinish')
      }
      onPrimary={handleFinish}
      primaryDisabled={upsertAnythingElse.isPending || status === 'loading'}
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

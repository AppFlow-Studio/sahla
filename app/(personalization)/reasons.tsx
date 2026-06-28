import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { OptionRow } from '@/src/components/personalization/option-row';
import { PersonalizationScaffold } from '@/src/components/personalization/scaffold';
import { useUserPreferences } from '@/src/hooks/use-user-preferences';

// `value` is persisted to the DB (attendance_reasons text[]) — never translate
// it. `labelKey` resolves to the displayed, localized label only.
const OPTIONS = [
  { value: 'Prayer & Worship', labelKey: 'personalization.reasonPrayerWorship' },
  { value: 'Learning & lectures', labelKey: 'personalization.reasonLearningLectures' },
  { value: 'Community events', labelKey: 'personalization.reasonCommunityEvents' },
  { value: 'Youth Programs', labelKey: 'personalization.reasonYouthPrograms' },
  { value: 'Volunteering', labelKey: 'personalization.reasonVolunteering' },
  { value: 'Donation & zakat', labelKey: 'personalization.reasonDonationZakat' },
] as const;

export default function ReasonsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
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
      Alert.alert(
        t('personalization.couldNotSave'),
        e instanceof Error ? e.message : t('personalization.unknownError'),
      );
    }
  };

  const handleSkip = () => router.back();

  return (
    <PersonalizationScaffold
      step={1}
      title={t('personalization.reasonsTitle')}
      body={t('personalization.selectAllApply')}
      primaryLabel={
        upsertAttendanceReasons.isPending
          ? t('personalization.saving')
          : t('personalization.continue')
      }
      onPrimary={handleContinue}
      primaryDisabled={upsertAttendanceReasons.isPending || status === 'loading'}
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

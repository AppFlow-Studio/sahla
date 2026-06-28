import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { OnboardingScaffold } from '@/src/components/onboarding/scaffold';
import { useOnboardingDraft } from '@/src/contexts/onboarding-draft-context';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

const CHIPS: { key: string; labelKey: string }[] = [
  { key: 'daily_prayers', labelKey: 'interestDailyPrayers' },
  { key: 'jummah_khutbah', labelKey: 'interestJummahKhutbah' },
  { key: 'quran_study_tafseer', labelKey: 'interestQuranStudyTafseer' },
  { key: 'halaqas_study_circles', labelKey: 'interestHalaqasStudyCircles' },
  { key: 'kids_programs', labelKey: 'interestKidsPrograms' },
  { key: 'youth_programs', labelKey: 'interestYouthPrograms' },
  { key: 'community_events', labelKey: 'interestCommunityEvents' },
  { key: 'sisters_programs', labelKey: 'interestSistersPrograms' },
  { key: 'volunteering_service', labelKey: 'interestVolunteeringService' },
  { key: 'new_muslim_support', labelKey: 'interestNewMuslimSupport' },
  { key: 'marriage_family', labelKey: 'interestMarriageFamily' },
  { key: 'seniors_community', labelKey: 'interestSeniorsCommunity' },
];


export default function InterestsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { selectedInterestKeys, toggleInterestKey } = useOnboardingDraft();
  const { colors } = useMasjidConfig();

  const accentRgb = `rgb(${colors.onboardingAccent.replace(/ /g, ',')})`;
  const surfaceRgb = `rgba(${colors.onboardingSurface.replace(/ /g, ',')}, 0.12)`;
  const surfaceBorder = `rgba(${colors.onboardingSurface.replace(/ /g, ',')}, 0.2)`;

  const handleContinue = () => {
    if (selectedInterestKeys.length === 0) return;
    router.push('/(onboarding)/knowledge');
  };

  return (
    <OnboardingScaffold
      step={2}
      title={t('onboarding.interestsTitle')}
      body={t('onboarding.interestsBody')}
      primaryLabel={t('onboarding.continue')}
      onPrimary={handleContinue}
      primaryDisabled={selectedInterestKeys.length === 0}
      scrollable
    >
      <View
        className="mt-8 flex-row flex-wrap"
        style={{ gap: 8 }}
      >
        {CHIPS.map((chip) => {
          const isSelected = selectedInterestKeys.includes(chip.key);
          return (
            <Pressable
              key={chip.key}
              onPress={() => toggleInterestKey(chip.key)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: isSelected ? accentRgb : surfaceBorder,
                backgroundColor: isSelected
                  ? `rgba(${colors.onboardingAccent.replace(/ /g, ',')}, 0.15)`
                  : surfaceRgb,
              }}
            >
              <Text
                className={isSelected ? 'text-onboarding-accent' : 'text-onboarding-surface'}
                style={{ fontSize: 13, fontWeight: isSelected ? '600' : '400' }}
              >
                {t(`onboarding.${chip.labelKey}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {selectedInterestKeys.length > 0 && (
        <Text
          className="text-onboarding-surface/50 mt-4"
          style={{ fontSize: 11 }}
        >
          {t('onboarding.selectedCount', { count: selectedInterestKeys.length })}
        </Text>
      )}
    </OnboardingScaffold>
  );
}

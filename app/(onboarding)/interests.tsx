import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { OnboardingScaffold } from '@/src/components/onboarding/scaffold';
import { useOnboardingDraft } from '@/src/contexts/onboarding-draft-context';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

const CHIPS: { key: string; label: string }[] = [
  { key: 'daily_prayers', label: 'Daily prayers' },
  { key: 'jummah_khutbah', label: 'Jummah & khutbah' },
  { key: 'quran_study_tafseer', label: 'Quran study & tafseer' },
  { key: 'halaqas_study_circles', label: 'Halaqas & study circles' },
  { key: 'kids_programs', label: 'Kids programs' },
  { key: 'youth_programs', label: 'Youth programs' },
  { key: 'community_events', label: 'Community events' },
  { key: 'sisters_programs', label: "Sisters' programs" },
  { key: 'volunteering_service', label: 'Volunteering & service' },
  { key: 'new_muslim_support', label: 'New Muslim support' },
  { key: 'marriage_family', label: 'Marriage & family' },
  { key: 'seniors_community', label: "Seniors' community" },
];


export default function InterestsScreen() {
  const router = useRouter();
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
      title="What matters most to you right now?"
      body="Select all that apply. This helps us personalize your experience."
      primaryLabel="Continue"
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
                {chip.label}
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
          {selectedInterestKeys.length} selected
        </Text>
      )}
    </OnboardingScaffold>
  );
}

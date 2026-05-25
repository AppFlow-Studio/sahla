import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { OnboardingScaffold } from '@/src/components/onboarding/scaffold';
import { useOnboardingDraft } from '@/src/contexts/onboarding-draft-context';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

const TILES: { key: string; label: string }[] = [
  { key: 'student', label: 'Student' },
  { key: 'single_working', label: 'Single, working' },
  { key: 'newly_married', label: 'Newly married' },
  { key: 'parent_young_kids', label: 'Parent of young kids' },
  { key: 'parent_teens', label: 'Parent of teens' },
  { key: 'empty_nester', label: 'Empty nester' },
  { key: 'retired', label: 'Retired' },
  { key: 'new_to_islam', label: 'New to Islam' },
];

export default function LifeStageScreen() {
  const router = useRouter();
  const { lifeStages, toggleLifeStage } = useOnboardingDraft();
  const { colors } = useMasjidConfig();

  const accentRgb = `rgb(${colors.onboardingAccent.replace(/ /g, ',')})`;
  const surfaceRgb = `rgba(${colors.onboardingSurface.replace(/ /g, ',')}, 0.12)`;
  const surfaceBorder = `rgba(${colors.onboardingSurface.replace(/ /g, ',')}, 0.2)`;

  const handleContinue = () => {
    if (lifeStages.length === 0) return;
    router.push('/(onboarding)/interests');
  };

  return (
    <OnboardingScaffold
      step={1}
      title="Which describes you best right now?"
      body="Select all that apply."
      primaryLabel="Continue"
      onPrimary={handleContinue}
      primaryDisabled={lifeStages.length === 0}
      scrollable
    >
      <View
        className="mt-8 flex-row flex-wrap"
        style={{ gap: 10 }}
      >
        {TILES.map((tile) => {
          const isSelected = lifeStages.includes(tile.key);
          return (
            <Pressable
              key={tile.key}
              onPress={() => toggleLifeStage(tile.key)}
              style={{
                width: '47%',
                paddingVertical: 18,
                paddingHorizontal: 14,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: isSelected ? accentRgb : surfaceBorder,
                backgroundColor: isSelected ? `rgba(${colors.onboardingAccent.replace(/ /g, ',')}, 0.15)` : surfaceRgb,
                alignItems: 'center',
              }}
            >
              <Text
                className={isSelected ? 'text-onboarding-accent' : 'text-onboarding-surface'}
                style={{ fontSize: 13, fontWeight: isSelected ? '600' : '500', textAlign: 'center' }}
              >
                {tile.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingScaffold>
  );
}

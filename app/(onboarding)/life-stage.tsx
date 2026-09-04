import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { OnboardingScaffold } from '@/src/components/onboarding/scaffold';
import { useOnboardingDraft } from '@/src/contexts/onboarding-draft-context';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useAutoStatusBarStyle } from '@/src/hooks/use-status-bar-style';

const TILES: { key: string; labelKey: string }[] = [
  { key: 'student', labelKey: 'lifeStageStudent' },
  { key: 'single_working', labelKey: 'lifeStageSingleWorking' },
  { key: 'newly_married', labelKey: 'lifeStageNewlyMarried' },
  { key: 'parent_young_kids', labelKey: 'lifeStageParentYoungKids' },
  { key: 'parent_teens', labelKey: 'lifeStageParentTeens' },
  { key: 'empty_nester', labelKey: 'lifeStageEmptyNester' },
  { key: 'retired', labelKey: 'lifeStageRetired' },
  { key: 'new_to_islam', labelKey: 'lifeStageNewToIslam' },
];

export default function LifeStageScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { lifeStages, toggleLifeStage } = useOnboardingDraft();
  const { colors } = useMasjidConfig();
  useAutoStatusBarStyle(colors.onboardingBackground);

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
      title={t('onboarding.lifeStageTitle')}
      body={t('onboarding.selectAllThatApply')}
      primaryLabel={t('onboarding.continue')}
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
                {t(`onboarding.${tile.labelKey}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingScaffold>
  );
}

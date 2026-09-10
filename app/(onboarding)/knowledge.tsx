import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { OnboardingScaffold } from '@/src/components/onboarding/scaffold';
import { useOnboardingDraft } from '@/src/contexts/onboarding-draft-context';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useAutoStatusBarStyle } from '@/src/hooks/use-status-bar-style';

const TILES: { key: string; labelKey: string; descriptionKey: string }[] = [
  { key: 'starting', labelKey: 'knowledgeStartingLabel', descriptionKey: 'knowledgeStartingDesc' },
  { key: 'basics', labelKey: 'knowledgeBasicsLabel', descriptionKey: 'knowledgeBasicsDesc' },
  { key: 'practicing', labelKey: 'knowledgePracticingLabel', descriptionKey: 'knowledgePracticingDesc' },
  { key: 'deeper', labelKey: 'knowledgeDeeperLabel', descriptionKey: 'knowledgeDeeperDesc' },
];

export default function KnowledgeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { knowledgeLevel, setKnowledgeLevel } = useOnboardingDraft();
  const [selected, setSelected] = useState<string | null>(knowledgeLevel);
  const { colors } = useMasjidConfig();
  useAutoStatusBarStyle(colors.onboardingBackground);

  const accentRgb = `rgb(${colors.onboardingAccent.replace(/ /g, ',')})`;
  const surfaceRgb = `rgba(${colors.onboardingSurface.replace(/ /g, ',')}, 0.12)`;
  const surfaceBorder = `rgba(${colors.onboardingSurface.replace(/ /g, ',')}, 0.2)`;

  const handleContinue = () => {
    if (!selected) return;
    setKnowledgeLevel(selected);
    router.push('/(onboarding)/confirm');
  };

  return (
    <OnboardingScaffold
      step={3}
      title={t('onboarding.knowledgeTitle')}
      primaryLabel={t('onboarding.continue')}
      onPrimary={handleContinue}
      primaryDisabled={!selected}
    >
      <View className="mt-8" style={{ gap: 10 }}>
        {TILES.map((tile) => {
          const isSelected = selected === tile.key;
          return (
            <Pressable
              key={tile.key}
              onPress={() => setSelected(tile.key)}
              style={{
                paddingVertical: 16,
                paddingHorizontal: 18,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: isSelected ? accentRgb : surfaceBorder,
                backgroundColor: isSelected
                  ? `rgba(${colors.onboardingAccent.replace(/ /g, ',')}, 0.15)`
                  : surfaceRgb,
              }}
            >
              <Text
                className={isSelected ? 'text-onboarding-accent' : 'text-onboarding-surface'}
                style={{ fontSize: 14, fontWeight: '600' }}
              >
                {t(`onboarding.${tile.labelKey}`)}
              </Text>
              <Text
                className="text-onboarding-surface/50"
                style={{ fontSize: 11, marginTop: 2 }}
              >
                {t(`onboarding.${tile.descriptionKey}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingScaffold>
  );
}

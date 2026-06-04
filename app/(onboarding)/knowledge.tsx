import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { OnboardingScaffold } from '@/src/components/onboarding/scaffold';
import { useOnboardingDraft } from '@/src/contexts/onboarding-draft-context';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

const TILES: { key: string; label: string; description: string }[] = [
  { key: 'starting', label: 'Just starting out', description: 'New to learning about Islam' },
  { key: 'basics', label: 'Learning the basics', description: 'Building a foundation' },
  { key: 'practicing', label: 'Practicing & growing', description: 'Deepening my practice' },
  { key: 'deeper', label: 'Studying deeper', description: 'Advanced study & scholarship' },
];

export default function KnowledgeScreen() {
  const router = useRouter();
  const { knowledgeLevel, setKnowledgeLevel } = useOnboardingDraft();
  const [selected, setSelected] = useState<string | null>(knowledgeLevel);
  const { colors } = useMasjidConfig();

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
      title={"Where would you say you are\nin your Islamic learning?"}
      primaryLabel="Continue"
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
                {tile.label}
              </Text>
              <Text
                className="text-onboarding-surface/50"
                style={{ fontSize: 11, marginTop: 2 }}
              >
                {tile.description}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingScaffold>
  );
}

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Pattern from '@/assets/onboarding/pattern.svg';
import { Icon } from '@/src/components/ui/icon';
import { useFontFamily } from '@/src/hooks/use-font-family';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/src/i18n/languages';
import { useLanguageStore } from '@/src/stores/language-store';

/**
 * First onboarding step: pick the app language. Reuses the shared
 * `language-store` so the choice persists (MMKV) + applies i18next immediately.
 * When the text direction flips (Arabic/Urdu) we reload so the native RTL
 * mirroring takes effect — the app returns to this step in the chosen language.
 * Language can always be changed later from Profile.
 */
export default function LanguageScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const fonts = useFontFamily();
  const { colors } = useMasjidConfig();
  const currentLanguage = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  const [selected, setSelected] = useState<LanguageCode>(currentLanguage);
  const [busy, setBusy] = useState(false);

  const accentTriplet = colors.onboardingAccent.replace(/ /g, ',');
  const accentRgb = `rgb(${accentTriplet})`;
  const surfaceRgb = `rgba(${colors.onboardingSurface.replace(/ /g, ',')}, 0.12)`;
  const surfaceBorder = `rgba(${colors.onboardingSurface.replace(/ /g, ',')}, 0.2)`;

  const handleContinue = async () => {
    if (busy) return;
    setBusy(true);
    const { needsReload } = await setLanguage(selected);
    if (needsReload) {
      const Updates = require('expo-updates') as typeof import('expo-updates');
      Updates.reloadAsync().catch(() => setBusy(false));
      return;
    }
    router.push('/(onboarding)/life-stage');
  };

  return (
    <View className="flex-1 bg-onboarding-bg">
      <View pointerEvents="none" className="absolute inset-x-0 top-0" style={{ height: '30%' }}>
        <Pattern width="100%" height="100%" preserveAspectRatio="xMidYMin slice" />
      </View>

      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View style={{ marginTop: 56 }}>
            <Text
              className="text-onboarding-surface"
              style={{ fontFamily: fonts.display, fontSize: 30, fontWeight: '500', lineHeight: 36 }}
            >
              {t('onboarding.languageTitle')}
            </Text>
            <Text className="text-onboarding-surface/80 mt-6" style={{ fontSize: 11, lineHeight: 15 }}>
              {t('onboarding.languageBody')}
            </Text>
          </View>

          <View className="mt-8" style={{ gap: 10 }}>
            {SUPPORTED_LANGUAGES.map((l) => {
              const isSelected = selected === l.code;
              return (
                <Pressable
                  key={l.code}
                  onPress={() => setSelected(l.code)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 16,
                    paddingHorizontal: 18,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: isSelected ? accentRgb : surfaceBorder,
                    backgroundColor: isSelected ? `rgba(${accentTriplet}, 0.15)` : surfaceRgb,
                  }}
                >
                  <View>
                    <Text
                      className={isSelected ? 'text-onboarding-accent' : 'text-onboarding-surface'}
                      style={{ fontSize: 16, fontWeight: isSelected ? '600' : '500' }}
                    >
                      {l.nativeLabel}
                    </Text>
                    {l.label !== l.nativeLabel && (
                      <Text className="text-onboarding-surface/50" style={{ fontSize: 11, marginTop: 2 }}>
                        {l.label}
                      </Text>
                    )}
                  </View>
                  {isSelected && (
                    <Icon name="checkmark" size={20} color={accentRgb} strokeWidth={2.5} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View className="px-5 pb-6" style={{ paddingHorizontal: 36 }}>
          <Pressable
            onPress={handleContinue}
            disabled={busy}
            className="h-[43px] items-center justify-center rounded-full bg-onboarding-surface active:opacity-90"
            style={{ opacity: busy ? 0.6 : 1 }}
          >
            <Text className="text-onboarding-bg" style={{ fontSize: 14, fontWeight: '600' }}>
              {t('onboarding.continue')}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

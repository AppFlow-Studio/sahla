import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/src/components/ui/back-button';
import { useFontFamily } from '@/src/hooks/use-font-family';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useStatusBarStyle } from '@/src/hooks/use-status-bar-style';
import { LEGAL_DOCS, type LegalDocId } from '@/src/legal/content';
import { legalFieldsFor, resolveLegalText, LEGAL_CONSTANTS } from '@/src/legal/fields';

/**
 * Terms of Use and Privacy Policy, rendered from `src/legal/content.ts`.
 *
 * Kept in the binary rather than linked out: a reviewer with no connection can
 * still reach it, and the app asserts agreement to these documents at sign-up,
 * so they need to be readable at that moment.
 */
export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const { t } = useTranslation();
  const fonts = useFontFamily();
  const config = useMasjidConfig();
  const { colors } = useMasjidConfig();

  useStatusBarStyle('dark');

  const docId: LegalDocId = doc === 'privacy' ? 'privacy' : 'terms';
  const entry = LEGAL_DOCS[docId];

  const fields = useMemo(() => legalFieldsFor(config), [config]);

  const fg = colors.foreground.replace(/ /g, ',');
  const fgRgb = `rgb(${fg})`;
  const bgRgb = `rgb(${colors.background.replace(/ /g, ',')})`;

  return (
    <View style={{ flex: 1, backgroundColor: bgRgb }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            height: 52,
          }}
        >
          <BackButton color={fgRgb} />
          <Text
            style={{ marginStart: 12, fontSize: 16, fontWeight: '600', color: fgRgb }}
            numberOfLines={1}
          >
            {t(entry.titleKey)}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 64 }}
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={{
              fontSize: 26,
              lineHeight: 34,
              color: fgRgb,
              fontFamily: fonts.displayRegular,
              marginTop: 8,
            }}
          >
            {t(entry.titleKey)}
          </Text>
          <Text style={{ marginTop: 6, fontSize: 12, color: `rgba(${fg},0.45)` }}>
            {t('legal.meta', {
              masjid: config.displayName,
              date: LEGAL_CONSTANTS.EFFECTIVE_DATE,
              version: LEGAL_CONSTANTS.VERSION,
            })}
          </Text>


          {entry.sections.map((section) => (
            <View key={section.n} style={{ marginTop: 30 }}>
              <Text
                style={{
                  fontSize: 17,
                  lineHeight: 24,
                  fontWeight: '600',
                  color: fgRgb,
                  fontFamily: fonts.bodySemibold,
                }}
              >
                {`${section.n}. ${resolveLegalText(section.title, fields)}`}
              </Text>
              {section.body.map((paragraph, i) => (
                <Text
                  key={i}
                  style={{
                    marginTop: 12,
                    fontSize: 14,
                    lineHeight: 22,
                    color: `rgba(${fg},0.72)`,
                  }}
                >
                  {resolveLegalText(paragraph, fields)}
                </Text>
              ))}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

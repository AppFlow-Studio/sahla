import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/src/components/ui/back-button';
import { Icon, type IconName } from '@/src/components/ui/icon';
import { Tappable } from '@/src/components/ui/tappable';
import { useFontFamily } from '@/src/hooks/use-font-family';
import { useIsRTL } from '@/src/hooks/use-is-rtl';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useStatusBarStyle } from '@/src/hooks/use-status-bar-style';
import type { LegalDocId } from '@/src/legal/content';

const DOCS: { id: LegalDocId; icon: IconName; titleKey: string }[] = [
  { id: 'terms', icon: 'file-text', titleKey: 'legal.termsTitle' },
  { id: 'privacy', icon: 'shield', titleKey: 'legal.privacyTitle' },
];

/**
 * Index of the app's legal documents.
 *
 * A hub rather than one long page: the two documents run to ~26,000 characters
 * each, and stacking them would bury whichever came second. The intro names
 * both organizations up front, because the split between the Masjid and Sahla
 * is the thing readers most often get wrong about who holds their data.
 */
export default function LegalIndexScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const fonts = useFontFamily();
  const isRTL = useIsRTL();
  const { colors, displayName } = useMasjidConfig();

  useStatusBarStyle('dark');

  const fg = colors.foreground.replace(/ /g, ',');
  const fgRgb = `rgb(${fg})`;
  const bgRgb = `rgb(${colors.background.replace(/ /g, ',')})`;
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;

  return (
    <View style={{ flex: 1, backgroundColor: bgRgb }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 52 }}
        >
          <BackButton color={fgRgb} />
        </View>

        <View style={{ paddingHorizontal: 24 }}>
          <Text
            style={{
              fontSize: 28,
              lineHeight: 36,
              color: fgRgb,
              fontFamily: fonts.displayRegular,
            }}
          >
            {t('legal.hubTitle')}
          </Text>

          <Text
            style={{
              marginTop: 14,
              fontSize: 15,
              lineHeight: 23,
              color: `rgba(${fg},0.6)`,
            }}
          >
            {t('legal.hubIntro', { masjid: displayName })}
          </Text>

          <View style={{ marginTop: 32, gap: 12 }}>
            {DOCS.map((doc) => (
              <Tappable
                key={doc.id}
                onPress={() => router.push(`/legal/${doc.id}`)}
                accessibilityRole="button"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                }}
              >
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    backgroundColor: `rgba(${fg},0.05)`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginEnd: 16,
                  }}
                >
                  <Icon name={doc.icon} size={20} color={accentRgb} />
                </View>

                <Text
                  style={{
                    flex: 1,
                    fontSize: 16,
                    fontWeight: '600',
                    color: fgRgb,
                    fontFamily: fonts.bodySemibold,
                  }}
                >
                  {t(doc.titleKey)}
                </Text>

                <Icon
                  name={isRTL ? 'chevron-back' : 'chevron-forward'}
                  size={20}
                  color={`rgba(${fg},0.3)`}
                />
              </Tappable>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

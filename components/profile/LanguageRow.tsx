import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/src/components/ui/icon';
import { useFontFamily } from '@/src/hooks/use-font-family';
import { useIsRTL } from '@/src/hooks/use-is-rtl';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { SUPPORTED_LANGUAGES } from '@/src/i18n/languages';
import { useLanguageStore } from '@/src/stores/language-store';
import { LanguageSelectorSheet } from './LanguageSelectorSheet';

/**
 * Profile row that shows the current UI language and opens a selector sheet.
 */
export default function LanguageRow() {
  const { t } = useTranslation();
  const { colors } = useMasjidConfig();
  const fonts = useFontFamily();
  const isRTL = useIsRTL();
  const language = useLanguageStore((s) => s.language);
  const [open, setOpen] = useState(false);

  const fg = colors.foreground.replace(/ /g, ',');
  const fgRgb = `rgb(${fg})`;

  const current = SUPPORTED_LANGUAGES.find((l) => l.code === language);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between px-4 py-3"
      >
        <View className="flex-row items-center gap-2">
          <Icon name="globe" size={16} color={fgRgb} />
          <Text
            className="text-foreground"
            style={{
              fontFamily: fonts.bodyMedium,
              fontWeight: '500',
              fontSize: 13,
              lineHeight: 18,
            }}
          >
            {t('settings.language')}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: 13,
              color: `rgba(${fg},0.5)`,
            }}
          >
            {current?.nativeLabel ?? language}
          </Text>
          <Icon name={isRTL ? 'chevron-left' : 'chevron-right'} size={14} color={`rgba(${fg},0.4)`} />
        </View>
      </Pressable>

      <LanguageSelectorSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

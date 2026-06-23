import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/src/components/ui/icon';
import { useFontFamily } from '@/src/hooks/use-font-family';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/src/i18n/languages';
import { useLanguageStore } from '@/src/stores/language-store';

const SCREEN_H = Dimensions.get('window').height;

type Props = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Bottom-sheet language selector. Shows every supported language as a tappable
 * row with the active one highlighted + checkmarked. Switching is instant for
 * LTR↔LTR; when the text direction flips (to/from Arabic/Urdu) we confirm and
 * reload so the native RTL mirroring takes effect.
 */
export function LanguageSelectorSheet({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useMasjidConfig();
  const fonts = useFontFamily();
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  const fg = colors.foreground.replace(/ /g, ',');
  const fgRgb = `rgb(${fg})`;
  const bgRgb = `rgb(${colors.background.replace(/ /g, ',')})`;
  const accent = colors.accent.replace(/ /g, ',');
  const accentRgb = `rgb(${accent})`;
  const styles = makeStyles({ fg, fgRgb, bgRgb, accent, accentRgb });

  const [mounted, setMounted] = useState(visible);
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 0,
          duration: 160,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: SCREEN_H,
          duration: 260,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [visible, translateY, backdrop, mounted]);

  const choose = async (code: LanguageCode) => {
    if (code === language) {
      onClose();
      return;
    }
    const { needsReload } = await setLanguage(code);
    onClose();
    if (!needsReload) return;
    Alert.alert(
      t('settings.languageRestartTitle'),
      t('settings.languageRestartMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.restartNow'),
          onPress: () => {
            const Updates = require('expo-updates') as typeof import('expo-updates');
            Updates.reloadAsync().catch(() => {});
          },
        },
      ],
    );
  };

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View
          pointerEvents={visible ? 'auto' : 'none'}
          style={[styles.backdrop, { opacity: backdrop }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              marginBottom: Math.max(insets.bottom, 12) - 5,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          <View style={styles.titleRow}>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
              <Icon name="close" size={18} color={`rgba(${fg},0.55)`} />
            </Pressable>
            <Text style={[styles.title, { fontFamily: fonts.bodySemibold }]}>
              {t('settings.language')}
            </Text>
            <View style={styles.closeButtonSpacer} />
          </View>

          <ScrollView
            style={{ maxHeight: SCREEN_H * 0.6 }}
            contentContainerStyle={{ paddingBottom: 4 }}
            showsVerticalScrollIndicator={false}
          >
            {SUPPORTED_LANGUAGES.map((l) => {
              const selected = l.code === language;
              return (
                <Pressable
                  key={l.code}
                  onPress={() => choose(l.code)}
                  style={[styles.row, selected && styles.rowSelected]}
                >
                  <Text
                    style={[
                      styles.rowLabel,
                      { fontFamily: selected ? fonts.bodySemibold : fonts.bodyMedium },
                      selected && { color: accentRgb },
                    ]}
                  >
                    {l.nativeLabel}
                  </Text>
                  {selected ? (
                    <Icon name="checkmark" size={20} color={accentRgb} strokeWidth={2.5} />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const makeStyles = (c: {
  fg: string;
  fgRgb: string;
  bgRgb: string;
  accent: string;
  accentRgb: string;
}) =>
  StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
      paddingHorizontal: 12,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
    },
    sheet: {
      backgroundColor: c.bgRgb,
      borderRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 20,
    },
    handleRow: {
      alignItems: 'center',
      paddingBottom: 8,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: `rgba(${c.fg},0.18)`,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 4,
      paddingBottom: 12,
    },
    closeButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: `rgba(${c.fg},0.06)`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeButtonSpacer: {
      width: 28,
    },
    title: {
      color: c.fgRgb,
      fontSize: 15,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 54,
      borderRadius: 16,
      paddingHorizontal: 18,
      marginBottom: 8,
      backgroundColor: `rgba(${c.fg},0.04)`,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    rowSelected: {
      backgroundColor: `rgba(${c.accent},0.12)`,
      borderColor: `rgba(${c.accent},0.5)`,
    },
    rowLabel: {
      color: c.fgRgb,
      fontSize: 16,
    },
  });

export default LanguageSelectorSheet;

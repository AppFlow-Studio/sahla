import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/src/components/ui/icon';
import { Tappable } from '@/src/components/ui/tappable';
import { useIsRTL } from '@/src/hooks/use-is-rtl';

/**
 * Default glyph size. Every back button in the app used to pick its own —
 * 20, 22, 24, 26 and two text arrows — which is most of why they read as
 * different controls.
 */
const SIZE = 22;

/** Diameter of the `circle` variant's disc. */
const DISC = 38;

type Props = {
  /** Defaults to `router.back()`. */
  onPress?: () => void;
  /** Glyph colour. Required — every screen sits on its own background. */
  color: string;
  /** Override the glyph size. Prefer leaving this alone. */
  size?: number;
  /**
   * `plain` is a bare glyph, for a header row. `circle` sets it on a disc, for
   * when the button floats over media or a page rather than over chrome.
   */
  variant?: 'plain' | 'circle';
  /** Disc fill for `variant="circle"`. */
  circleColor?: string;
  /** Optional hairline ring for `variant="circle"`. */
  circleBorderColor?: string;
  /** Positioning only — don't restyle the glyph through this. */
  style?: StyleProp<ViewStyle>;
};

/**
 * The app's one back button.
 *
 * Before this existed the app had roughly a dozen variants: `arrow-back` in
 * auth and onboarding, `chevron-back` across profile and admin, a raw Ionicons
 * chevron in saved events, a PNG in the discover calendar, and a `←` character
 * in the Quran screens — at five different sizes, with three mutually exclusive
 * ways of handling RTL, and press feedback on some but not others.
 *
 * Chevron won over arrow because it was already the majority and it's the
 * platform-native back affordance on iOS. If you'd rather have the arrow
 * everywhere, change the two `chevron-*` names below and the whole app follows.
 *
 * RTL is handled here, once, by swapping the glyph rather than mirroring it
 * with a transform — a flipped chevron and a `chevron-forward` are the same
 * shape, and the swap keeps the stroke's rounded joins facing the right way.
 */
export function BackButton({
  onPress,
  color,
  size = SIZE,
  variant = 'plain',
  circleColor,
  circleBorderColor,
  style,
}: Props) {
  const { t } = useTranslation();
  const isRTL = useIsRTL();

  const glyph = (
    <Icon name={isRTL ? 'chevron-forward' : 'chevron-back'} size={size} color={color} />
  );

  return (
    <Tappable
      onPress={onPress ?? (() => router.back())}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={t('common.back')}
      style={style}
    >
      {variant === 'circle' ? (
        <View
          style={[
            styles.disc,
            { backgroundColor: circleColor },
            circleBorderColor
              ? { borderWidth: StyleSheet.hairlineWidth, borderColor: circleBorderColor }
              : null,
          ]}
        >
          {glyph}
        </View>
      ) : (
        glyph
      )}
    </Tappable>
  );
}

const styles = StyleSheet.create({
  disc: {
    width: DISC,
    height: DISC,
    borderRadius: DISC / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

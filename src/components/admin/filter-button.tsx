import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

import { Icon } from '@/src/components/ui/icon';

/**
 * Apple-style filter button that *morphs* into its options popover.
 *
 * Modelled on the Mushaf surah-picker morph (`src/screens/MushafPageScreen.tsx`
 * → `MorphingFooter`): a single `GlassView` whose size / corner radius animate
 * from a small disc into a popover via one `progress` shared value, while two
 * content layers — the collapsed funnel glyph and the expanded options list —
 * cross-fade. Because the glyph and rows render *on top* of the glass, they stay
 * crisp the whole time (unlike a native `UIButton` glass config, which renders
 * its content under the material and washes it out).
 *
 * Rendered as a screen-root overlay (not an in-header child) so the popover can
 * grow over the page with a dim backdrop. The collapsed disc floats at the
 * header's top-right; the popover anchors its right edge there and expands down
 * and to the left.
 */

const LIQUID_GLASS = isLiquidGlassAvailable();

const DISC = 40; // collapsed diameter
const W_OPEN = 248; // expanded popover width
const ROW_H = 46;
const PAD_V = 8; // popover vertical padding

// Right inset of the disc within the header: 20 (screen pad) + 26 ("+" glyph)
// + 14 (gap) places it one gap to the left of the "+" button.
const RIGHT = 60;

export type FilterOption = {
  id: string;
  title: string;
};

type Props = {
  /** Currently-selected option id (drives the checkmark + active styling). */
  value: string;
  options: FilterOption[];
  onChange: (id: string) => void;
  /** rgb()/rgba() string for the inactive glyph + row labels. */
  fgRgb: string;
  /** rgb()/rgba() string for the active glyph, checkmark + active label. */
  accentRgb: string;
  /** Solid card color used as the surface on non-glass platforms. */
  cardRgb: string;
  /** Muted rgba() string for row separators. */
  borderColor: string;
  /** Safe-area top inset — the disc sits just below it. */
  insetsTop: number;
  /** Whether a filter is currently narrowing the list (fills/tints the glyph). */
  active: boolean;
};

export function FilterButton({
  value,
  options,
  onChange,
  fgRgb,
  accentRgb,
  cardRgb,
  borderColor,
  insetsTop,
  active,
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const progress = useSharedValue(0);

  const top = insetsTop + 6; // centers the 40pt disc in the 52pt header row
  const H_OPEN = options.length * ROW_H + PAD_V * 2;

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, { duration: 280 });
  }, [open, progress]);

  const containerStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [DISC, W_OPEN], Extrapolation.CLAMP),
    height: interpolate(progress.value, [0, 1], [DISC, H_OPEN], Extrapolation.CLAMP),
    borderRadius: interpolate(progress.value, [0, 1], [DISC / 2, 22], Extrapolation.CLAMP),
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const collapsedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.35], [1, 0], Extrapolation.CLAMP),
  }));

  const expandedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.45, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const inner = (
    <>
      {/* Collapsed: funnel glyph, pinned to the disc footprint (right side of
          the wrap, which is where the disc lives before it grows left). */}
      <Animated.View
        pointerEvents={open ? 'none' : 'auto'}
        style={[styles.collapsed, collapsedStyle]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('admin.filter')}
          onPress={() => setOpen(true)}
          style={styles.discHit}
        >
          <Icon
            name={active ? 'funnel' : 'funnel-outline'}
            size={18}
            color={active ? accentRgb : fgRgb}
            fill={active ? accentRgb : 'none'}
            strokeWidth={2}
          />
        </Pressable>
      </Animated.View>

      {/* Expanded: the options list. */}
      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[styles.expanded, expandedStyle]}
      >
        {options.map((o, i) => {
          const selected = o.id === value;
          return (
            <Pressable
              key={o.id}
              onPress={() => {
                onChange(o.id);
                setOpen(false);
              }}
              style={[
                styles.row,
                i < options.length - 1
                  ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor }
                  : null,
              ]}
            >
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  fontSize: 15,
                  fontWeight: selected ? '600' : '400',
                  color: selected ? accentRgb : fgRgb,
                }}
              >
                {o.title}
              </Text>
              {selected ? <Icon name="checkmark" size={17} color={accentRgb} strokeWidth={2.5} /> : null}
            </Pressable>
          );
        })}
      </Animated.View>
    </>
  );

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {/* Dim backdrop — only catches touches while open. */}
      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
      </Animated.View>

      {/* Morphing surface, anchored top-right. */}
      <Animated.View style={[styles.wrap, { top, right: RIGHT }, containerStyle]}>
        {LIQUID_GLASS ? (
          <GlassView glassEffectStyle="regular" style={styles.surface}>
            {inner}
          </GlassView>
        ) : (
          <View style={[styles.surface, { backgroundColor: cardRgb, borderWidth: StyleSheet.hairlineWidth, borderColor }]}>
            {inner}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  wrap: {
    position: 'absolute',
    overflow: 'hidden',
  },
  surface: {
    flex: 1,
    overflow: 'hidden',
  },
  collapsed: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: DISC,
    height: DISC,
  },
  discHit: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expanded: {
    flex: 1,
    paddingVertical: PAD_V,
  },
  row: {
    height: ROW_H,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
});

export default FilterButton;

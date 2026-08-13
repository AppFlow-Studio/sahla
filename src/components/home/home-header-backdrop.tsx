import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

const patternSource = require('@/assets/islamic-pattern-tall.png');

/** Natural size of the pattern asset, used to keep its motifs from stretching. */
const PATTERN_W = 804;
const PATTERN_H = 944;

/** How far the band reaches below the safe area before it's fully dissolved. */
const BAND_DEPTH = 96;

type Variant =
  /** Zoomed patch tucked into the top-right corner. The classic header. */
  | 'corner'
  /** Full-bleed band across the top, dissolving downward. The countdown headers. */
  | 'band';

/**
 * The faint geometric pattern decorating the top of the home header, dissolving
 * into the brand-green background.
 *
 * The two header families frame it differently, so the variant is explicit
 * rather than shared: the classic header keeps the corner patch, while the
 * countdown headers (Figma "homepage final version" 1 & 2, node 383-5217) run
 * it edge to edge under the branding bar and fade it out just above the
 * countdown digits.
 */
export function HomeHeaderBackdrop({ variant = 'corner' }: { variant?: Variant }) {
  const { colors } = useMasjidConfig();
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;
  const primaryRgb = `rgb(${colors.primary.replace(/ /g, ',')})`;
  const primaryRgba0 = `rgba(${colors.primary.replace(/ /g, ',')}, 0)`;

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  if (variant === 'band') {
    // The band clips the pattern's top edge, which is its densest region — so
    // the art is anchored at the top at its natural aspect rather than
    // `cover`-cropped to the middle, where the asset is nearly blank.
    const bandHeight = insets.top + BAND_DEPTH;

    return (
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: bandHeight, overflow: 'hidden' }}
      >
        <Image
          source={patternSource}
          tintColor={accentRgb}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width,
            height: (width * PATTERN_H) / PATTERN_W,
            opacity: 0.35,
          }}
          contentFit="cover"
        />
        <LinearGradient
          colors={[primaryRgba0, primaryRgb]}
          locations={[0.45, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
    );
  }

  // Rendered at a FIXED size (the approved zoom): the negative offsets slide the
  // asset's dense middle to the top-right, and the two gradients fade it out on
  // the left and bottom edges so it never ends in a hard line.
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: -10, right: -10, width: 220, height: 220, overflow: 'hidden' }}
    >
      <Image
        source={patternSource}
        tintColor={accentRgb}
        style={{ position: 'absolute', top: -180, right: 0, width: 341, height: 400, opacity: 0.35, transform: [{ rotate: '180deg' }] }}
        contentFit="cover"
      />
      <LinearGradient
        colors={[primaryRgb, primaryRgba0]}
        locations={[0, 0.55]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={[primaryRgba0, primaryRgb]}
        locations={[0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
}

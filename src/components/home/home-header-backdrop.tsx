import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

const patternSource = require('@/assets/islamic-pattern-tall.png');

/**
 * The faint geometric pattern that decorates the top-right of the home header
 * and dissolves into the brand-green background. Shared by both header variants
 * (classic + countdown) so the decoration stays identical between them.
 *
 * Rendered at a FIXED size (the approved zoom): the negative offsets slide the
 * asset's dense middle to the top-right, and the two gradients fade it out on
 * the left and bottom edges so it never ends in a hard line.
 */
export function HomeHeaderBackdrop() {
  const { colors } = useMasjidConfig();
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;
  const primaryRgb = `rgb(${colors.primary.replace(/ /g, ',')})`;
  const primaryRgba0 = `rgba(${colors.primary.replace(/ /g, ',')}, 0)`;

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

import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

import { PATTERN_PATH, PATTERN_VIEWBOX } from './pattern-path';

const rgb = (triplet: string) => `rgb(${triplet.trim().split(/\s+/).join(', ')})`;

const [, , PATTERN_WIDTH, PATTERN_HEIGHT] = PATTERN_VIEWBOX.split(' ').map(Number);

/**
 * How present the pattern is, and how it dissolves.
 *
 * Two passes of the same path stack up: a broad `base` wash carrying a long
 * gentle tail, and a brighter `peak` glow concentrated at the top. The header
 * reads at roughly `base + peak * (1 - base)` where they overlap. These sit at
 * 0.3 / 0.7, lifted from the export's 0.2 / 0.6 because that read too faint on
 * device.
 *
 * Each pass ramps to fully transparent at its own `FADE_END`, given as a
 * fraction of the pattern's height. The export left the base pass at a constant
 * opacity with no ramp at all, so it never reached zero - it carried a flat wash
 * to the bottom of the shape and then simply stopped, which is a visible edge no
 * matter how faint. Ramping both is what actually dissolves the pattern; ending
 * the glow well before the wash is what keeps the falloff from reading linear.
 */
const PATTERN_BASE_OPACITY = 0.3;
const PATTERN_PEAK_OPACITY = 0.7;
const PATTERN_BASE_FADE_END = 1;
const PATTERN_PEAK_FADE_END = 0.55;

/**
 * The arabesque header pattern behind the auth and onboarding screens, drawn
 * in the active masjid's colors: a broad wash in the tenant's accent, then the
 * same path again as a brighter glow, each ramping to transparent so the
 * pattern dissolves into the background rather than ending on an edge.
 *
 * Replaces a direct `assets/onboarding/pattern.svg` import, which shipped
 * Sahla's gold and green to every tenant. Drop-in: same props, same geometry.
 */
export function OnboardingPattern({
  width = '100%',
  height = '100%',
  preserveAspectRatio = 'xMidYMin slice',
}: {
  width?: number | string;
  height?: number | string;
  preserveAspectRatio?: string;
}) {
  const { colors } = useMasjidConfig();
  const accent = rgb(colors.onboardingAccent);

  return (
    <Svg
      width={width}
      height={height}
      viewBox={PATTERN_VIEWBOX}
      preserveAspectRatio={preserveAspectRatio}
      fill="none"
    >
      <Defs>
        {/* Both ramps end fully transparent, so only the closing stop's *alpha*
            matters - its color is the accent purely to keep the ramp free of a
            grey cast on Android, where a transparent black tints the midpoints.
            A stop short of offset 1 holds its value for the remainder, so the
            glow stays at zero below its fade end rather than reappearing. */}
        <LinearGradient
          id="onboardingPatternWash"
          x1="212"
          y1="0"
          x2="212"
          y2={PATTERN_HEIGHT}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor={accent} stopOpacity={PATTERN_BASE_OPACITY} />
          <Stop offset={PATTERN_BASE_FADE_END} stopColor={accent} stopOpacity={0} />
        </LinearGradient>
        <LinearGradient
          id="onboardingPatternGlow"
          x1="212"
          y1="0"
          x2="212"
          y2={PATTERN_HEIGHT}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor={accent} stopOpacity={PATTERN_PEAK_OPACITY} />
          <Stop offset={PATTERN_PEAK_FADE_END} stopColor={accent} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={PATTERN_PATH} fill="url(#onboardingPatternWash)" />
      <Path d={PATTERN_PATH} fill="url(#onboardingPatternGlow)" />
    </Svg>
  );
}

/**
 * How far the pattern is pulled above the top edge, in the pattern's own
 * 424-wide user space. Cropping the first row of the arabesque against the
 * status bar makes it read as continuing off-screen rather than starting at it.
 *
 * Figma uses 30; this sits at half that, which keeps the crop while dropping
 * the pattern back down the screen. Raising it toward 30 pulls it up again, 0
 * sits the pattern flush against the top edge.
 */
const PATTERN_TOP_CROP = 15 / PATTERN_WIDTH;

/**
 * The pattern as a screen header, pinned to the top edge.
 *
 * Callers used to size this themselves with a percentage of screen height and
 * let `slice` crop whatever overflowed. That crops the fade too: the gradient
 * above runs the full height of the viewBox, so any vertical crop cuts it off
 * part-way down its ramp and the pattern ends in a hard horizontal line
 * instead of dissolving into the background. Worse, whether it cropped at all
 * depended on the device's aspect ratio - the fade completed exactly on a tall
 * phone but was cut at ~86% on an iPhone SE and ~70% on an iPad.
 *
 * Locking the box to the pattern's own aspect ratio makes the gradient's end
 * stop land exactly on the bottom edge, so the fade completes at every screen
 * size and there is nothing left to crop.
 */
export function OnboardingPatternHeader() {
  return (
    <View
      pointerEvents="none"
      className="absolute inset-x-0 top-0"
      style={{
        aspectRatio: PATTERN_WIDTH / PATTERN_HEIGHT,
        // A percentage margin resolves against the parent's width, which is the
        // same basis the crop is expressed in - so the offset scales with the
        // pattern at any screen width, where a fixed pt value would not.
        marginTop: `${-PATTERN_TOP_CROP * 100}%`,
      }}
    >
      <OnboardingPattern />
    </View>
  );
}

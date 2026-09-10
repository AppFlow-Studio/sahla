import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

import { PATTERN_PATH, PATTERN_VIEWBOX } from './pattern-path';

const rgb = (triplet: string) => `rgb(${triplet.trim().split(/\s+/).join(', ')})`;

/**
 * The arabesque header pattern behind the auth and onboarding screens, drawn
 * in the active masjid's colors: a flat pass in the tenant's accent, then the
 * same path again under an accent-to-transparent gradient that fades it into
 * the background.
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
        <LinearGradient
          id="onboardingPatternFade"
          x1="212"
          y1="0"
          x2="212"
          y2="262"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor={accent} stopOpacity={0.6} />
          {/* Fully transparent, so only the stop's *alpha* matters here — the
              color is the accent purely to keep the ramp free of a grey cast
              on Android, where a transparent black would tint the midpoints. */}
          <Stop offset="1" stopColor={accent} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={PATTERN_PATH} fill={accent} />
      <Path d={PATTERN_PATH} fill="url(#onboardingPatternFade)" />
    </Svg>
  );
}

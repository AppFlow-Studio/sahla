import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import MasjidLogo from '@/assets/masjid-logo.svg';
import { useFontFamily } from '@/src/hooks/use-font-family';
import { useConfigStore } from '@/src/stores/config-store';

/** "10 38 30" -> "rgba(10, 38, 30, 0.5)" */
function rgba(triplet: string, alpha: number) {
  return `rgba(${triplet.trim().split(/\s+/).join(', ')}, ${alpha})`;
}

const RING_COUNT = 3;
const RING_SIZE = 132;
const RIPPLE_DURATION = 4200;

/**
 * One expanding ring of the ripple. All rings read the same clock and offset
 * themselves by `phase`, so the stagger stays locked no matter how long the
 * screen is open — separate per-ring loops drift apart over time.
 */
function Ring({
  progress,
  phase,
  color,
}: {
  progress: SharedValue<number>;
  phase: number;
  color: string;
}) {
  const style = useAnimatedStyle(() => {
    const p = (progress.value + phase) % 1;
    return {
      transform: [{ scale: interpolate(p, [0, 1], [0.55, 1.9]) }],
      // Quick fade-in off the mark, long fade-out as it travels.
      opacity: interpolate(p, [0, 0.12, 1], [0, 0.5, 0]),
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: RING_SIZE,
          height: RING_SIZE,
          borderRadius: RING_SIZE / 2,
          borderWidth: 1,
          borderColor: color,
        },
        style,
      ]}
    />
  );
}

/**
 * Shown on Watch when the masjid has published no reels yet. A calm ripple
 * radiating off the masjid mark, in place of the bare black screen.
 */
export function ReelsEmptyState() {
  const { t } = useTranslation();
  const fonts = useFontFamily();
  const brand = useConfigStore((s) => s.config.colors);
  const reducedMotion = useReducedMotion();

  const progress = useSharedValue(0);
  const breathe = useSharedValue(0);
  const entrance = useSharedValue(reducedMotion ? 1 : 0);
  const textEntrance = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      entrance.value = 1;
      textEntrance.value = 1;
      return;
    }
    entrance.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
    // Text fades up a beat behind the mark.
    textEntrance.value = withDelay(
      220,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
    progress.value = withRepeat(
      withTiming(1, { duration: RIPPLE_DURATION, easing: Easing.linear }),
      -1,
      false,
    );
    breathe.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [reducedMotion, entrance, textEntrance, progress, breathe]);

  const markStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [
      { scale: interpolate(entrance.value, [0, 1], [0.82, 1]) },
      { scale: interpolate(breathe.value, [0, 1], [1, 1.05]) },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textEntrance.value,
    transform: [{ translateY: interpolate(textEntrance.value, [0, 1], [14, 0]) }],
  }));

  const accent = rgba(brand.accent, 1);

  return (
    <View
      className="flex-1 items-center justify-center px-10"
      style={{ backgroundColor: rgba(brand.primary, 1) }}
    >
      <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }}>
        {Array.from({ length: RING_COUNT }, (_, i) => (
          <Ring
            key={i}
            progress={progress}
            phase={i / RING_COUNT}
            color={rgba(brand.accent, 0.55)}
          />
        ))}

        <Animated.View
          style={[
            {
              width: 76,
              height: 76,
              borderRadius: 38,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: rgba(brand.accent, 0.1),
              borderWidth: 0.5,
              borderColor: rgba(brand.accent, 0.25),
            },
            markStyle,
          ]}
        >
          <MasjidLogo width={34} height={34} color={accent} />
        </Animated.View>
      </View>

      <Animated.View style={[{ alignItems: 'center', marginTop: 34 }, textStyle]}>
        <Text
          style={{
            color: rgba(brand.background, 1),
            fontSize: 20,
            fontFamily: fonts.display,
            textAlign: 'center',
          }}
        >
          {t('watch.noReels')}
        </Text>
        <Text
          style={{
            marginTop: 10,
            color: rgba(brand.background, 0.55),
            fontSize: 13,
            lineHeight: 19,
            fontFamily: fonts.body,
            textAlign: 'center',
          }}
        >
          {t('watch.noReelsBody')}
        </Text>
      </Animated.View>
    </View>
  );
}

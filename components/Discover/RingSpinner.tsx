import { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

/**
 * Elegant rotating ring spinner — the stroke fades from solid to transparent
 * around the circle (round gradient angle loop), continuously rotating.
 * Used as the pull-to-refresh indicator.
 */
export default function RingSpinner({
  color,
  size = 30,
  strokeWidth = 3,
}: {
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const rot = useSharedValue(0);

  useEffect(() => {
    rot.value = withRepeat(
      withTiming(1, { duration: 850, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rot]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value * 360}deg` }],
  }));

  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  // Draw ~72% of the ring; the gradient handles the fade to transparent so
  // the tail tapers off rather than ending in a hard edge.
  const arc = circumference * 0.72;

  return (
    <Animated.View style={[{ width: size, height: size }, spinStyle]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="refreshRingGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity="1" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#refreshRingGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${arc} ${circumference}`}
        />
      </Svg>
    </Animated.View>
  );
}

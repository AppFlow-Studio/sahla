import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

// Pulsing placeholder block — same opacity-pulse style used by the
// Saved Programs & Events skeleton so the loading/reload state feels
// consistent across screens.
function SkeletonPulse({
  width,
  height,
  radius = 6,
  style,
}: {
  width: number | `${number}%`;
  height: number;
  radius?: number;
  style?: any;
}) {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.85, { duration: 850 }), -1, true);
  }, [opacity]);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: "rgba(10,38,30,0.08)" },
        animStyle,
        style,
      ]}
    />
  );
}

// A single horizontal "card" placeholder (image block + two text lines).
function SkeletonCard() {
  return (
    <View style={{ width: 148, marginRight: 14 }}>
      <SkeletonPulse width={148} height={168} radius={16} />
      <SkeletonPulse width="80%" height={12} radius={6} style={{ marginTop: 10 }} />
      <SkeletonPulse width="50%" height={10} radius={5} style={{ marginTop: 7 }} />
    </View>
  );
}

// A single list-row placeholder (thumbnail + two text lines).
function SkeletonRow() {
  return (
    <View className="flex-row items-center" style={{ paddingVertical: 12 }}>
      <SkeletonPulse width={54} height={54} radius={12} style={{ marginRight: 14 }} />
      <View className="flex-1">
        <SkeletonPulse width="60%" height={12} radius={6} />
        <SkeletonPulse width="40%" height={10} radius={5} style={{ marginTop: 7 }} />
      </View>
    </View>
  );
}

/**
 * Full-screen skeleton for the Discover content area. Mirrors the rough
 * shape of the "All" tab (a section title, a horizontal card rail, then a
 * list of rows) so the reload state reads as a real layout, not a spinner.
 */
export default function DiscoverSkeleton() {
  return (
    <View className="px-6" style={{ marginTop: 24 }}>
      {/* Recommended rail */}
      <SkeletonPulse width="45%" height={16} radius={6} />
      <View className="flex-row" style={{ marginTop: 14 }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>

      {/* Upcoming events list */}
      <SkeletonPulse width="40%" height={16} radius={6} style={{ marginTop: 28 }} />
      <View style={{ marginTop: 6 }}>
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </View>
    </View>
  );
}

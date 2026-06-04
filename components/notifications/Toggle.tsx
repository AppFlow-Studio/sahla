import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const INK = '#0A261E';
const TOGGLE_OFF_BG = 'rgba(10,38,30,0.2)';
const THUMB = '#FCFCFD';

const SPRING_CONFIG = { damping: 18, stiffness: 200, mass: 0.8 };

type Props = {
  value: boolean;
  onChange: (next: boolean) => void;
};

export function Toggle({ value, onChange }: Props) {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, SPRING_CONFIG);
  }, [value]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [TOGGLE_OFF_BG, INK],
    ),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 16 }],
  }));

  return (
    <Pressable onPress={() => onChange(!value)} hitSlop={10}>
      <Animated.View
        style={[
          {
            width: 36,
            height: 20,
            borderRadius: 12,
            padding: 2,
            justifyContent: 'center',
          },
          trackStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              width: 16,
              height: 16,
              borderRadius: 999,
              backgroundColor: THUMB,
              shadowColor: '#101828',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 1,
            },
            thumbStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

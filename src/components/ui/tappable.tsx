import { useState, type ReactNode } from 'react';
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  /** Opacity while held down. */
  activeOpacity?: number;
  children?: ReactNode;
};

/**
 * A `Pressable` that dims while held.
 *
 * A bare `Pressable` gives no feedback on either platform. That reads as fine
 * on iOS, where the work behind a tap usually lands within a frame or two, but
 * on Android — where opening a `Modal` means building a whole new Dialog window
 * and mounting its screen synchronously — the button looks dead for long enough
 * that the tap feels dropped, and people tap again.
 *
 * Dimming is deliberately used instead of `android_ripple`: a ripple would make
 * Android diverge further from iOS, and the point here is that they match.
 *
 * The pressed state is tracked by hand rather than with `Pressable`'s
 * `style={({pressed}) => ...}` callback. NativeWind owns the JSX runtime for
 * this app (`jsxImportSource: 'nativewind'` in `babel.config.js`) and
 * normalises every `style` prop it sees; a function never survives that, so the
 * callback form silently drops the style altogether and the view lays out
 * unstyled. Keep `style` a plain array here.
 */
export function Tappable({
  style,
  activeOpacity = 0.55,
  children,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      style={[style, pressed ? { opacity: activeOpacity } : null]}
      onPressIn={(e: GestureResponderEvent) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        setPressed(false);
        onPressOut?.(e);
      }}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

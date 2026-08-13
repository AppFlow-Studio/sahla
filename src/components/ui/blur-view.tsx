import {
  createContext,
  forwardRef,
  useContext,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import { BlurView } from 'expo-blur';

/**
 * `expo-blur` does **not** blur on Android out of the box. Its default
 * `experimentalBlurMethod="none"` just paints a flat translucent rectangle;
 * only the Dimezis backend does a real backdrop blur (see
 * `ExpoBlurView.setBlurMethod`). Every blur in the app therefore goes through
 * `AppBlurView` so the Android path is never accidentally left un-blurred.
 *
 * The Dimezis backend blurs the nearest `react-native-screens` Screen ancestor
 * (falling back to the activity content view), so it works inside an RN
 * `<Modal>` too — the backdrop blurs the app underneath.
 */
const ANDROID_BLUR_METHOD = Platform.OS === 'android' ? 'dimezisBlurView' : 'none';

/**
 * True while rendering inside an `AppBlurView`.
 *
 * Nested backdrop blurs are not safe on Android: the inner Dimezis view
 * snapshots the same root as the outer one, so it re-blurs content the outer
 * blur has not composited yet — which flickers and double-darkens. Surfaces
 * that can end up nested check this and fall back to a solid fill instead.
 */
const InsideBlurContext = createContext(false);

export const useInsideBlur = () => useContext(InsideBlurContext);

type Props = ComponentProps<typeof BlurView> & { children?: ReactNode };

/**
 * A `BlurView` that actually blurs on Android. Use this instead of `BlurView`.
 *
 * Ref-forwarding matters: `GestureDetector` attaches a ref to its single child,
 * and the tab bar wraps this component directly.
 */
export const AppBlurView = forwardRef<BlurView, Props>(function AppBlurView(
  { children, ...props },
  ref,
) {
  return (
    <BlurView ref={ref} experimentalBlurMethod={ANDROID_BLUR_METHOD} {...props}>
      <InsideBlurContext.Provider value={true}>{children}</InsideBlurContext.Provider>
    </BlurView>
  );
});

/**
 * Re-express a color at the given alpha, so a solid fallback fill can be turned
 * into a scrim that still lets a blur read through it.
 *
 * Handles the formats the app's palettes actually use — `#rgb`, `#rrggbb`,
 * `rgb()` and `rgba()`. Anything else is returned untouched (better a slightly
 * too-opaque surface than an invalid color string).
 */
export function withAlpha(color: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));

  const hex = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1];
    const full = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  const rgb = color.trim().match(/^rgba?\(([^)]+)\)$/i);
  if (rgb) {
    const [r, g, b] = rgb[1].split(',').map((p) => p.trim());
    if (r && g && b) return `rgba(${r},${g},${b},${a})`;
  }

  return color;
}

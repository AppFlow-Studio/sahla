import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { BlurTint } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

import { AppBlurView, useInsideBlur, withAlpha } from '@/src/components/ui/blur-view';

/**
 * True only on iOS 26+.
 *
 * `expo-glass-effect` ships no Android implementation at all — its fallback is
 * a bare `<View {...props}/>` — and every path in its iOS code is gated behind
 * `#available(iOS 26.0, *)`. So on Android *and* on iOS < 26 (this app's
 * deployment target is 16.0) a plain `<GlassView>` renders as a fully
 * transparent view with no background whatsoever.
 */
export const LIQUID_GLASS = isLiquidGlassAvailable();

type Props = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  glassEffectStyle?: ComponentProps<typeof GlassView>['glassEffectStyle'];
  isInteractive?: boolean;
  /** Tint the fallback blur, and the opaque fill when blur is unavailable.
   *  Required — the whole point of this wrapper is that the surface never
   *  ends up invisible. */
  fallbackColor: string;
  /** Optional hairline border, to keep the fallback from reading as a flat slab. */
  fallbackBorderColor?: string;
  /** Blur strength for the fallback. Higher = more frosted, less see-through. */
  fallbackIntensity?: number;
  /** Blur tint. Defaults to `'default'`, which follows the system theme. */
  fallbackTint?: BlurTint;
  /** Alpha of the `fallbackColor` scrim painted over the blur. Raise it when
   *  content on the surface needs more contrast, lower it to show more of the
   *  background through. */
  fallbackScrimOpacity?: number;
  /** Opt out of the blur and use a solid `fallbackColor` fill instead. For
   *  surfaces that resize or re-lay-out every frame, where Android's blur
   *  backend is too expensive to re-snapshot. */
  fallbackBlur?: boolean;
};

/**
 * A `GlassView` that degrades to a blurred surface instead of vanishing.
 *
 * On iOS 26+ this is real liquid glass. Everywhere else — Android and
 * iOS 16–25 — it renders a backdrop blur tinted with `fallbackColor`, which
 * keeps the frosted look glass was chosen for. If a blur can't be used (nested
 * inside another blur, or `fallbackBlur={false}`) it degrades once more to a
 * solid `fallbackColor` fill, so the surface is never invisible.
 *
 * Use this anywhere glass provides the *background* for content sitting on top
 * of something else. Plain `<GlassView>` is only safe when the surface is
 * decorative and the content stays legible without it.
 */
export function GlassSurface({
  children,
  style,
  glassEffectStyle = 'regular',
  isInteractive,
  fallbackColor,
  fallbackBorderColor,
  fallbackIntensity = 40,
  fallbackTint = 'default',
  fallbackScrimOpacity = 0.55,
  fallbackBlur = true,
}: Props) {
  // Hooks must run unconditionally, so this is read even on the glass path.
  const insideBlur = useInsideBlur();

  if (LIQUID_GLASS) {
    return (
      <GlassView glassEffectStyle={glassEffectStyle} isInteractive={isInteractive} style={style}>
        {children}
      </GlassView>
    );
  }

  const border = fallbackBorderColor
    ? { borderWidth: StyleSheet.hairlineWidth, borderColor: fallbackBorderColor }
    : null;

  // A blur inside a blur double-composites on Android — see `useInsideBlur`.
  if (!fallbackBlur || insideBlur) {
    return <View style={[style, { backgroundColor: fallbackColor }, border]}>{children}</View>;
  }

  return (
    <AppBlurView
      intensity={fallbackIntensity}
      tint={fallbackTint}
      // `overflow: hidden` so the blur is clipped by the surface's corner
      // radius rather than spilling out as a square.
      style={[style, { overflow: 'hidden', backgroundColor: 'transparent' }, border]}
    >
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: withAlpha(fallbackColor, fallbackScrimOpacity) }]}
      />
      {children}
    </AppBlurView>
  );
}

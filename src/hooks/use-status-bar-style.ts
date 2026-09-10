import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle, type StatusBarStyle } from 'expo-status-bar';
import { useCallback, useRef } from 'react';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { relativeLuminance } from '@/src/lib/color';

/**
 * Reasserts the status bar style whenever this screen gains focus.
 *
 * The native bottom tabs keep every screen mounted, so the declarative
 * <StatusBar> component is unreliable — whichever tab mounted last wins and it
 * never updates on tab switch. Setting it on focus fixes that, as long as every
 * tab uses this hook (each focus overrides the previous tab's choice).
 */
export function useStatusBarStyle(style: StatusBarStyle) {
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(style);
    }, [style]),
  );
}

/**
 * Auto-picks a status-bar style from the RGB triplet of the surface the
 * status bar sits on top of. Dark surface → white icons (`'light'`), light
 * surface → black icons (`'dark'`). The tenant admin controls the surface
 * color via the CRM, so screens can pass e.g. `colors.primary` and the
 * time/wifi/battery cluster stays legible on any theme.
 *
 * Threshold at 0.55 keeps mid-tone brand colors (gold, warm blue, sage)
 * on the light-icon side rather than flip-flopping.
 */
export function useAutoStatusBarStyle(surfaceTriplet: string) {
  const style: StatusBarStyle =
    relativeLuminance(surfaceTriplet) >= 0.55 ? 'dark' : 'light';
  useStatusBarStyle(style);
}

/**
 * Compute the correct icon style for a given surface triplet without
 * subscribing via `useStatusBarStyle`. Used inline by screens that need
 * to flip the bar as the user scrolls between two different-colored
 * surfaces (e.g. Home's dark primary header → light background body).
 */
export function statusBarStyleFor(surfaceTriplet: string): 'light' | 'dark' {
  return relativeLuminance(surfaceTriplet) >= 0.55 ? 'dark' : 'light';
}

/**
 * Imperative setter — re-export from `expo-status-bar` so screens can drive
 * the bar directly from scroll handlers without importing the underlying
 * module. Callers should still hold a ref of the last-set style to skip
 * redundant calls per scroll frame.
 */
export { setStatusBarStyle } from 'expo-status-bar';

/**
 * Scroll-aware status bar for screens that transition between two
 * differently-colored surfaces as the user scrolls (e.g. Home / Profile:
 * dark themed header on top, light body below, scroll brings body up
 * under the status bar).
 *
 * Returns handlers to wire into the ScrollView (`onScroll`) and the
 * boundary View that marks where the bottom surface begins (`onLayout`).
 * Everything else — luminance-based style choice, redundant-call gating,
 * re-assertion on tab focus — is handled inside.
 *
 * Both surface triplets go through `statusBarStyleFor`, so this stays
 * tenant-neutral: swap the CRM colors and the flip logic still works in
 * either direction.
 *
 *   const status = useScrollAwareStatusBar({
 *     topSurface: colors.primary,      // dark header
 *     bottomSurface: colors.background, // light body
 *   });
 *   ...
 *   <ScrollView onScroll={status.onScroll} scrollEventThrottle={16}>
 *     <Header />
 *     <View onLayout={status.onLayoutBottomSurface}> ... </View>
 *   </ScrollView>
 */
export function useScrollAwareStatusBar(opts: {
  topSurface: string;
  bottomSurface: string;
}) {
  const { topSurface, bottomSurface } = opts;
  const insets = useSafeAreaInsets();
  const bodyTopY = useRef<number | null>(null);
  const currentStyleRef = useRef<'light' | 'dark' | null>(null);
  const topStyle = statusBarStyleFor(topSurface);
  const bottomStyle = statusBarStyleFor(bottomSurface);

  const apply = useCallback((style: 'light' | 'dark') => {
    if (currentStyleRef.current === style) return;
    currentStyleRef.current = style;
    setStatusBarStyle(style);
  }, []);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      if (bodyTopY.current == null) {
        apply(topStyle);
        return;
      }
      // When the top of the bottom-surface View has climbed above the
      // status-bar bottom edge, the icons sit on the bottom surface.
      const bodyTopOnScreen = bodyTopY.current - y;
      apply(bodyTopOnScreen <= insets.top ? bottomStyle : topStyle);
    },
    [apply, insets.top, topStyle, bottomStyle],
  );

  const onLayoutBottomSurface = useCallback((e: LayoutChangeEvent) => {
    bodyTopY.current = e.nativeEvent.layout.y;
  }, []);

  // Re-assert on focus so a tab switch doesn't inherit the previous tab's
  // style. Force a fresh eval by clearing the cache, then applying the
  // last-known style (or the top style if we haven't scrolled yet).
  useFocusEffect(
    useCallback(() => {
      const style = currentStyleRef.current ?? topStyle;
      currentStyleRef.current = null;
      apply(style);
    }, [apply, topStyle]),
  );

  return { onScroll, onLayoutBottomSurface };
}

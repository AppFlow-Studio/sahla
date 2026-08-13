import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  I18nManager,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBarButton } from '@/src/components/navigation/tab-bar-button';
import { AppBlurView } from '@/src/components/ui/blur-view';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

/** Route order, matching `<NativeTabs>` in `(main)/_layout`. */
const TAB_ROUTES = ['index', 'discover', 'watch', 'prayer', 'profile'];

const BAR_PADDING = 6;

/** Bar height: button box (56, see `buttonWrapper`) + vertical padding. */
export const TAB_BAR_HEIGHT = 56 + BAR_PADDING * 2;

/** Gap between the bar and the bottom safe-area edge. */
export const TAB_BAR_GAP = 8;

/**
 * Bottom padding a scrolling screen needs so its last row clears the floating
 * bar. Excludes the safe-area inset — add `insets.bottom` on top if the screen
 * doesn't already account for it. Every tab screen currently exceeds this, so
 * nothing needs changing; it's here for new screens.
 */
export const TAB_BAR_CLEARANCE = TAB_BAR_HEIGHT + TAB_BAR_GAP + 14;

/**
 * The floating fallback tab bar, used wherever iOS 26's liquid-glass
 * `<NativeTabs>` isn't available — Android, and iOS 16–25.
 *
 * A blurred, rounded pill floating above the bottom inset, with a capsule that
 * slides to the active tab. The capsule can also be dragged between tabs.
 *
 * Because it's absolutely positioned it does NOT reserve layout space, so
 * screens need their own bottom padding to clear it (see `TAB_BAR_CLEARANCE`).
 */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors } = useMasjidConfig();
  const [dimensions, setDimensions] = useState({ height: 0, width: 0 });

  const rgb = (triplet: string, alpha = 1) => {
    const v = triplet.replace(/ /g, ',');
    return alpha === 1 ? `rgb(${v})` : `rgba(${v},${alpha})`;
  };
  const activeColor = rgb(colors.accent);
  const inactiveColor = rgb(colors.foreground, 0.45);
  const barTint = rgb(colors.background, 0.65);
  const capsuleColor = rgb(colors.accent, 0.14);
  const borderColor = rgb(colors.background, 0.5);

  const visibleRoutes = state.routes.filter((r) => TAB_ROUTES.includes(r.name));
  const count = visibleRoutes.length;

  const onTabbarLayout = (e: LayoutChangeEvent) => {
    setDimensions({
      height: e.nativeEvent.layout.height,
      width: e.nativeEvent.layout.width,
    });
  };

  const tabWidth = count > 0 ? (dimensions.width - BAR_PADDING * 2) / count : 0;
  const translateX = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const activeIndex = visibleRoutes.findIndex(
    (r) => r.name === state.routes[state.index]?.name,
  );

  // The row mirrors under forced RTL but `left`/translateX stay physical, so
  // the capsule has to be positioned by visual slot, not by route index.
  const toVisual = useCallback(
    (i: number) => (I18nManager.isRTL ? count - 1 - i : i),
    [count],
  );

  const handleNavigate = useCallback(
    (visualIndex: number) => {
      const routeIndex = I18nManager.isRTL ? count - 1 - visualIndex : visualIndex;
      const route = visibleRoutes[routeIndex];
      if (!route) return;
      if (state.routes[state.index]?.name !== route.name) {
        navigation.navigate(route.name, route.params);
      }
    },
    [count, navigation, state.index, state.routes, visibleRoutes],
  );

  // Resolved on the JS thread during render so the pan worklet can capture a
  // plain number. Calling `toVisual` from inside a gesture callback crashes the
  // app outright — those callbacks run on the UI thread, where a non-worklet
  // function isn't callable.
  const activeVisual = toVisual(activeIndex);

  useEffect(() => {
    if (activeIndex !== -1 && tabWidth > 0 && !isDragging.value) {
      translateX.value = withTiming(activeVisual * tabWidth, { duration: 250 });
    }
  }, [activeIndex, activeVisual, tabWidth, translateX, isDragging]);

  // Memoized: a fresh Gesture.Pan() on every render means gesture-handler
  // re-attaches the handler each time, which is a real cost on the hot path.
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          isDragging.value = true;
        })
        .onUpdate((event) => {
          const maxTranslate = (count - 1) * tabWidth;
          const start = activeVisual * tabWidth;
          translateX.value = Math.max(0, Math.min(start + event.translationX, maxTranslate));
        })
        .onEnd(() => {
          if (tabWidth <= 0) return;
          const nearest = Math.round(translateX.value / tabWidth);
          const clamped = Math.max(0, Math.min(nearest, count - 1));
          translateX.value = withTiming(clamped * tabWidth, { duration: 200 }, () => {
            isDragging.value = false;
          });
          runOnJS(handleNavigate)(clamped);
        }),
    [activeVisual, count, tabWidth, handleNavigate, translateX, isDragging],
  );

  const animatedCapsuleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: tabWidth,
  }));

  // Screens can still hide the bar via `options.tabBarStyle = { display: 'none' }`.
  const focusedOptions = descriptors[state.routes[state.index].key]?.options;
  const tabBarStyle = StyleSheet.flatten(focusedOptions?.tabBarStyle) as
    | { display?: string }
    | undefined;
  if (tabBarStyle?.display === 'none') return null;

  return (
    <View style={[styles.container, { bottom: insets.bottom + 8 }]}>
      <GestureDetector gesture={panGesture}>
        <AppBlurView intensity={80} tint="light" style={[styles.blur, { borderColor }]}>
          <View onLayout={onTabbarLayout} style={[styles.tabbar, { backgroundColor: barTint }]}>
            {dimensions.width > 0 && tabWidth > 0 ? (
              <Animated.View style={[styles.capsuleWrap, animatedCapsuleStyle]}>
                <View style={[styles.capsule, { backgroundColor: capsuleColor }]} />
              </Animated.View>
            ) : null}

            {visibleRoutes.map((route, i) => {
              const { options } = descriptors[route.key];
              const isFocused = state.routes[state.index].name === route.name;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  // Move the capsule immediately rather than waiting for the
                  // navigation state to commit and re-render — otherwise the
                  // bar visibly lags behind the tap while the next screen mounts.
                  if (tabWidth > 0) {
                    translateX.value = withTiming(toVisual(i) * tabWidth, { duration: 220 });
                  }
                  navigation.navigate(route.name, route.params);
                }
              };

              const onLongPress = () => {
                navigation.emit({ type: 'tabLongPress', target: route.key });
              };

              const labelKey = route.name === 'index' ? 'home' : route.name;
              const label =
                typeof options.title === 'string' ? options.title : t(`tabs.${labelKey}`);

              return (
                <TabBarButton
                  key={route.key}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  isFocused={isFocused}
                  routeName={route.name}
                  label={label}
                  activeColor={activeColor}
                  inactiveColor={inactiveColor}
                  dotRingColor={rgb(colors.background)}
                />
              );
            })}
          </View>
        </AppBlurView>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 100,
    alignItems: 'center',
  },
  blur: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 35,
    overflow: 'hidden',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: { elevation: 8 },
    }),
  },
  tabbar: {
    flexDirection: 'row',
    padding: BAR_PADDING,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  capsuleWrap: {
    position: 'absolute',
    height: '100%',
    top: BAR_PADDING,
    left: BAR_PADDING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capsule: {
    // Original proportions — slightly overflows its slot so it reads as a
    // rounded pill hugging the icon rather than a tight box.
    width: '105%',
    height: '110%',
    borderRadius: 28,
  },
});

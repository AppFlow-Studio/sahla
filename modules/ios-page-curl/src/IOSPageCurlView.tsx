import { requireNativeView } from 'expo';
import React, { useCallback } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export type IOSPageCurlViewProps = {
  /** Current page number (1-based, matches the existing PageTurnView API). */
  pageNumber: number;
  totalPages: number;
  /** RTL: page-curl gesture forward visually = lower-to-higher page number. */
  direction?: 'rtl' | 'ltr';
  onPageChange: (newPage: number) => void;
  pageBackgroundColor?: string;
  renderPage: (pageNumber: number) => React.ReactNode;
  /**
   * Fires on a single tap (no swipe). Use this to toggle the screen's
   * floating chrome (back button / bottom sheet) like Apple Books.
   */
  onTap?: () => void;
  style?: StyleProp<ViewStyle>;
};

type NativeViewProps = {
  direction: 'rtl' | 'ltr';
  /** Bumped any time pageNumber changes — native reseeds the controller. */
  pageIndex: number;
  /** False on the first page so the prev gesture snap-backs. */
  hasPrev: boolean;
  /** False on the last page so the next gesture snap-backs. */
  hasNext: boolean;
  onPageTurn: (event: { nativeEvent: { delta: 1 | -1 } }) => void;
  onTap?: (event: { nativeEvent: Record<string, never> }) => void;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

// iOS-only: requireNativeView throws on Android. The consumer should
// only mount this view on iOS — see MushafPageScreen's Platform branch.
const NativeView =
  Platform.OS === 'ios'
    ? requireNativeView<NativeViewProps>('IOSPageCurl')
    : null;

/**
 * Apple Books / iBooks page curl, native UIPageViewController with
 * `.pageCurl` transition style. iOS only. The caller renders pages via
 * a `renderPage(pageNumber)` callback — we mount three children in the
 * fixed order [prev, current, next] and the native side wraps each in
 * a UIViewController for the page controller's data source.
 */
export function IOSPageCurlView({
  pageNumber,
  totalPages,
  direction = 'rtl',
  onPageChange,
  pageBackgroundColor,
  renderPage,
  onTap,
  style,
}: IOSPageCurlViewProps) {
  const handleTap = useCallback(() => {
    onTap?.();
  }, [onTap]);

  const handlePageTurn = useCallback(
    (event: { nativeEvent: { delta: 1 | -1 } }) => {
      const delta = event.nativeEvent.delta;
      const next = pageNumber + delta;
      if (next < 1 || next > totalPages) return;
      onPageChange(next);
    },
    [pageNumber, totalPages, onPageChange],
  );

  if (Platform.OS !== 'ios' || NativeView == null) {
    // Defensive — caller is expected to gate on Platform.OS, but if
    // they don't we render the current page directly with no curl.
    return (
      <View style={[styles.fallback, { backgroundColor: pageBackgroundColor }, style]}>
        {renderPage(pageNumber)}
      </View>
    );
  }

  const childStyle: ViewStyle = {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: pageBackgroundColor,
  };

  const prevNum = pageNumber - 1;
  const nextNum = pageNumber + 1;
  const hasPrev = prevNum >= 1;
  const hasNext = nextNum <= totalPages;

  // Order matters — the native side reads subviews[0]=prev,
  // subviews[1]=current, subviews[2]=next.
  return (
    <NativeView
      direction={direction}
      pageIndex={pageNumber}
      hasPrev={hasPrev}
      hasNext={hasNext}
      onPageTurn={handlePageTurn}
      onTap={onTap ? handleTap : undefined}
      style={[styles.fill, style]}
    >
      <View style={childStyle}>{hasPrev ? renderPage(prevNum) : null}</View>
      <View style={childStyle}>{renderPage(pageNumber)}</View>
      <View style={childStyle}>{hasNext ? renderPage(nextNum) : null}</View>
    </NativeView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  fallback: { flex: 1 },
});

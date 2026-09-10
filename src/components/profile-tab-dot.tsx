import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NudgeDot } from '@/src/components/ui/nudge-dot';
import { useSetupCompleteness } from '@/src/hooks/use-setup-completeness';

// ── Position tuning for the iOS 26 floating tab bar ──────────────────────────
// Profile is the 5th of 5 tabs, so the dot sits near the right edge, at the
// top-right of the person icon. If the dot doesn't land exactly on the icon,
// nudge these two numbers (RIGHT = distance from the screen's right edge as a
// fraction of width; BOTTOM = px above the bottom safe-area inset).
const RIGHT_FRACTION = 0.127;
const BOTTOM_OFFSET = 32;
const DOT_SIZE = 9;

/**
 * A small custom attention dot drawn over the Profile tab — the lightweight,
 * sized-down alternative to the (fixed-size) native tab badge. Renders only when
 * a Profile nudge is active, and is fully non-interactive so it can never block
 * taps on the tab bar beneath it.
 *
 * Mounted as a sibling of `<NativeTabs>` in `(main)/_layout`.
 */
export function ProfileTabDot() {
  const setup = useSetupCompleteness();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Show whenever ANY setup step is outstanding (profile, personalization, or
  // notifications) — so notifications being off lights up the Profile tab too.
  // (The header "Complete Profile" CTA is the one gated to profile fields only.)
  // The overlay is tuned for the iOS floating bar, so keep it iOS-only.
  if (setup.incompleteCount === 0 || Platform.OS !== 'ios') return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <NudgeDot
        size={DOT_SIZE}
        style={{
          position: 'absolute',
          right: width * RIGHT_FRACTION,
          bottom: insets.bottom + BOTTOM_OFFSET,
          // Thin light ring so the dot reads clearly against the translucent bar.
          borderWidth: 1.5,
          borderColor: '#FFFFFF',
        }}
      />
    </View>
  );
}

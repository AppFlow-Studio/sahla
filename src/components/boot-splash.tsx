import { useAuth } from '@clerk/clerk-expo';
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { setStatusBarStyle } from 'expo-status-bar';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MasjidLogo from '@/assets/masjid-logo.svg';
import SahlaMark from '@/assets/images/sahla-mark.svg';
import { Icon } from '@/src/components/ui/icon';
import { useFontFamily } from '@/src/hooks/use-font-family';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useConfigStore } from '@/src/stores/config-store';

/** "10 38 30" -> "rgb(10, 38, 30)" */
function rgb(triplet: string) {
  return `rgb(${triplet.trim().split(/\s+/).join(', ')})`;
}
/** "10 38 30", 0.6 -> "rgba(10, 38, 30, 0.6)" */
function rgba(triplet: string, alpha: number) {
  return `rgba(${triplet.trim().split(/\s+/).join(', ')}, ${alpha})`;
}

/** How long the intro animation needs to land before we're allowed to leave. */
const MIN_VISIBLE_MS = 2400;
/** First launch only: how long to wait for the masjid's remote branding. */
const CONFIG_GRACE_MS = 2500;
/** Hard ceiling — a stalled network must never hold the app behind the splash. */
const MAX_VISIBLE_MS = 6000;
const EXIT_MS = 520;

const LOGO_BOX = 132;
/** Sahla's mark in the credit line, set a little larger than the wordmark. */
const MARK_SIZE = 26;

/**
 * Cold-boot only. A JS remount (fast refresh, a router reset) shouldn't replay
 * the intro — the module-level flag survives everything except a real restart.
 */
let alreadyPlayed = false;

/**
 * Sahla's attribution, the way Meetup credits Bending Spoons: quiet, at the
 * foot of the launch screen. The mark is Sahla's, but it's painted in the
 * masjid's own surface color — `assets/images/sahla-mark.svg` draws in
 * `currentColor` precisely so it can never hardcode one tenant's cream.
 */
const MadeBySahla = memo(function MadeBySahla({ cream }: { cream: string }) {
  const fonts = useFontFamily();
  return (
    <View style={styles.footer}>
      <View style={styles.footerLine}>
        <Text style={[styles.madeWith, { color: rgba(cream, 0.45), fontFamily: fonts.body }]}>
          Made with
        </Text>
        <Icon name="heart" size={11} color={rgba(cream, 0.45)} fill={rgba(cream, 0.45)} />
        <Text style={[styles.madeWith, { color: rgba(cream, 0.45), fontFamily: fonts.body }]}>
          by
        </Text>
      </View>
      <View style={styles.creditLine}>
        <SahlaMark width={MARK_SIZE} height={MARK_SIZE} color={rgba(cream, 0.82)} />
        <Text style={[styles.sahla, { color: rgba(cream, 0.82), fontFamily: fonts.bodySemibold }]}>
          Sahla
        </Text>
      </View>
    </View>
  );
});

/**
 * Branded launch screen, shown over the app while Clerk rehydrates its session
 * and the masjid's remote config lands.
 *
 * Nothing here is per-tenant in code: the logo, name, colors and font all come
 * from `MasjidConfig`, so a new masjid gets its own launch screen the moment
 * `scripts/generate-tenant.mjs` adds its config — no design work, no extra
 * asset. `logoUrl` is the masjid's uploaded icon (cached in MMKV from the
 * previous launch); the bundled brand glyph covers the very first run.
 *
 * It also owns hiding the *native* splash: that happens on our first layout,
 * so the boot reads as one continuous shot — the OS paints the masjid's brand
 * color (see `splashBackground` in app.config.ts), then this screen fades the
 * logo in on top of it, with no white frame in between.
 */
export function BootSplash() {
  const config = useMasjidConfig();
  const fonts = useFontFamily();
  const insets = useSafeAreaInsets();
  const { isLoaded: clerkLoaded } = useAuth();
  // Non-null once the masjid's row has been fetched at least once (persisted),
  // so returning users never wait on the network for their branding.
  const configSyncedAt = useConfigStore((s) => s.lastSyncedAt);

  const [done, setDone] = useState(alreadyPlayed);
  const [ready, setReady] = useState(false);
  const mountedAt = useRef(Date.now());

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.9);
  const breathe = useSharedValue(1);
  const nameOpacity = useSharedValue(0);
  const nameY = useSharedValue(8);
  const footerOpacity = useSharedValue(0);
  const rootOpacity = useSharedValue(1);
  const contentScale = useSharedValue(1);

  // Intro: the icon settles in, the name follows, the credit line last.
  useEffect(() => {
    const soft = { duration: 900, easing: Easing.out(Easing.cubic) } as const;

    logoOpacity.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) });
    logoScale.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) });
    nameOpacity.value = withDelay(650, withTiming(1, soft));
    nameY.value = withDelay(650, withTiming(0, soft));
    footerOpacity.value = withDelay(1150, withTiming(1, soft));

    // A barely-there breath so a slow boot doesn't look like a frozen frame.
    // This is the only "loading" signal — a spinner would fight the branding.
    breathe.value = withDelay(
      1500,
      withRepeat(
        withSequence(
          withTiming(1.03, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [breathe, footerOpacity, logoOpacity, logoScale, nameOpacity, nameY]);

  // Re-checks itself at each deadline instead of holding one state flag per
  // boundary: a `setState` here would re-render the whole screen mid-intro,
  // which is exactly the wrong moment to hand React work.
  useEffect(() => {
    if (ready) return;
    let timer: ReturnType<typeof setTimeout>;

    const check = () => {
      const elapsed = Date.now() - mountedAt.current;
      const canLeave =
        elapsed >= MAX_VISIBLE_MS ||
        (elapsed >= MIN_VISIBLE_MS &&
          clerkLoaded &&
          (configSyncedAt != null || elapsed >= CONFIG_GRACE_MS));
      if (canLeave) {
        setReady(true);
        return;
      }
      const next =
        [MIN_VISIBLE_MS, CONFIG_GRACE_MS, MAX_VISIBLE_MS].find((t) => t > elapsed) ??
        MAX_VISIBLE_MS;
      timer = setTimeout(check, next - elapsed + 16);
    };

    check();
    return () => clearTimeout(timer);
  }, [ready, clerkLoaded, configSyncedAt]);

  // Exit: lift and dissolve, so the home screen appears to come up underneath
  // rather than the splash being cut away. The lift is applied to the logo /
  // name group, never the root — scaling a full-screen layer forces the whole
  // thing to re-rasterise every frame, which is what made the exit stutter.
  useEffect(() => {
    if (!ready || done) return;
    alreadyPlayed = true;
    contentScale.value = withTiming(1.05, { duration: EXIT_MS, easing: Easing.in(Easing.quad) });
    rootOpacity.value = withTiming(
      0,
      { duration: EXIT_MS, easing: Easing.in(Easing.quad) },
      (finished) => {
        if (finished) runOnJS(setDone)(true);
      },
    );
  }, [ready, done, rootOpacity, contentScale]);

  // The native splash stays up until this screen has actually drawn — and then
  // two frames longer. Those first frames are the congested ones (the router,
  // Clerk and the query cache are all mounting behind us), so letting the OS's
  // static brand-colored splash cover them hides the jank instead of showing
  // a dropped-frame version of the intro. Same color, so nothing visibly
  // changes at the handoff.
  const onLayout = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        SplashScreen.hideAsync().catch(() => {});
      });
    });
  }, []);

  // Deep brand background needs light status-bar content. Every screen behind
  // us reasserts its own style on focus (see `useStatusBarStyle`), so there is
  // nothing to restore when we leave.
  useEffect(() => {
    setStatusBarStyle('light');
  }, []);

  const rootStyle = useAnimatedStyle(() => ({ opacity: rootOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value * breathe.value * contentScale.value }],
  }));
  const nameStyle = useAnimatedStyle(() => ({
    opacity: nameOpacity.value,
    transform: [{ translateY: nameY.value }, { scale: contentScale.value }],
  }));
  const footerStyle = useAnimatedStyle(() => ({ opacity: footerOpacity.value }));

  if (done) return null;

  const cream = config.colors.onboardingSurface;

  return (
    <Animated.View
      onLayout={onLayout}
      pointerEvents="auto"
      style={[
        StyleSheet.absoluteFillObject,
        styles.root,
        { backgroundColor: rgb(config.colors.onboardingBackground) },
        rootStyle,
      ]}
    >
      <Animated.View
        style={[
          styles.logoBox,
          { backgroundColor: rgb(config.colors.onboardingLayer), borderColor: rgba(cream, 0.12) },
          logoStyle,
        ]}
      >
        {config.logoUrl ? (
          <Image
            source={{ uri: config.logoUrl }}
            style={{ width: LOGO_BOX, height: LOGO_BOX }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={220}
          />
        ) : (
          <MasjidLogo
            width={LOGO_BOX * 0.56}
            height={LOGO_BOX * 0.56}
            color={rgb(config.colors.onboardingAccent)}
          />
        )}
      </Animated.View>

      <Animated.Text
        numberOfLines={2}
        style={[styles.name, { color: rgba(cream, 0.92), fontFamily: fonts.display }, nameStyle]}
      >
        {config.displayName}
      </Animated.Text>

      <Animated.View
        style={[
          styles.footerWrap,
          { paddingBottom: insets.bottom + 24 },
          footerStyle,
        ]}
      >
        <MadeBySahla cream={cream} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  logoBox: {
    width: LOGO_BOX,
    height: LOGO_BOX,
    // Quarter of the box, so the plate keeps its shape at any LOGO_BOX.
    borderRadius: LOGO_BOX * 0.25,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    marginTop: 26,
    fontSize: 29,
    lineHeight: 36,
    letterSpacing: 0.2,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  footerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    gap: 6,
  },
  footerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  creditLine: {
    flexDirection: 'row',
    alignItems: 'center',
    // A touch wider than the line above: the mark outsizes the wordmark, so the
    // pair needs a little more air to read as one lockup.
    gap: 6,
  },
  madeWith: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  sahla: {
    fontSize: 14,
    letterSpacing: 0.3,
  },
});

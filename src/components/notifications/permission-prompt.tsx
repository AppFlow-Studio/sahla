import { useAuth } from '@clerk/clerk-expo';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MasjidLogo from '@/assets/masjid-logo.svg';
import { Icon } from '@/src/components/ui/icon';
import type { MasjidConfig } from '@/src/config/types';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { requestAndRegisterToken } from '@/src/hooks/use-register-push-token';
import { useSupabase } from '@/src/hooks/use-supabase';
import { storage } from '@/src/lib/mmkv';
import { useConfigStore } from '@/src/stores/config-store';

/** Set once the user has seen (allowed or dismissed) the soft prompt. */
const SHOWN_KEY = 'notifications.prompt.v1';
const SERIF = 'PlayfairDisplay_500Medium';

/** "10 38 30" -> "rgb(10, 38, 30)" */
function rgb(triplet: string) {
  return `rgb(${triplet.trim().split(/\s+/).join(', ')})`;
}
/** "10 38 30", 0.6 -> "rgba(10, 38, 30, 0.6)" */
function rgba(triplet: string, alpha: number) {
  return `rgba(${triplet.trim().split(/\s+/).join(', ')}, ${alpha})`;
}

function getNotificationsModule() {
  try {
    return require('expo-notifications') as typeof import('expo-notifications');
  } catch {
    return null;
  }
}

// ── Per-notification animation timings (ms) ──
const GAP = 420; //       pause before a notification rises in
const RISE = 520; //      rise-up (entrance) duration
const HOLD = 2400; //     time settled on screen before being swiped away
const SWIPE = -460; //    horizontal swipe-out distance (flicked off the left edge)
const SWIPE_DUR = 320; // swipe-out duration
const OFFSCREEN = 320; // start position below, so it rises up like an iOS lock-screen notification
const RISE_EASE = Easing.out(Easing.back(1.2)); // soft settle with a tiny overshoot
const SWIPE_EASE = Easing.in(Easing.cubic); //     accelerate as it flicks away

/** The rotating set of app notifications shown in the mockup. */
type Notif = { title: string; time: string; body: string };
const NOTIFS: Notif[] = [
  {
    title: 'Prayer Times',
    time: 'now',
    body: 'Maghrib begins in 15 minutes — 8:42 PM',
  },
  {
    title: 'Jummah Reminder',
    time: '9:41 AM',
    body: "This week's khutbah starts at 1:30 PM",
  },
  {
    title: 'Daily Reading',
    time: 'now',
    body: "It's time for your daily Qur'an reading",
  },
  {
    title: 'Upcoming Program',
    time: '5m ago',
    body: 'Youth Halaqa tonight at 7:00 PM',
  },
  {
    title: 'Community',
    time: '12m ago',
    body: "Join tonight's community iftar at the masjid",
  },
];

/**
 * The masjid's app icon, shown on every notification the way iOS stamps an
 * app's icon onto each of its banners. Prefers the tenant's remote `logoUrl`
 * (a real uploaded icon) and falls back to the bundled brand glyph.
 */
function AppIcon({ config }: { config: MasjidConfig }) {
  return (
    <View
      style={{
        height: 40,
        width: 40,
        borderRadius: 11,
        overflow: 'hidden',
        backgroundColor: rgb(config.colors.onboardingBackground),
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {config.logoUrl ? (
        <Image
          source={{ uri: config.logoUrl }}
          style={{ height: 40, width: 40 }}
          contentFit="cover"
        />
      ) : (
        <MasjidLogo width={26} height={26} />
      )}
    </View>
  );
}

/** One frosted iOS-style notification card with the masjid app icon, title, time + body. */
function NotificationCard({ notif, config }: { notif: Notif; config: MasjidConfig }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 13,
        borderRadius: 22,
        backgroundColor: 'rgba(248, 246, 240, 0.16)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.16)',
      }}
    >
      <AppIcon config={config} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{notif.title}</Text>
          <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 }}>{notif.time}</Text>
        </View>
        <Text
          numberOfLines={2}
          style={{ marginTop: 3, color: 'rgba(255, 255, 255, 0.85)', fontSize: 13, lineHeight: 18 }}
        >
          {notif.body}
        </Text>
      </View>
    </View>
  );
}

/**
 * Cycles through `NOTIFS` one at a time: each rises up into place, holds, then
 * is swiped off the left edge — and the next one rises in after it. Loops.
 */
function NotificationFeed({ config }: { config: MasjidConfig }) {
  const [current, setCurrent] = useState(0);
  const tx = useSharedValue(0);
  const ty = useSharedValue(OFFSCREEN);
  const opacity = useSharedValue(0);

  const advance = useCallback(() => {
    setCurrent((c) => (c + 1) % NOTIFS.length);
  }, []);

  useEffect(() => {
    // Reset off-screen, then run a single rise → hold → swipe-away pass.
    tx.value = 0;
    ty.value = OFFSCREEN;
    opacity.value = 0;

    ty.value = withDelay(GAP, withTiming(0, { duration: RISE, easing: RISE_EASE }));
    opacity.value = withSequence(
      withDelay(GAP, withTiming(1, { duration: 200 })),
      withDelay(RISE - 200 + HOLD, withTiming(0, { duration: SWIPE_DUR })),
    );
    tx.value = withDelay(
      GAP + RISE + HOLD,
      withTiming(SWIPE, { duration: SWIPE_DUR, easing: SWIPE_EASE }, (finished) => {
        // When the swipe-out completes, advance to the next notification.
        if (finished) runOnJS(advance)();
      }),
    );
  }, [current, advance, tx, ty, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }, { translateX: tx.value }],
  }));

  return (
    <Animated.View style={style}>
      <NotificationCard notif={NOTIFS[current]} config={config} />
    </Animated.View>
  );
}

/** Wallpaper + device colors for the phone mockup. */
const PHONE_FRAME = '#0a0a0b'; //  titanium/black bezel
const PHONE_SCREEN = '#1c1c1e'; // dark wallpaper (neutral charcoal grey)

/**
 * The upper portion of an iPhone (bezel, dynamic island, status bar, lock-screen
 * clock) whose lower half runs off the bottom behind the cream sheet. The
 * cascading notifications render on its screen.
 */
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flex: 1,
        borderTopLeftRadius: 56,
        borderTopRightRadius: 56,
        backgroundColor: PHONE_FRAME,
        paddingTop: 10,
        paddingHorizontal: 10,
        borderTopWidth: 2,
        borderLeftWidth: 2,
        borderRightWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          flex: 1,
          borderTopLeftRadius: 46,
          borderTopRightRadius: 46,
          backgroundColor: PHONE_SCREEN,
          overflow: 'hidden',
        }}
      >
        {/* Warm glow behind the clock, like a wallpaper. */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -90,
            alignSelf: 'center',
            width: 320,
            height: 320,
            borderRadius: 160,
            backgroundColor: rgba('255 255 255', 0.05),
          }}
        />

        {/* Status bar */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 28,
            paddingTop: 14,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>9:41</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="cellular" size={15} color="#fff" />
            <Icon name="wifi" size={15} color="#fff" />
            <Icon name="battery-full" size={20} color="#fff" />
          </View>
        </View>

        {/* Dynamic island */}
        <View
          style={{
            position: 'absolute',
            top: 12,
            alignSelf: 'center',
            width: 116,
            height: 33,
            borderRadius: 17,
            backgroundColor: '#000',
          }}
        />

        {/* Lock-screen clock */}
        <View style={{ alignItems: 'center', marginTop: 22 }}>
          <Text style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: 14, fontWeight: '500' }}>
            Wednesday, June 4
          </Text>
          <Text style={{ color: '#fff', fontSize: 66, fontWeight: '200', letterSpacing: 1 }}>
            9:41
          </Text>
        </View>

        {/* Cascading notifications */}
        <View style={{ paddingHorizontal: 14, paddingTop: 24, gap: 10 }}>{children}</View>
      </View>
    </View>
  );
}

/**
 * First-open soft prompt nudging the user to enable notifications. Renders a
 * full-screen takeover: a dark top half where mock notification banners cascade
 * down onto an iPhone mockup on a loop, and a cream bottom half with the copy +
 * actions.
 *
 * Shown at most once: only when the OS permission is still `undetermined` and
 * we haven't shown it before. Tapping "Allow" triggers the real OS prompt (via
 * `requestAndRegisterToken`) and registers the push token if granted. Either
 * choice marks the soft prompt as seen so it never reappears.
 *
 * Mount once near the root of the authenticated tree (e.g. `(main)/_layout`).
 */
export function NotificationPermissionPrompt() {
  const { userId } = useAuth();
  const supabase = useSupabase();
  const mosqueId = useConfigStore((s) => s.mosqueUuid);
  const config = useMasjidConfig();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (storage.getBoolean(SHOWN_KEY)) return;

    const Notifications = getNotificationsModule();
    if (!Notifications) return;

    let active = true;
    void (async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (!active) return;
        // Only nudge when the OS prompt hasn't been answered yet. If the user
        // already granted/denied at the OS level there's nothing to ask.
        if (status === 'undetermined') setVisible(true);
        else storage.set(SHOWN_KEY, true);
      } catch {
        // Native module not ready (pre-EAS build) — skip silently.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const dismiss = useCallback(() => {
    storage.set(SHOWN_KEY, true);
    setVisible(false);
  }, []);

  const onAllow = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (userId && mosqueId) {
        await requestAndRegisterToken(supabase, userId, mosqueId);
      } else {
        // Fall back to just requesting permission; the token will be picked up
        // on the next foreground by useRegisterPushToken.
        await getNotificationsModule()?.requestPermissionsAsync();
      }
    } finally {
      setBusy(false);
      dismiss();
    }
  }, [busy, userId, mosqueId, supabase, dismiss]);

  if (!visible) return null;

  const cream = rgb(config.colors.onboardingSurface);
  const green = rgb(config.colors.onboardingBackground);
  const muted = rgba(config.colors.onboardingBackground, 0.55);
  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={dismiss}>
      <View style={{ flex: 1, backgroundColor: green }}>
        {/* ── Top: an iPhone mockup with notifications cascading onto it ── */}
        <View style={{ flex: 1, paddingTop: insets.top + 8, paddingHorizontal: 16 }}>
          <PhoneFrame>
            <NotificationFeed config={config} />
          </PhoneFrame>
        </View>

        {/* ── Bottom: cream sheet with copy + actions ── */}
        <View
          style={{
            backgroundColor: cream,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            paddingHorizontal: 32,
            paddingTop: 44,
            paddingBottom: insets.bottom + 28,
          }}
        >
          <Text
            style={{
              fontFamily: SERIF,
              fontSize: 28,
              lineHeight: 36,
              textAlign: 'center',
              color: green,
            }}
          >
            Get better results{'\n'}through notifications
          </Text>
          <Text
            style={{
              marginTop: 18,
              fontSize: 15,
              lineHeight: 22,
              textAlign: 'center',
              color: muted,
            }}
          >
            Allow notifications about upcoming programs, events, your daily reading time and reminders
          </Text>

          <Pressable
            onPress={onAllow}
            disabled={busy}
            style={{
              marginTop: 32,
              height: 56,
              borderRadius: 999,
              backgroundColor: green,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: busy ? 0.6 : 1,
            }}
          >
            <Text style={{ color: cream, fontSize: 16, fontWeight: '700' }}>Allow</Text>
          </Pressable>

          <Pressable
            onPress={dismiss}
            disabled={busy}
            style={{ marginTop: 6, height: 52, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: green, opacity: 0.7, fontSize: 16, fontWeight: '600' }}>
              Don&apos;t Allow
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

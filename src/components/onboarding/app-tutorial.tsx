import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useFontFamily } from '@/src/hooks/use-font-family';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useTutorialSeen } from '@/src/hooks/use-tutorial-seen';

/** "10 38 30" -> "rgb(10, 38, 30)" */
function rgb(triplet: string) {
  return `rgb(${triplet.trim().split(/\s+/).join(', ')})`;
}
/** "10 38 30", 0.6 -> "rgba(10, 38, 30, 0.6)" */
function rgba(triplet: string, alpha: number) {
  return `rgba(${triplet.trim().split(/\s+/).join(', ')}, ${alpha})`;
}

// Aspect ratio (w / h) of the bundled tab screenshots — all 920×2000.
const SHOT_RATIO = 920 / 2000;

// ── Screen-swap (push) tuning ──
const ENTER_DUR = 640; //   crossfade + settle duration as a screen enters
const SLIDE = 20; //        gentle parallax travel for the incoming screen
const ENTER_ZOOM = 1.03; // entrance overshoot, settles to a clean 1.0 fit
// soft deceleration (easeOutExpo-ish) so screens glide to rest
const ENTER_EASE = Easing.bezier(0.16, 1, 0.3, 1);

// ── Phone-shape (morph) tuning ──
const MORPH_DUR = 780; //   reshape duration when fit changes
// smooth symmetric in-out so the reshape eases in and settles without a snap
const MORPH_EASE = Easing.bezier(0.4, 0, 0.2, 1);
const BEZEL = 10; //        screen inset inside the bezel (the black frame)
const FILL_M = 0.97; //     how much of the freed area the contain phone fills
const SHEET_TRIM = 60; //   how much the cream sheet shrinks in 'contain' mode

// The phone is rendered ONCE at a fixed "full-width iPhone" size and the morph is
// a pure scale+translate transform — so nothing re-layouts per frame. All five
// screenshots stay mounted and crossfade by opacity, so none remount/decode mid-move.

// ── The five bottom-nav tabs. `fit`: 'cover' = the big full-width phone (top
//    shown, bottom behind the sheet); 'contain' = scaled down + centered so the
//    whole screen shows. Copy lives in i18n; wording TBD per CT-ONBOARD-01. ──
type StepKey = 'home' | 'discover' | 'watch' | 'prayer' | 'profile';
type Fit = 'cover' | 'contain';
type Step = { key: StepKey; shot: number; fit: Fit };
const STEPS: Step[] = [
  { key: 'home', shot: require('@/assets/tutorial/home.jpg'), fit: 'cover' },
  { key: 'discover', shot: require('@/assets/tutorial/discover.jpg'), fit: 'cover' },
  { key: 'watch', shot: require('@/assets/tutorial/watch.jpg'), fit: 'contain' },
  { key: 'prayer', shot: require('@/assets/tutorial/prayer.jpg'), fit: 'contain' },
  { key: 'profile', shot: require('@/assets/tutorial/profile.jpg'), fit: 'cover' },
];

const FILL = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 };

/**
 * One always-mounted screenshot layer. Decodes once; its opacity crossfades when
 * it becomes (or stops being) the active step — so step swaps never remount or
 * re-decode an image mid-transition.
 */
function ScreenLayer({
  index,
  source,
  stepSV,
  fromSV,
  enter,
}: {
  index: number;
  source: number;
  stepSV: SharedValue<number>;
  fromSV: SharedValue<number>;
  enter: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const e = enter.value;
    const s = e * e * (3 - 2 * e); // smoothstep
    let opacity = 0;
    if (index === stepSV.value) opacity = s;
    else if (index === fromSV.value) opacity = 1 - s;
    return { opacity };
  });
  return (
    <Animated.View pointerEvents="none" style={[FILL, style]}>
      <Image
        source={source}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        contentPosition="top"
        cachePolicy="memory-disk"
        transition={0}
      />
    </Animated.View>
  );
}

type Props = {
  /**
   * Gate so the tour waits its turn behind the notification soft-prompt — the
   * parent flips this true once notifications are resolved, avoiding two
   * full-screen takeovers stacking on first launch.
   */
  enabled?: boolean;
};

/**
 * First-run guided walkthrough (CT-ONBOARD-01). A full-screen takeover styled
 * like the notification soft-prompt: the five tabs as real screenshots inside an
 * iPhone that MORPHS per step (big full-bleed ↔ full centered phone) via a pure
 * scale/translate transform, with a gentle crossfade between steps. Finishing or
 * skipping sets the persisted `tutorial_seen` flag so it never auto-reappears
 * (re-armable from Profile → "Replay tutorial").
 *
 * Mount once near the root of the authenticated tree (`(main)/_layout`).
 */
export function AppTutorial({ enabled = true }: Props) {
  const { t } = useTranslation();
  const fonts = useFontFamily();
  const config = useMasjidConfig();
  const insets = useSafeAreaInsets();
  const { seen, markSeen } = useTutorialSeen();

  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [fromStep, setFromStep] = useState(0);
  const lastStep = useRef(0);
  // Stable, measured-once geometry (never changes during a morph → no re-render).
  const [root, setRoot] = useState({ w: 0, h: 0 });
  const [sheetH, setSheetH] = useState(0);

  // Show on first launch post-onboarding (and on replay, when `seen` flips back).
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!enabled || seen) {
      setVisible(false);
      return;
    }
    lastStep.current = 0;
    setFromStep(0);
    setStep(0);
    setVisible(true);
  }, [enabled, seen]);

  const current = STEPS[step];

  // Shared values mirror step/fromStep so the screen layers can crossfade on the
  // UI thread without per-layer props churn.
  const enter = useSharedValue(0);
  const dir = useSharedValue(1);
  const stepSV = useSharedValue(0);
  const fromSV = useSharedValue(0);
  useEffect(() => {
    if (!visible) return;
    dir.value = step >= lastStep.current ? 1 : -1;
    lastStep.current = step;
    stepSV.value = step;
    fromSV.value = fromStep;
    enter.value = 0;
    enter.value = withTiming(1, { duration: ENTER_DUR, easing: ENTER_EASE });
  }, [step, fromStep, visible, enter, dir, stepSV, fromSV]);

  // `morph` (0 = big full-bleed, 1 = full centered phone) on fit change.
  const morph = useSharedValue(current.fit === 'contain' ? 1 : 0);
  useEffect(() => {
    if (!visible) return;
    morph.value = withTiming(current.fit === 'contain' ? 1 : 0, {
      duration: MORPH_DUR,
      easing: MORPH_EASE,
    });
  }, [step, visible, current.fit, morph]);

  // ── Geometry (stable; from the measured-once root + sheet height) ──
  const padTop = insets.top + 8;
  const areaW = Math.max(0, root.w - 32);
  const baseH = Math.max(0, root.h - padTop - sheetH); // room above the full sheet
  // The phone is rendered at full width as a true iPhone (very tall — its lower
  // half sits behind the sheet in cover mode).
  const phoneW = areaW;
  const phoneH = (areaW - 2 * BEZEL) / SHOT_RATIO + 2 * BEZEL;
  const baseR = areaW * 0.135;
  // contain: scale the whole phone down to fit the (sheet-trimmed) area, centered.
  const containAvailH = baseH + SHEET_TRIM;
  const containScale = phoneH > 0 ? Math.min(1, (containAvailH * FILL_M) / phoneH) : 1;
  const centerY = (containAvailH - phoneH * containScale) / 2;
  const ready = areaW > 0 && baseH > 0 && sheetH > 0;

  // Morph = translateY (lift to center) + scale (shrink to fit). Pure transform.
  const liftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: centerY * morph.value }],
  }));
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + (containScale - 1) * morph.value }],
  }));
  // Whole screen stack drifts + zoom-settles as a step enters (the visible layer
  // reads as the incoming one; outgoing crossfades beneath).
  const stackStyle = useAnimatedStyle(() => {
    const e = enter.value;
    return {
      transform: [
        { translateX: (1 - e) * SLIDE * dir.value },
        { scale: 1 + (ENTER_ZOOM - 1) * (1 - e) },
      ],
    };
  });
  // Copy lifts + fades with each step.
  const copyStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * 12 }],
  }));
  // Sheet trims padding in 'contain' mode to free room for the bigger phone.
  const sheetStyle = useAnimatedStyle(() => ({
    paddingTop: 24 - 18 * morph.value,
    paddingBottom: insets.bottom + 22 - 14 * morph.value,
  }));
  const bodyStyle = useAnimatedStyle(() => ({ minHeight: 66 - 28 * morph.value }));

  const finish = () => {
    markSeen();
    setVisible(false);
  };
  const go = (nextStep: number) => {
    setFromStep(step);
    setStep(nextStep);
  };
  const next = () => {
    if (step >= STEPS.length - 1) finish();
    else go(step + 1);
  };
  const back = () => {
    if (step > 0) go(step - 1);
  };

  if (!visible) return null;

  const isLast = step === STEPS.length - 1;
  const cream = rgb(config.colors.onboardingSurface);
  const green = rgb(config.colors.onboardingBackground);
  const muted = rgba(config.colors.onboardingBackground, 0.55);
  const accent = rgb(config.colors.accent);

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={finish}>
      <View
        style={{ flex: 1, backgroundColor: green }}
        onLayout={(e) => {
          const { width: w, height: h } = e.nativeEvent.layout;
          setRoot((p) => (p.w === w && p.h === h ? p : { w, h }));
        }}
      >
        {/* ── Phone overlay: absolute so the morph never relayouts the flow ── */}
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: padTop, left: 16, right: 16, bottom: 0, alignItems: 'center' }}
        >
          {ready && (
            <Animated.View style={[{ width: phoneW, height: phoneH }, liftStyle]}>
              <Animated.View
                style={[
                  {
                    flex: 1,
                    backgroundColor: '#0a0a0b',
                    borderRadius: baseR,
                    borderWidth: 2,
                    borderColor: 'rgba(255, 255, 255, 0.09)',
                    padding: BEZEL,
                    transformOrigin: 'top center',
                    shadowColor: '#000',
                    shadowOpacity: 0.4,
                    shadowRadius: 22,
                    shadowOffset: { width: 0, height: 12 },
                  },
                  scaleStyle,
                ]}
              >
                <View style={{ flex: 1, overflow: 'hidden', borderRadius: baseR - BEZEL, backgroundColor: '#000' }}>
                  <Animated.View style={[FILL, stackStyle]}>
                    {STEPS.map((s, i) => (
                      <ScreenLayer
                        key={s.key}
                        index={i}
                        source={s.shot}
                        stepSV={stepSV}
                        fromSV={fromSV}
                        enter={enter}
                      />
                    ))}
                  </Animated.View>
                </View>
              </Animated.View>
            </Animated.View>
          )}
        </View>

        {/* spacer pushes the sheet to the bottom of the flow */}
        <View style={{ flex: 1 }} pointerEvents="none" />

        {/* ── Bottom: cream sheet with copy, progress + controls ── */}
        <Animated.View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            setSheetH((prev) => (prev === 0 ? h : prev)); // capture full (cover) height once
          }}
          style={[
            { backgroundColor: cream, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 30 },
            sheetStyle,
          ]}
        >
          {/* progress dots */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 7, marginBottom: 18 }}>
            {STEPS.map((s, i) => (
              <View
                key={s.key}
                style={{
                  height: 7,
                  borderRadius: 4,
                  width: i === step ? 22 : 7,
                  backgroundColor: i === step ? accent : rgba(config.colors.onboardingBackground, 0.18),
                }}
              />
            ))}
          </View>

          <Animated.View style={copyStyle}>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 26,
                lineHeight: 32,
                textAlign: 'center',
                color: green,
              }}
            >
              {t(`tutorial.steps.${current.key}.title`)}
            </Text>
            <Animated.Text
              style={[
                { marginTop: 12, fontSize: 15, lineHeight: 22, textAlign: 'center', color: muted },
                bodyStyle,
              ]}
            >
              {t(`tutorial.steps.${current.key}.body`)}
            </Animated.Text>
          </Animated.View>

          {/* primary action */}
          <Pressable
            onPress={next}
            style={{
              marginTop: 18,
              height: 56,
              borderRadius: 999,
              backgroundColor: green,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: cream, fontSize: 16, fontWeight: '700' }}>
              {isLast ? t('tutorial.done') : t('tutorial.next')}
            </Text>
          </Pressable>

          {/* secondary: Back on later steps, Skip until the last */}
          <View
            style={{
              marginTop: 6,
              height: 48,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {step > 0 ? (
              <Pressable onPress={back} hitSlop={12} style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
                <Text style={{ color: green, opacity: 0.6, fontSize: 15, fontWeight: '600' }}>
                  {t('tutorial.back')}
                </Text>
              </Pressable>
            ) : null}
            {!isLast ? (
              <Pressable onPress={finish} hitSlop={12} style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
                <Text style={{ color: green, opacity: 0.6, fontSize: 15, fontWeight: '600' }}>
                  {t('tutorial.skip')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

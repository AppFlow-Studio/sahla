import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  LayoutAnimation,
  type LayoutAnimationConfig,
  Modal,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import ReAnimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useFontFamily } from '@/src/hooks/use-font-family';
import { AppBlurView } from '@/src/components/ui/blur-view';
import { Icon } from '@/src/components/ui/icon';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';
import { env } from '@/src/lib/env';


const PRESETS = [25, 50, 100];
const { height: SCREEN_H } = Dimensions.get('window');
const KEYPAD_HEIGHT = 200;


const KEYS: (string | 'back')[] = [
  '1', '2', '3',
  '4', '5', '6',
  '7', '8', '9',
  '.', '0', 'back',
];

/**
 * Payments are switched off for the first App Store submission, so the sheet
 * is amount → notice. The card, processing and thanks steps were removed with
 * their Stripe calls; restore them alongside `@stripe/stripe-react-native`
 * when giving is turned back on.
 */
type Step = 'amount' | 'soon';

export function DonationModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { colors } = useMasjidConfig();
  const fonts = useFontFamily();
  const { t } = useTranslation();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const supabase = useSupabase();

  const fg = colors.foreground.replace(/ /g, ',');
  const bg = colors.background.replace(/ /g, ',');
  const accent = colors.accent.replace(/ /g, ',');
  const accentRgb = `rgb(${accent})`;
  const fgRgb = `rgb(${fg})`;
  const bgRgb = `rgb(${bg})`;

  const [amount, setAmount] = useState(50);
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [mounted, setMounted] = useState(visible);
  const [step, setStep] = useState<Step>('amount');
  // True while the system keyboard is up for the card field — collapses the
  // sheet chrome so only the card is shown above the keyboard.
  const [inputFocused, setInputFocused] = useState(false);

  // The step that is currently rendered inside the sheet.
  // `step` is the *target*; `visibleStep` is what's on screen until the swap animation completes.
  const [visibleStep, setVisibleStep] = useState<Step>('amount');

  // -- Animations --
  const sheetY = useRef(new Animated.Value(SCREEN_H)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const keypadH = useRef(new Animated.Value(0)).current;
  const keypadOpacity = useRef(new Animated.Value(0)).current;

  // Content fade for step transitions
  const contentOpacity = useRef(new Animated.Value(1)).current;


  const displayAmount =
    customMode && customValue ? Number(customValue) || 0 : amount;

  // Swipe-down-to-dismiss via react-native-gesture-handler (PanResponder is
  // starved of touches under the app's GestureHandlerRootView). A reanimated
  // value drives an outer wrapper; the inner sheet keeps its RN-Animated
  // open/close + keyboard transforms, so the two stack cleanly.
  const dragY = useSharedValue(0);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const triggerClose = () => onCloseRef.current();

  const dragGesture = Gesture.Pan()
    .activeOffsetY(12)
    .failOffsetX([-20, 20])
    .onUpdate((e) => {
      dragY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > 110 || e.velocityY > 600) {
        // Let the existing RN close animation finish the slide-out; keep the
        // drag offset so it continues downward without a jump.
        runOnJS(triggerClose)();
      } else {
        dragY.value = withSpring(0, { damping: 30, stiffness: 220 });
      }
    });

  const dragStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dragY.value }],
  }));

  // Fade-out → swap → animate height → fade-in step transitions
  const prevStep = useRef<Step>('amount');
  const transitioning = useRef(false);

  // LayoutAnimation config for smooth height changes
  const heightAnim: LayoutAnimationConfig = {
    duration: 550,
    update: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
  };

  // Collapse/expand the sheet chrome when the keyboard shows/hides.
  const focusAnim: LayoutAnimationConfig = {
    duration: 280,
    create: { type: LayoutAnimation.Types.easeOut, property: LayoutAnimation.Properties.opacity },
    update: { type: LayoutAnimation.Types.easeInEaseOut },
    delete: { type: LayoutAnimation.Types.easeIn, property: LayoutAnimation.Properties.opacity },
  };

  useEffect(() => {
    const prev = prevStep.current;
    prevStep.current = step;

    if (prev === step) return;

    // Fade out content → swap & animate height → fade in
    if (transitioning.current) return;
    transitioning.current = true;

    Animated.timing(contentOpacity, {
      toValue: 0,
      duration: 380,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      LayoutAnimation.configureNext(heightAnim);
      setVisibleStep(step);
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 450,
        delay: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        transitioning.current = false;
      });
    });
  }, [step]);

  const resetState = () => {
    setMounted(false);
    setCustomMode(false);
    setCustomValue('');
    setStep('amount');
    setVisibleStep('amount');
    setInputFocused(false);
    keypadH.setValue(0);
    keypadOpacity.setValue(0);
    keyboardOffset.setValue(0);
    contentOpacity.setValue(1);
    sheetY.setValue(SCREEN_H);
    dragY.value = 0;
  };

  // Sheet open / close
  useEffect(() => {
    if (visible) {
      setMounted(true);
      dragY.value = 0;
      // Sheet slides up, backdrop blur fades in shortly after
      Animated.spring(sheetY, { toValue: 0, damping: 34, stiffness: 150, mass: 1.1, useNativeDriver: false }).start();
      Animated.timing(backdrop, { toValue: 1, duration: 500, delay: 150, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    } else if (mounted) {
      Keyboard.dismiss();
      // Close glides down with a gentle, low-stiffness spring so the
      // sheet picks up speed gradually instead of snapping off the
      // bottom of the screen. Overdamped (no bounce) but with a longer
      // settle so the descent feels relaxed rather than fired.
      Animated.timing(backdrop, { toValue: 0, duration: 620, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
      Animated.spring(sheetY, {
        toValue: SCREEN_H,
        damping: 28,
        stiffness: 95,
        mass: 1.2,
        useNativeDriver: false,
      }).start(() => {
        resetState();
      });
    }
  }, [visible]);

  // Keyboard-aware sheet offset
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, (e) => {
      // Collapse the sheet chrome (header, summary, express pay, button) so
      // only the card remains, then float it just above the keyboard.
      LayoutAnimation.configureNext(focusAnim);
      setInputFocused(true);
      Animated.spring(keyboardOffset, {
        toValue: -e.endCoordinates.height + 20,
        damping: 34,
        stiffness: 150,
        mass: 1.1,
        useNativeDriver: false,
      }).start();
    });

    const onHide = Keyboard.addListener(hideEvent, () => {
      LayoutAnimation.configureNext(focusAnim);
      setInputFocused(false);
      Animated.spring(keyboardOffset, {
        toValue: 0,
        damping: 34,
        stiffness: 150,
        mass: 1.1,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  // Keypad expand / collapse
  useEffect(() => {
    if (customMode) {
      Animated.parallel([
        Animated.timing(keypadH, { toValue: KEYPAD_HEIGHT, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        Animated.timing(keypadOpacity, { toValue: 1, duration: 260, delay: 100, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(keypadOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.timing(keypadH, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: false }),
      ]).start();
    }
  }, [customMode]);

  const onKeyPress = (key: string | 'back') => {
    if (key === 'back') {
      setCustomValue((v) => v.slice(0, -1));
      return;
    }
    if (key === '.') {
      setCustomValue((v) => (v.includes('.') || v.length === 0 ? v : v + '.'));
      return;
    }
    setCustomValue((v) => {
      if (v.length >= 7) return v;
      if (v === '0' && key !== '.') return key;
      return v + key;
    });
  };

  /**
   * Payments are switched off for this release, so this no longer mints a
   * payment intent — it just moves the sheet to the notice. The amount step is
   * kept so the flow still reads as a donation, and so turning payments back on
   * is a matter of restoring the card step rather than rebuilding the sheet.
   */
  const handleContinueToCard = () => {
    Keyboard.dismiss();
    if (displayAmount < 1) {
      Alert.alert(t('donate.invalidAmountTitle'), t('donate.invalidAmountMessage'));
      return;
    }
    setCustomMode(false);
    setStep('soon');
  };

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 justify-end px-2 pb-3">
        {/* Backdrop blur */}
        <Animated.View
          pointerEvents={visible ? 'auto' : 'none'}
          style={{
            ...StyleSheet.absoluteFillObject,
            opacity: backdrop,
          }}
        >
          <AppBlurView intensity={40} tint="dark" style={{ flex: 1 }}>
            <Pressable
              style={{ flex: 1, backgroundColor: `rgba(${fg},0.15)` }}
              onPress={() => {
                // While typing, a tap outside dismisses the keyboard first.
                if (inputFocused) Keyboard.dismiss();
                else onClose();
              }}
            />
          </AppBlurView>
        </Animated.View>

        {/* Sheet */}
        <GestureDetector gesture={dragGesture}>
        <ReAnimated.View style={dragStyle}>
        <Animated.View
          className="bg-background overflow-hidden"
          style={{
            borderRadius: 44,
            transform: [{ translateY: sheetY }, { translateY: keyboardOffset }],
            shadowColor: fgRgb,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 20,
            elevation: 16,
          }}
        >
          {/* Handle — drag down to dismiss */}
          <View className="items-center pt-3 pb-2">
            <View className="h-[4px] w-9 rounded-full bg-foreground/15" />
          </View>

          {/* Step content — fades between steps, height animates via LayoutAnimation */}
          <Animated.View style={{ opacity: contentOpacity }}>

          {/* ─── Amount Step ─── */}
          {visibleStep === 'amount' && (
          <View>
            <View className="px-6 pt-5">
              <Text className="text-center text-[11px] font-semibold uppercase tracking-[2px] text-foreground/35">
                {t('donate.eyebrow')}
              </Text>

              <Text
                className="mt-5 text-center text-foreground"
                style={{ fontSize: 48, fontFamily: fonts.displayRegular }}
              >
                ${displayAmount}
              </Text>

              <View className="mt-7 flex-row justify-center gap-3">
                {PRESETS.map((p) => {
                  const selected = !customMode && amount === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      activeOpacity={0.75}
                      onPress={() => {
                        setAmount(p);
                        setCustomMode(false);
                        setCustomValue('');
                      }}
                      style={{
                        width: 88,
                        height: 36,
                        borderRadius: 18,
                        borderWidth: 1.5,
                        borderColor: selected ? accentRgb : `rgba(${fg},0.12)`,
                        backgroundColor: selected ? accentRgb : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: selected ? bgRgb : fgRgb,
                        }}
                      >
                        ${p}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => {
                  setCustomMode(!customMode);
                  if (customMode) setCustomValue('');
                }}
                className="mt-4 items-center py-2"
              >
                <Text style={{ fontSize: 12, color: accentRgb, fontWeight: '500' }}>
                  {customMode ? t('donate.usePreset') : t('donate.customAmount')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Keypad */}
            <Animated.View
              style={{ height: keypadH, overflow: 'hidden' }}
              pointerEvents={customMode ? 'auto' : 'none'}
            >
              <Animated.View
                className="px-8 pt-3"
                style={{ height: KEYPAD_HEIGHT, opacity: keypadOpacity }}
              >
                <View className="flex-row flex-wrap">
                  {KEYS.map((k) => (
                    <TouchableOpacity
                      key={k}
                      activeOpacity={0.4}
                      onPress={() => onKeyPress(k)}
                      className="items-center justify-center"
                      style={{ width: '33.333%', height: 52 }}
                    >
                      {k === 'back' ? (
                        <Icon name="backspace-outline" size={22} color={`rgba(${fg},0.5)`} />
                      ) : (
                        <Text style={{ fontSize: 24, fontWeight: '300', color: fgRgb }}>{k}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>
            </Animated.View>

            {/* Bottom actions */}
            <View className="px-6 pb-8 pt-3">
              <View style={{ height: 1, backgroundColor: `rgba(${fg},0.06)`, marginBottom: 16 }} />

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleContinueToCard}
                style={{
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: accentRgb,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: bgRgb }}>
                  {t('donate.donateAmount', { amount: `$${displayAmount}` })}
                </Text>
              </TouchableOpacity>

            </View>
          </View>
          )}

          {/* ─── Card Step: saved-card picker ('card') OR new-card entry ('newcard') ─── */}
          {/* ─── Coming Soon ─── */}
          {/* Payments are switched off for the first App Store submission. The
              amount step above still runs so the flow reads as intended; this
              replaces card entry rather than sitting in front of it. */}
          {visibleStep === 'soon' && (
          <View className="px-6 pb-10 pt-4 items-center">
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: `rgba(${accent},0.12)`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="heart" size={26} color={accentRgb} fill={accentRgb} />
            </View>

            <Text
              className="mt-6 text-center text-foreground"
              style={{ fontSize: 22, fontFamily: fonts.displayRegular, lineHeight: 29 }}
            >
              {t('donate.soonTitle')}
            </Text>

            <Text
              className="mt-3 text-center"
              style={{ fontSize: 14, lineHeight: 21, color: `rgba(${fg},0.55)`, maxWidth: 300 }}
            >
              {t('donate.soonBody')}
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={triggerClose}
              style={{
                marginTop: 28,
                alignSelf: 'stretch',
                height: 48,
                borderRadius: 24,
                backgroundColor: accentRgb,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: bgRgb }}>
                {t('donate.soonCta')}
              </Text>
            </TouchableOpacity>
          </View>
          )}

          </Animated.View>
        </Animated.View>
        </ReAnimated.View>
        </GestureDetector>
      </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

// Inline to avoid import for one use
const StyleSheet = { absoluteFillObject: { position: 'absolute' as const, left: 0, right: 0, top: 0, bottom: 0 } };

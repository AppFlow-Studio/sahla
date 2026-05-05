import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CardField, usePaymentSheet, initStripe } from '@stripe/stripe-react-native';
// CardField onCardChange details type
type CardDetails = { complete: boolean; brand?: string; last4?: string };
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useSupabase } from '@/src/hooks/use-supabase';
import { useProfile } from '@/src/hooks/use-profile';
import { useConfigStore } from '@/src/stores/config-store';
import { env } from '@/src/lib/env';
import ThankYouOrnament from '@/assets/thank-you-ornament.svg';

const PRESETS = [25, 50, 100];
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const KEYPAD_HEIGHT = 200;

/* ── Brand themes ── */
const BRAND_THEMES: Record<string, { colors: [string, string]; text: string; label: string; chipBg: string }> = {
  Visa: {
    colors: ['#1a1f71', '#0d47a1'],
    text: '#ffffff',
    label: 'VISA',
    chipBg: 'rgba(255,255,255,0.2)',
  },
  MasterCard: {
    colors: ['#1a1a2e', '#16213e'],
    text: '#ffffff',
    label: 'mastercard',
    chipBg: 'rgba(255,255,255,0.2)',
  },
  AmericanExpress: {
    colors: ['#006fcf', '#0080ef'],
    text: '#ffffff',
    label: 'AMEX',
    chipBg: 'rgba(255,255,255,0.2)',
  },
  Discover: {
    colors: ['#ff6000', '#ff8533'],
    text: '#ffffff',
    label: 'DISCOVER',
    chipBg: 'rgba(255,255,255,0.25)',
  },
  DinersClub: {
    colors: ['#004080', '#0060b0'],
    text: '#ffffff',
    label: 'DINERS',
    chipBg: 'rgba(255,255,255,0.2)',
  },
  JCB: {
    colors: ['#0b4ea2', '#1d6db8'],
    text: '#ffffff',
    label: 'JCB',
    chipBg: 'rgba(255,255,255,0.2)',
  },
  UnionPay: {
    colors: ['#e21836', '#00447c'],
    text: '#ffffff',
    label: 'UnionPay',
    chipBg: 'rgba(255,255,255,0.2)',
  },
};

const DEFAULT_THEME = {
  colors: ['#e8e4de', '#d5d0c8'] as [string, string],
  text: '#3a3a3a',
  label: '',
  chipBg: 'rgba(0,0,0,0.08)',
};

function CardVisual({
  brand,
  cardComplete,
  flipped,
  last4,
  expiryMonth,
  expiryYear,
  cvcFilled,
  profileName,
  bgRgb,
  fgRgb,
  fg,
  onCardChange,
  onFocus,
}: {
  brand: string;
  cardComplete: boolean;
  flipped: boolean;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cvcFilled: boolean;
  profileName?: string;
  bgRgb: string;
  fgRgb: string;
  fg: string;
  onCardChange: (details: CardDetails) => void;
  onFocus: (field: string) => void;
  accentRgb: string;
}) {
  const theme = BRAND_THEMES[brand] ?? DEFAULT_THEME;
  const textColor = theme.text;

  // Flip via scaleX squeeze — no 3D rotation so CardField stays interactive
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    // Squeeze to 0, swap content, expand back to 1
    Animated.timing(flipAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setShowBack(flipped);
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, [flipped]);

  const numberDisplay = last4
    ? `••••  ••••  ••••  ${last4}`
    : '••••  ••••  ••••  ••••';

  const expiryDisplay =
    expiryMonth != null && expiryYear != null
      ? `${String(expiryMonth).padStart(2, '0')}/${String(expiryYear).slice(-2)}`
      : 'MM/YY';

  return (
    <View style={{ marginBottom: 16 }}>
      <Animated.View
        style={{
          aspectRatio: 1.586,
          width: '100%',
          borderRadius: 18,
          transform: [{ scaleX: flipAnim }],
        }}
      >
        <LinearGradient
          colors={theme.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            borderRadius: 18,
            padding: 22,
            justifyContent: 'space-between',
            shadowColor: theme.colors[0],
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          {/* Top section — swaps between front/back */}
          {!showBack ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 38,
                    height: 28,
                    borderRadius: 6,
                    backgroundColor: theme.chipBg,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.15)',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ width: 24, height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 2 }} />
                  <View style={{ width: 24, height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 2 }} />
                </View>
                <Ionicons name="wifi-outline" size={20} color={`${textColor}40`} style={{ transform: [{ rotate: '90deg' }] }} />
              </View>
              {theme.label ? (
                <Text
                  style={{
                    fontSize: brand === 'MasterCard' ? 14 : 18,
                    fontWeight: '800',
                    color: textColor,
                    letterSpacing: brand === 'Visa' ? 3 : 1,
                    fontStyle: brand === 'Visa' ? 'italic' : 'normal',
                    opacity: 0.9,
                  }}
                >
                  {theme.label}
                </Text>
              ) : (
                <Ionicons name="card-outline" size={20} color={`${textColor}50`} />
              )}
            </View>
          ) : (
            <View style={{ height: 40, backgroundColor: 'rgba(0,0,0,0.6)', marginHorizontal: -22, marginTop: -6, borderTopLeftRadius: 18, borderTopRightRadius: 18 }} />
          )}

          {/* CardField — ONE instance, always mounted, always interactive */}
          <CardField
            postalCodeEnabled={false}
            autofocus
            placeholders={{ number: '4242 4242 4242 4242' }}
            cardStyle={{
              backgroundColor: '#00000000',
              textColor: textColor,
              placeholderColor: `${textColor}45`,
              fontSize: 18,
              borderWidth: 0,
            }}
            style={{ width: '100%', height: 44, backgroundColor: 'transparent' }}
            onCardChange={onCardChange}
            onFocus={onFocus}
          />

          {/* Bottom section — swaps between front/back */}
          {!showBack ? (
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 8, fontWeight: '600', color: `${textColor}50`, letterSpacing: 1, marginBottom: 3 }}>
                  CARDHOLDER
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: `${textColor}90`, textTransform: 'uppercase' }}>
                  {profileName ?? '————'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 8, fontWeight: '600', color: `${textColor}50`, letterSpacing: 1, marginBottom: 3 }}>
                  EXPIRES
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: expiryMonth != null ? textColor : `${textColor}40`,
                    letterSpacing: 1,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {expiryDisplay}
                </Text>
              </View>
            </View>
          ) : (
            <View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.85)',
                  borderRadius: 6,
                  height: 36,
                  paddingHorizontal: 12,
                }}
              >
                <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: 'rgba(0,0,0,0.1)', marginRight: 12, height: '100%', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 9, color: '#999', fontStyle: 'italic' }}>Authorized Signature</Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#333', letterSpacing: 3, minWidth: 50, textAlign: 'center' }}>
                  {cvcFilled ? '•••' : '___'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                {theme.label ? (
                  <Text style={{ fontSize: 12, fontWeight: '800', color: `${textColor}60`, letterSpacing: brand === 'Visa' ? 3 : 1, fontStyle: brand === 'Visa' ? 'italic' : 'normal' }}>
                    {theme.label}
                  </Text>
                ) : null}
              </View>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const KEYS: (string | 'back')[] = [
  '1', '2', '3',
  '4', '5', '6',
  '7', '8', '9',
  '.', '0', 'back',
];

type Step = 'amount' | 'card' | 'processing' | 'thanks';

export function DonationModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { colors, displayName } = useMasjidConfig();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const supabase = useSupabase();
  const { profile } = useProfile();
  const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet();

  const fg = colors.foreground.replace(/ /g, ',');
  const bg = colors.background.replace(/ /g, ',');
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;
  const fgRgb = `rgb(${fg})`;
  const bgRgb = `rgb(${bg})`;

  const [amount, setAmount] = useState(50);
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [mounted, setMounted] = useState(visible);
  const [step, setStep] = useState<Step>('amount');
  const [cardComplete, setCardComplete] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [cardBrand, setCardBrand] = useState<string>('Unknown');
  const [cardLast4, setCardLast4] = useState<string | undefined>();
  const [cardExpMonth, setCardExpMonth] = useState<number | undefined>();
  const [cardExpYear, setCardExpYear] = useState<number | undefined>();
  const [cvcFilled, setCvcFilled] = useState(false);
  const [cardFlipped, setCardFlipped] = useState(false);

  // -- Animations --
  const sheetY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const keypadH = useRef(new Animated.Value(0)).current;
  const keypadOpacity = useRef(new Animated.Value(0)).current;

  // Step cross-fade: amount ↔ card
  const amountOpacity = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const amountSlide = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(40)).current;

  // Processing & thanks
  const processingOpacity = useRef(new Animated.Value(0)).current;
  const thanksOpacity = useRef(new Animated.Value(0)).current;
  const thanksScale = useRef(new Animated.Value(0.85)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const thanksTextY = useRef(new Animated.Value(20)).current;
  const thanksTextOpacity = useRef(new Animated.Value(0)).current;
  const thanksDuaOpacity = useRef(new Animated.Value(0)).current;

  const displayAmount =
    customMode && customValue ? Number(customValue) || 0 : amount;

  // Animate step transitions
  const prevStep = useRef<Step>('amount');
  useEffect(() => {
    const prev = prevStep.current;
    prevStep.current = step;

    const dur = 280;
    const ease = Easing.out(Easing.cubic);

    if (step === 'amount') {
      Animated.parallel([
        Animated.timing(amountOpacity, { toValue: 1, duration: dur, easing: ease, useNativeDriver: true }),
        Animated.timing(amountSlide, { toValue: 0, duration: dur, easing: ease, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(cardSlide, { toValue: 40, duration: 180, useNativeDriver: true }),
        Animated.timing(processingOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    } else if (step === 'card') {
      Animated.parallel([
        Animated.timing(amountOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(amountSlide, { toValue: -40, duration: 180, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: dur, easing: ease, useNativeDriver: true }),
        Animated.timing(cardSlide, { toValue: 0, duration: dur, easing: ease, useNativeDriver: true }),
        Animated.timing(processingOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    } else if (step === 'processing') {
      Animated.parallel([
        Animated.timing(amountOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(processingOpacity, { toValue: 1, duration: 240, easing: ease, useNativeDriver: true }),
      ]).start();
    } else if (step === 'thanks') {
      Animated.sequence([
        // Fade out processing
        Animated.timing(processingOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        // Fade in container
        Animated.timing(thanksOpacity, { toValue: 1, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        // Pop in checkmark
        Animated.spring(checkScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        // Slide up text
        Animated.parallel([
          Animated.timing(thanksTextOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(thanksTextY, { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
        // Fade in dua
        Animated.timing(thanksDuaOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
      const id = setTimeout(onClose, 3000);
      return () => clearTimeout(id);
    }
  }, [step]);

  // Sheet open / close
  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.spring(sheetY, { toValue: 0, damping: 28, stiffness: 260, mass: 1, useNativeDriver: true }),
        Animated.timing(backdrop, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(sheetY, { toValue: SCREEN_H, duration: 280, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]).start(() => {
        setMounted(false);
        setCustomMode(false);
        setCustomValue('');
        setStep('amount');
        setCardComplete(false);
        setClientSecret(null);
        setCardBrand('Unknown');
        setCardLast4(undefined);
        setCardExpMonth(undefined);
        setCardExpYear(undefined);
        setCvcFilled(false);
        setCardFlipped(false);
        keypadH.setValue(0);
        keypadOpacity.setValue(0);
        amountOpacity.setValue(1);
        amountSlide.setValue(0);
        cardOpacity.setValue(0);
        cardSlide.setValue(40);
        processingOpacity.setValue(0);
        thanksOpacity.setValue(0);
        thanksScale.setValue(0.85);
        checkScale.setValue(0);
        thanksTextY.setValue(20);
        thanksTextOpacity.setValue(0);
        thanksDuaOpacity.setValue(0);
      });
    }
  }, [visible]);

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

  const handleContinueToCard = async () => {
    if (displayAmount < 1) {
      Alert.alert('Invalid amount', 'Please enter at least $1.');
      return;
    }

    setStep('processing');
    setCustomMode(false);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'create-donation-intent',
        {
          body: {
            amount: displayAmount,
            mosque_id: mosqueUuid,
            customer_email: profile?.profile_email ?? undefined,
            save_card: saveCard,
            user_id: profile?.id ?? undefined,
          },
        },
      );

      if (fnError || !data?.clientSecret) {
        throw new Error(fnError?.message ?? 'Failed to create payment intent');
      }

      // Re-init Stripe with the connected account so PaymentSheet routes correctly
      await initStripe({
        publishableKey: data.publishableKey ?? env.STRIPE_PUBLISHABLE_KEY,
        stripeAccountId: data.stripeAccountId,
      });

      // Initialize the PaymentSheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: data.clientSecret,
        customerEphemeralKeySecret: data.ephemeralKey,
        customerId: data.customerId,
        merchantDisplayName: displayName,
        returnURL: 'sahla://donation-complete',
      });

      if (initError) {
        throw new Error(initError.message);
      }

      setClientSecret(data.clientSecret);
      setCardFlipped(false);
      setStep('card');
    } catch (err: any) {
      // Restore Stripe to platform key on error
      await initStripe({ publishableKey: env.STRIPE_PUBLISHABLE_KEY }).catch(() => {});
      setStep('amount');
      Alert.alert('Error', err.message ?? 'Something went wrong.');
    }
  };

  const handleConfirmPayment = async () => {
    if (!clientSecret) return;
    setStep('processing');

    try {
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          setStep('card');
          return;
        }
        throw new Error(presentError.message);
      }

      // Restore Stripe to platform key after success
      await initStripe({ publishableKey: env.STRIPE_PUBLISHABLE_KEY }).catch(() => {});
      setStep('thanks');
    } catch (err: any) {
      // Restore Stripe to platform key on error
      await initStripe({ publishableKey: env.STRIPE_PUBLISHABLE_KEY }).catch(() => {});
      setStep('card');
      Alert.alert('Payment failed', err.message ?? 'Something went wrong.');
    }
  };

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 justify-end px-2 pb-3">
        {/* Backdrop */}
        <Animated.View
          pointerEvents={visible ? 'auto' : 'none'}
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: `rgba(${fg},0.4)`,
            opacity: backdrop,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View
          className="bg-background overflow-hidden"
          style={{
            borderRadius: 44,
            minHeight: step === 'thanks' || step === 'processing' ? 380 : undefined,
            transform: [{ translateY: sheetY }],
            shadowColor: fgRgb,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 20,
            elevation: 16,
          }}
        >
          {/* Handle */}
          <View className="items-center pt-3 pb-1">
            <View className="h-[4px] w-9 rounded-full bg-foreground/15" />
          </View>

          {/* ─── Amount Step ─── */}
          <Animated.View
            pointerEvents={step === 'amount' ? 'auto' : 'none'}
            style={{
              opacity: amountOpacity,
              transform: [{ translateX: amountSlide }],
              position: step === 'amount' ? 'relative' : 'absolute',
              left: 0,
              right: 0,
            }}
          >
            <View className="px-6 pt-5">
              <Text className="text-center text-[11px] font-semibold uppercase tracking-[2px] text-foreground/35">
                Donate
              </Text>

              <Text
                className="mt-5 text-center text-foreground"
                style={{ fontSize: 48, fontFamily: 'PlayfairDisplay_400Regular' }}
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
                  {customMode ? 'Use preset' : 'Custom amount'}
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
                        <MaterialCommunityIcons name="backspace-outline" size={22} color={`rgba(${fg},0.5)`} />
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
              <View style={{ height: 1, backgroundColor: `rgba(${fg},0.06)` }} />

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSaveCard((v) => !v)}
                className="flex-row items-center justify-center gap-2 py-4"
              >
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    borderWidth: 1.5,
                    borderColor: saveCard ? accentRgb : `rgba(${fg},0.25)`,
                    backgroundColor: saveCard ? accentRgb : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {saveCard && <Ionicons name="checkmark" size={10} color={bgRgb} />}
                </View>
                <Text style={{ fontSize: 11, color: `rgba(${fg},0.5)` }}>
                  Save card for future donations
                </Text>
              </TouchableOpacity>

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
                  Continue
                </Text>
              </TouchableOpacity>

              <Text style={{ marginTop: 14, textAlign: 'center', fontSize: 10, color: `rgba(${fg},0.3)` }}>
                Secured by Stripe
              </Text>
            </View>
          </Animated.View>

          {/* ─── Card Step ─── */}
          <Animated.View
            pointerEvents={step === 'card' ? 'auto' : 'none'}
            style={{
              opacity: cardOpacity,
              transform: [{ translateX: cardSlide }],
              position: step === 'card' ? 'relative' : 'absolute',
              left: 0,
              right: 0,
            }}
          >
            <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}>
              {/* Header row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={() => {
                    setStep('amount');
                    setClientSecret(null);
                    setCardComplete(false);
                  }}
                  hitSlop={16}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: `rgba(${fg},0.06)`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="chevron-back" size={18} color={`rgba(${fg},0.45)`} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: fgRgb }}>
                    Payment details
                  </Text>
                </View>
                <Ionicons name="lock-closed" size={13} color={`rgba(${fg},0.25)`} />
              </View>

              {/* Amount summary */}
              <View
                style={{
                  backgroundColor: `rgba(${fg},0.035)`,
                  borderRadius: 20,
                  paddingHorizontal: 20,
                  paddingVertical: 18,
                  marginBottom: 20,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontSize: 11, color: `rgba(${fg},0.4)`, fontWeight: '500', letterSpacing: 0.5 }}>
                      DONATING TO
                    </Text>
                    <Text style={{ fontSize: 14, color: fgRgb, fontWeight: '500', marginTop: 3 }}>
                      {displayName}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 11, color: `rgba(${fg},0.4)`, fontWeight: '500', letterSpacing: 0.5 }}>
                      AMOUNT
                    </Text>
                    <Text
                      style={{
                        fontSize: 26,
                        fontFamily: 'PlayfairDisplay_400Regular',
                        color: fgRgb,
                        marginTop: 1,
                      }}
                    >
                      ${displayAmount}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Interactive card with embedded input */}
              <CardVisual
                brand={cardBrand}
                cardComplete={cardComplete}
                flipped={cardFlipped}
                last4={cardLast4}
                expiryMonth={cardExpMonth}
                expiryYear={cardExpYear}
                cvcFilled={cvcFilled}
                profileName={
                  profile?.first_name && profile?.last_name
                    ? `${profile.first_name} ${profile.last_name}`
                    : undefined
                }
                bgRgb={bgRgb}
                fgRgb={fgRgb}
                fg={fg}
                onCardChange={(details) => {
                  setCardComplete(details.complete);
                  if (details.brand) setCardBrand(details.brand);
                  setCardLast4(details.last4 || undefined);
                  setCardExpMonth(details.expiryMonth ?? undefined);
                  setCardExpYear(details.expiryYear ?? undefined);
                  setCvcFilled(details.complete);
                  // If we were on CVC (flipped) but expiry got cleared, user backspaced past CVC — flip back
                  if (cardFlipped && details.expiryYear == null) {
                    setCardFlipped(false);
                  }
                }}
                onFocus={(field) => {
                  setCardFlipped(field === 'Cvc');
                }}
                accentRgb={accentRgb}
              />

              {/* Pay button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleConfirmPayment}
                style={{
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: accentRgb,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Ionicons name="shield-checkmark" size={16} color={bgRgb} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: bgRgb }}>
                  Donate ${displayAmount}
                </Text>
              </TouchableOpacity>

              {/* Security footer */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 5 }}>
                <Ionicons name="lock-closed-outline" size={10} color={`rgba(${fg},0.25)`} />
                <Text style={{ fontSize: 10, color: `rgba(${fg},0.25)`, fontWeight: '500' }}>
                  Encrypted & secured by Stripe
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* ─── Processing ─── */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: step === 'processing' ? 'relative' : 'absolute',
              left: 0,
              right: 0,
              opacity: processingOpacity,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 60,
              minHeight: 240,
            }}
          >
            <ActivityIndicator size="large" color={accentRgb} />
            <Text style={{ marginTop: 16, fontSize: 13, color: `rgba(${fg},0.4)`, fontWeight: '500' }}>
              Processing payment...
            </Text>
          </Animated.View>

          {/* ─── Thank You ─── */}
          {step === 'thanks' && (
            <Animated.View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                opacity: thanksOpacity,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 24,
                paddingTop: 40,
                paddingBottom: 48,
              }}
            >
              {/* Ornament behind check */}
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Animated.View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    width: 220,
                    height: 220,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: thanksDuaOpacity,
                  }}
                >
                  <ThankYouOrnament width={220} height={220} color={accentRgb} />
                </Animated.View>

                {/* Checkmark circle — pops in */}
                <Animated.View
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: accentRgb,
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: [{ scale: checkScale }],
                    shadowColor: accentRgb,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 20,
                    elevation: 6,
                  }}
                >
                  <Ionicons name="checkmark" size={48} color={bgRgb} />
                </Animated.View>
              </View>

              {/* Thank you text — slides up */}
              <Animated.View
                style={{
                  marginTop: 28,
                  alignItems: 'center',
                  opacity: thanksTextOpacity,
                  transform: [{ translateY: thanksTextY }],
                }}
              >
                <Text
                  style={{
                    fontSize: 22,
                    fontFamily: 'PlayfairDisplay_400Regular',
                    color: fgRgb,
                    textAlign: 'center',
                  }}
                >
                  Thank you{profile?.first_name ? `, ${profile.first_name}` : ''}
                </Text>
                <Text style={{ marginTop: 10, fontSize: 13, color: `rgba(${fg},0.5)`, textAlign: 'center', lineHeight: 20 }}>
                  Your ${displayAmount} donation to{'\n'}{displayName} has been received
                </Text>
              </Animated.View>

              {/* Dua — fades in last */}
              <Animated.View style={{ marginTop: 20, opacity: thanksDuaOpacity }}>
                <Text style={{ fontSize: 12, color: accentRgb, textAlign: 'center', fontWeight: '500', fontStyle: 'italic' }}>
                  May Allah reward you abundantly
                </Text>
              </Animated.View>
            </Animated.View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

// Inline to avoid import for one use
const StyleSheet = { absoluteFillObject: { position: 'absolute' as const, left: 0, right: 0, top: 0, bottom: 0 } };

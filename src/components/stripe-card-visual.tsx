import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CardField } from '@stripe/stripe-react-native';

import { Icon } from '@/src/components/ui/icon';

/**
 * Skeuomorphic Stripe credit-card visual with an embedded, always-interactive
 * CardField. Brand-themed gradient + flip-to-back-for-CVC animation.
 * Shared by the donation modal and the business-ads payment screen.
 */
export type CardChangeDetails = {
  complete: boolean;
  brand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
};

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

// Scale every channel of a comma-separated "R,G,B" string toward black so we can
// derive a darker second gradient stop from the masjid foreground.
const darkenCsv = (csv: string, factor: number) =>
  csv
    .split(',')
    .map((n) => Math.round(Number(n) * factor))
    .join(',');

export function CardVisual({
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
  onCardChange: (details: CardChangeDetails) => void;
  onFocus: (field: string | null) => void;
  accentRgb: string;
}) {
  // No-brand fallback (before a card brand is detected) follows the masjid
  // theme instead of a fixed beige card. `fg` is a "R,G,B" triplet.
  const defaultTheme = {
    colors: [`rgb(${fg})`, `rgb(${darkenCsv(fg, 0.8)})`] as [string, string],
    text: '#ffffff',
    label: '',
    chipBg: 'rgba(255,255,255,0.18)',
  };
  const theme = BRAND_THEMES[brand] ?? defaultTheme;
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
                <Icon name="wifi-outline" size={20} color={`${textColor}40`} style={{ transform: [{ rotate: '90deg' }] }} />
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
                <Icon name="card-outline" size={20} color={`${textColor}50`} />
              )}
            </View>
          ) : (
            <View style={{ height: 40, backgroundColor: 'rgba(0,0,0,0.6)', marginHorizontal: -22, marginTop: -6, borderTopLeftRadius: 18, borderTopRightRadius: 18 }} />
          )}

          {/* CardField — ONE instance, always mounted, always interactive */}
          <CardField
            postalCodeEnabled={false}
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

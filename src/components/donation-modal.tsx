import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import ThankYouOrnament from '@/assets/thank-you-ornament.svg';

const PRESETS = [25, 50, 100];
const SCREEN_H = Dimensions.get('window').height;
const KEYPAD_HEIGHT = 200;

const KEYS: (string | 'back')[] = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '.',
  '0',
  'back',
];

export function DonationModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { colors, displayName } = useMasjidConfig();
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
  const [step, setStep] = useState<'amount' | 'thanks'>('amount');

  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const keypadH = useRef(new Animated.Value(0)).current;
  const keypadOpacity = useRef(new Animated.Value(0)).current;
  const stepProgress = useRef(new Animated.Value(0)).current;

  const displayAmount =
    customMode && customValue ? Number(customValue) || 0 : amount;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 0,
          duration: 160,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: SCREEN_H,
          duration: 260,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setMounted(false);
        setCustomMode(false);
        setCustomValue('');
        setStep('amount');
        keypadH.setValue(0);
        keypadOpacity.setValue(0);
        stepProgress.setValue(0);
      });
    }
  }, [visible, translateY, backdrop, mounted, keypadH, keypadOpacity, stepProgress]);

  useEffect(() => {
    Animated.timing(stepProgress, {
      toValue: step === 'thanks' ? 1 : 0,
      duration: 600,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
    if (step === 'thanks') {
      const id = setTimeout(onClose, 2000);
      return () => clearTimeout(id);
    }
  }, [step, stepProgress, onClose]);

  useEffect(() => {
    if (customMode) {
      Animated.parallel([
        Animated.timing(keypadH, {
          toValue: KEYPAD_HEIGHT,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(keypadOpacity, {
          toValue: 1,
          duration: 300,
          delay: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(keypadOpacity, {
          toValue: 0,
          duration: 140,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(keypadH, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [customMode, keypadH, keypadOpacity]);

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

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end px-2 pb-3">
        <Animated.View
          pointerEvents={visible ? 'auto' : 'none'}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: `rgba(${fg},0.4)`,
            opacity: backdrop,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        <Animated.View
          className="bg-background"
          style={{
            borderRadius: 48,
            transform: [{ translateY }],
            shadowColor: fgRgb,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 24,
            elevation: 12,
          }}
        >
          <View className="items-center pb-2 pt-3">
            <View className="h-1 w-10 rounded-full bg-foreground/20" />
          </View>

          <Animated.View
            pointerEvents={step === 'amount' ? 'auto' : 'none'}
            style={{
              opacity: stepProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
            }}
          >
          <View className="px-6 pt-4">
            <Text className="text-center text-[13px] font-semibold uppercase tracking-[1px] text-foreground/40">
              Select Amount
            </Text>

            <Text
              className="mt-4 text-center text-foreground"
              style={{ fontSize: 40, fontFamily: 'PlayfairDisplay_400Regular' }}
            >
              ${displayAmount}
            </Text>

            <View className="mt-6 flex-row justify-center gap-2.5">
              {PRESETS.map((p) => {
                const selected = !customMode && amount === p;
                return (
                  <TouchableOpacity
                    key={p}
                    activeOpacity={0.8}
                    onPress={() => {
                      setAmount(p);
                      setCustomMode(false);
                      setCustomValue('');
                    }}
                    className={`items-center justify-center rounded-[20px] border ${
                      selected
                        ? 'border-primary bg-primary'
                        : 'border-foreground/20 bg-transparent'
                    }`}
                    style={{ width: 90, height: 34 }}
                  >
                    <Text
                      className={`text-[13px] font-semibold ${
                        selected ? 'text-primary-foreground' : 'text-foreground'
                      }`}
                    >
                      ${p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View className="mt-5 items-center">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  if (customMode) {
                    setCustomMode(false);
                    setCustomValue('');
                  } else {
                    setCustomMode(true);
                  }
                }}
              >
                <Text className="text-[13px] text-foreground">
                  {customMode ? 'Use preset amount' : 'Enter custom amount'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Animated.View
            style={{ height: keypadH, overflow: 'hidden' }}
            pointerEvents={customMode ? 'auto' : 'none'}
          >
            <Animated.View
              className="px-6 pt-5"
              style={{ height: KEYPAD_HEIGHT, opacity: keypadOpacity }}
            >
              <View className="flex-row flex-wrap">
                {KEYS.map((k) => (
                  <TouchableOpacity
                    key={k}
                    activeOpacity={0.5}
                    onPress={() => onKeyPress(k)}
                    className="items-center justify-center"
                    style={{ width: '33.333%', height: 56 }}
                  >
                    {k === 'back' ? (
                      <MaterialCommunityIcons
                        name="backspace-outline"
                        size={24}
                        color={fgRgb}
                      />
                    ) : (
                      <Text
                        className="text-foreground"
                        style={{ fontSize: 26, fontWeight: '400' }}
                      >
                        {k}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          </Animated.View>

          <View className="px-6 pb-8 pt-2">
            <View className="border-t border-foreground/10" />

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSaveCard((v) => !v)}
              className="flex-row items-center justify-center gap-2 py-4"
            >
              <View
                className={`h-4 w-4 items-center justify-center rounded-sm border ${
                  saveCard ? 'border-primary bg-primary' : 'border-foreground/30'
                }`}
              >
                {saveCard ? (
                  <Text className="text-[10px] font-bold text-primary-foreground">
                    ✓
                  </Text>
                ) : null}
              </View>
              <Text className="text-[11px] text-foreground/60">
                Save card for future donations
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setCustomMode(false);
                setStep('thanks');
              }}
              className="items-center justify-center rounded-full bg-primary"
              style={{ height: 43 }}
            >
              <Text className="text-[14px] font-semibold text-primary-foreground">
                Donate ${displayAmount} →
              </Text>
            </TouchableOpacity>

            <Text className="mt-4 text-center text-[11px] text-foreground/40">
              Secured by Stripe
            </Text>
          </View>
          </Animated.View>

          {step === 'thanks' ? (
            <Animated.View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                opacity: stepProgress,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 24,
                paddingTop: 80,
                paddingBottom: 48,
              }}
            >
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    width: 200,
                    height: 200,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ThankYouOrnament width={200} height={200} color={accentRgb} />
                </View>
              <View
                style={{
                  width: 132,
                  height: 132,
                  borderRadius: 66,
                  backgroundColor: bgRgb,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: fgRgb,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.08,
                  shadowRadius: 18,
                  elevation: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontFamily: 'PlayfairDisplay_400Regular',
                    color: fgRgb,
                    textAlign: 'center',
                    lineHeight: 22,
                  }}
                >
                  Thank You{'\n'}Lamine
                </Text>
              </View>
              </View>
              <Text
                style={{
                  marginTop: 28,
                  fontSize: 13,
                  color: `rgba(${fg},0.6)`,
                  textAlign: 'center',
                  paddingHorizontal: 20,
                }}
              >
                Your ${displayAmount} donation to {displayName} has been received
              </Text>
              <Text
                style={{
                  marginTop: 10,
                  fontSize: 11,
                  color: accentRgb,
                  textAlign: 'center',
                }}
              >
                May Allah reward you abundantly
              </Text>
            </Animated.View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

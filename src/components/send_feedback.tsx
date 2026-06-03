import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

const SCREEN_H = Dimensions.get('window').height;

export function SendFeedback({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (text: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useMasjidConfig();
  const fg = colors.foreground.replace(/ /g, ',');
  const fgRgb = `rgb(${fg})`;
  const bgRgb = `rgb(${colors.background.replace(/ /g, ',')})`;
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;
  const styles = makeStyles({ fg, fgRgb, bgRgb, accentRgb });
  const [text, setText] = useState('');
  const [mounted, setMounted] = useState(visible);
  const [step, setStep] = useState<'form' | 'thanks'>('form');
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const stepProgress = useRef(new Animated.Value(0)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;

  const canSend = text.trim().length > 0;

  // Swipe-down-to-dismiss via react-native-gesture-handler (PanResponder is
  // starved of touches under the app's GestureHandlerRootView). Reanimated
  // drives an outer wrapper; the inner sheet keeps its RN-Animated transforms.
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
      if (e.translationY > 90 || e.velocityY > 600) runOnJS(triggerClose)();
      else dragY.value = withSpring(0, { damping: 30, stiffness: 220 });
    });
  const dragStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dragY.value }],
  }));

  useEffect(() => {
    if (visible) {
      setMounted(true);
      dragY.value = 0;
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 280,
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
        setText('');
        setStep('form');
        stepProgress.setValue(0);
        dragY.value = 0;
      });
    }
  }, [visible, translateY, backdrop, mounted, stepProgress]);

  // Follow the keyboard with its own animation duration/curve so the sheet
  // glides up in lockstep instead of jumping (the old KeyboardAvoidingView
  // hop). iOS fires the *Will* events with a duration we can match.
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvt, (e) => {
      const lift = Math.max(0, e.endCoordinates.height - Math.max(insets.bottom, 8));
      Animated.timing(keyboardOffset, {
        toValue: lift,
        duration: e.duration || 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
    const onHide = Keyboard.addListener(hideEvt, (e) => {
      Animated.timing(keyboardOffset, {
        toValue: 0,
        duration: e?.duration || 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [insets.bottom, keyboardOffset]);

  useEffect(() => {
    Animated.timing(stepProgress, {
      toValue: step === 'thanks' ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    if (step === 'thanks') {
      const id = setTimeout(onClose, 1800);
      return () => clearTimeout(id);
    }
  }, [step, stepProgress, onClose]);

  const handleSubmit = () => {
    if (!canSend) return;
    onSubmit?.(text.trim());
    setStep('thanks');
  };

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.root}>
        <Animated.View
          pointerEvents={visible ? 'auto' : 'none'}
          style={[styles.backdrop, { opacity: backdrop }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <View pointerEvents="box-none">
          <GestureDetector gesture={dragGesture}>
          <ReAnimated.View style={dragStyle}>
          <Animated.View
            style={[
              styles.sheet,
              {
                marginBottom: Math.max(insets.bottom, 8),
                transform: [
                  { translateY: Animated.subtract(translateY, keyboardOffset) },
                ],
              },
            ]}
          >
            <View style={styles.handleRow}>
              <View style={styles.handle} />
            </View>

            {step === 'form' ? (
            <Animated.View
              style={{
                opacity: stepProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }),
              }}
            >
              <View style={styles.headerRow}>
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons
                    name="message-outline"
                    size={22}
                    color={fgRgb}
                  />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.title}>Send Feedback</Text>
                  <Text style={styles.subtitle}>
                    Share thoughts, report bugs, or request features
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  hitSlop={8}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={18}
                    color={`rgba(${fg},0.45)`}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrap}>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="Enter your feedback here..."
                  placeholderTextColor={`rgba(${fg},0.4)`}
                  multiline
                  textAlignVertical="top"
                  style={styles.input}
                />
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                activeOpacity={0.85}
                disabled={!canSend}
                accessibilityRole="button"
                accessibilityLabel="Send Feedback"
                accessibilityState={{ disabled: !canSend }}
                style={[styles.cta, !canSend && styles.ctaDisabled]}
              >
                <MaterialCommunityIcons
                  name="send"
                  size={18}
                  color={bgRgb}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.ctaText}>Send Feedback</Text>
              </TouchableOpacity>
            </Animated.View>
            ) : null}

            {step === 'thanks' ? (
              <Animated.View
                style={[styles.thanksWrap, { opacity: stepProgress }]}
              >
                <View style={styles.checkCircle}>
                  <MaterialCommunityIcons
                    name="check"
                    size={36}
                    color={accentRgb}
                  />
                </View>
                <Text style={styles.thanksTitle}>Thank You!</Text>
                <Text style={styles.thanksSubtitle}>
                  Your feedback has been sent successfully
                </Text>
              </Animated.View>
            ) : null}
          </Animated.View>
          </ReAnimated.View>
          </GestureDetector>
        </View>
      </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const makeStyles = (c: {
  fg: string;
  fgRgb: string;
  bgRgb: string;
  accentRgb: string;
}) =>
  StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: `rgba(${c.fg},0.4)`,
    },
    sheet: {
      backgroundColor: c.bgRgb,
      borderRadius: 28,
      marginHorizontal: 8,
      paddingHorizontal: 18,
      paddingTop: 2,
      paddingBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 12,
    },
    handleRow: {
      alignItems: 'center',
      paddingVertical: 6,
    },
    handle: {
      width: 44,
      height: 4,
      borderRadius: 2,
      backgroundColor: `rgba(${c.fg},0.18)`,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingTop: 4,
      paddingBottom: 12,
    },
    iconCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: `rgba(${c.fg},0.08)`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: {
      flex: 1,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: c.fgRgb,
      marginBottom: 2,
    },
    subtitle: {
      fontSize: 13,
      color: `rgba(${c.fg},0.55)`,
      lineHeight: 18,
    },
    closeBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: `rgba(${c.fg},0.06)`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    inputWrap: {
      backgroundColor: `rgba(${c.fg},0.05)`,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      minHeight: 110,
      marginBottom: 14,
    },
    input: {
      fontSize: 14,
      color: c.fgRgb,
      minHeight: 86,
      padding: 0,
    },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.accentRgb,
      borderRadius: 999,
      paddingVertical: 13,
    },
    ctaDisabled: {
      opacity: 0.45,
    },
    ctaText: {
      color: c.bgRgb,
      fontSize: 15,
      fontWeight: '600',
    },
    thanksWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 20,
    },
    checkCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 3,
      borderColor: c.accentRgb,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    thanksTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: c.fgRgb,
      marginBottom: 4,
    },
    thanksSubtitle: {
      fontSize: 13,
      color: `rgba(${c.fg},0.55)`,
      textAlign: 'center',
    },
  });

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const [text, setText] = useState('');
  const [mounted, setMounted] = useState(visible);
  const [step, setStep] = useState<'form' | 'thanks'>('form');
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const stepProgress = useRef(new Animated.Value(0)).current;

  const canSend = text.trim().length > 0;

  useEffect(() => {
    if (visible) {
      setMounted(true);
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
      });
    }
  }, [visible, translateY, backdrop, mounted, stepProgress]);

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
      <View style={styles.root}>
        <Animated.View
          pointerEvents={visible ? 'auto' : 'none'}
          style={[styles.backdrop, { opacity: backdrop }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.sheet,
              {
                marginBottom: Math.max(insets.bottom, 8),
                transform: [{ translateY }],
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
                    color="#0F172A"
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
                    color="#475569"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrap}>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="Enter your feedback here..."
                  placeholderTextColor="#9CA3AF"
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
                  color="#FFFFFF"
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
                    color="#10B981"
                  />
                </View>
                <Text style={styles.thanksTitle}>Thank You!</Text>
                <Text style={styles.thanksSubtitle}>
                  Your feedback has been sent successfully
                </Text>
              </Animated.View>
            ) : null}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#CBD5E1',
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
    backgroundColor: '#E5EAF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 110,
    marginBottom: 14,
  },
  input: {
    fontSize: 14,
    color: '#0F172A',
    minHeight: 86,
    padding: 0,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 999,
    paddingVertical: 13,
  },
  ctaDisabled: {
    backgroundColor: '#94A3B8',
  },
  ctaText: {
    color: '#FFFFFF',
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
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  thanksTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  thanksSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});

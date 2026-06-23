import { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/src/components/ui/icon';
import { useFontFamily } from '@/src/hooks/use-font-family';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useIsRTL } from '@/src/hooks/use-is-rtl';
import type { JummahSlot } from '@/src/hooks/use-jummah-schedule';

const SCREEN_H = Dimensions.get('window').height;

export function JummahDetailSheet({
  slot,
  onClose,
}: {
  slot: JummahSlot | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const { colors } = useMasjidConfig();
  const fonts = useFontFamily();
  const primary = colors.primary.replace(/ /g, ',');
  const mutedFg = colors.mutedForeground.replace(/ /g, ',');
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;
  const textRgb = `rgb(${primary})`;
  const mutedRgb = `rgb(${mutedFg})`;
  const visible = slot !== null;
  const [mounted, setMounted] = useState(visible);
  const [activeSlot, setActiveSlot] = useState<JummahSlot | null>(slot);

  const translateY = useSharedValue(SCREEN_H);
  const backdrop = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setActiveSlot(slot);
      translateY.value = withTiming(0, { duration: 220 });
      backdrop.value = withTiming(1, { duration: 220 });
    } else if (mounted) {
      backdrop.value = withTiming(0, { duration: 180 });
      translateY.value = withTiming(SCREEN_H, { duration: 180 }, (finished) => {
        if (finished) {
          runOnJS(setMounted)(false);
          runOnJS(setActiveSlot)(null);
        }
      });
    }
  }, [visible, slot, translateY, backdrop, mounted]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 80 || e.velocityY > 600) {
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 justify-end px-2 pb-3">
          <Animated.View
            pointerEvents={visible ? 'auto' : 'none'}
            style={[
              {
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                backgroundColor: `rgba(${primary},0.65)`,
              },
              backdropStyle,
            ]}
          >
            <Pressable style={{ flex: 1 }} onPress={onClose} />
          </Animated.View>

          <GestureDetector gesture={pan}>
            <Animated.View
              style={[
                {
                  borderTopLeftRadius: 32,
                  borderTopRightRadius: 32,
                  borderBottomLeftRadius: 56,
                  borderBottomRightRadius: 56,
                  overflow: 'hidden',
                  shadowColor: `rgb(${primary})`,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.18,
                  shadowRadius: 28,
                  elevation: 14,
                },
                sheetStyle,
              ]}
            >
              <View
                style={{
                  paddingTop: 12,
                  paddingHorizontal: 24,
                  paddingBottom: 40,
                  minHeight: SCREEN_H * 0.4,
                  backgroundColor: `rgb(${colors.card.replace(/ /g, ',')})`,
                }}
              >
                <View className="items-center pb-3">
                  <View style={{ height: 4, width: 40, borderRadius: 2, backgroundColor: `rgba(${primary},0.2)` }} />
                </View>

                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.7}
                  hitSlop={12}
                  style={{
                    position: 'absolute',
                    top: 18,
                    [isRTL ? 'left' : 'right']: 22,
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: `rgba(${primary},0.08)`,
                    zIndex: 10,
                  }}
                >
                  <Icon name="close" size={16} color={textRgb} />
                </TouchableOpacity>

                {activeSlot ? (
                  <View>
                    <View className="flex-row items-center" style={{ marginBottom: 16 }}>
                      <Text
                        style={{
                          color: accentRgb,
                          fontSize: 10,
                          fontWeight: '700',
                          letterSpacing: 1.5,
                          textTransform: 'uppercase',
                        }}
                      >
                        {activeSlot.time}
                      </Text>
                    </View>

                    <Text
                      style={{
                        color: textRgb,
                        fontSize: 26,
                        fontFamily: fonts.displayRegular,
                        marginBottom: 18,
                      }}
                    >
                      {activeSlot.title}
                    </Text>

                    <View className="flex-row items-center" style={{ marginBottom: 22 }}>
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          overflow: 'hidden',
                          marginEnd: 12,
                          borderWidth: 0.5,
                          borderColor: `rgba(${primary},0.15)`,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: `rgba(${primary},0.06)`,
                        }}
                      >
                        {activeSlot.avatar ? (
                          <Image
                            source={{ uri: activeSlot.avatar }}
                            style={{ width: 44, height: 44 }}
                          />
                        ) : (
                          <Icon name="account" size={22} color={mutedRgb} />
                        )}
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={{
                            color: mutedRgb,
                            fontSize: 10,
                            letterSpacing: 1,
                            textTransform: 'uppercase',
                          }}
                        >
                          {t('home.givenBy')}
                        </Text>
                        <Text style={{ color: textRgb, fontSize: 15, fontWeight: '600', marginTop: 2 }}>
                          {activeSlot.speaker}
                        </Text>
                        {activeSlot.qualifications ? (
                          <Text
                            style={{
                              color: mutedRgb,
                              fontSize: 11,
                              marginTop: 2,
                            }}
                          >
                            {activeSlot.qualifications}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    <Text
                      style={{
                        color: mutedRgb,
                        fontSize: 13,
                        lineHeight: 20,
                      }}
                    >
                      {activeSlot.description}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Animated.View>
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

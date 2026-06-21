import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  NOTIF_OFFSET_OPTIONS,
  useSaveContentNotifSettings,
} from '@/src/hooks/use-content-notification-settings';
import { useFontFamily } from '@/src/hooks/use-font-family';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

const SHEET_RADIUS = 40;
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 800;

type Props = {
  visible: boolean;
  onClose: () => void;
  contentId: string;
  mosqueId: string | null;
  initialOffsets: string[] | null;
};

export function ContentNotificationSettingsSheet({
  visible,
  onClose,
  contentId,
  mosqueId,
  initialOffsets,
}: Props) {
  const fonts = useFontFamily();
  const { colors } = useMasjidConfig();
  const fg = colors.foreground.replace(/ /g, ',');
  const BUSH = `rgb(${fg})`;
  const SURFACE = `rgb(${colors.background.replace(/ /g, ',')})`;
  const ACCENT = `rgb(${colors.accent.replace(/ /g, ',')})`;
  const MUTED = `rgba(${fg},0.55)`;
  const DIVIDER = `rgba(${fg},0.08)`;

  const [mounted, setMounted] = useState(visible);
  const translateY = useSharedValue(600);
  const backdropOpacity = useSharedValue(0);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialOffsets ?? []),
  );

  const save = useSaveContentNotifSettings(contentId, mosqueId);

  useEffect(() => {
    if (!visible) return;
    setSelected(new Set(initialOffsets ?? []));
  }, [visible, initialOffsets]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      backdropOpacity.value = withTiming(1, { duration: 220 });
    } else if (mounted) {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(
        600,
        { duration: 250, easing: Easing.in(Easing.cubic) },
        (done) => {
          if (done) runOnJS(setMounted)(false);
        },
      );
    }
  }, [visible, mounted, translateY, backdropOpacity]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateY.value = Math.max(0, e.translationY);
      const progress = Math.min(1, e.translationY / 300);
      backdropOpacity.value = 1 - progress * 0.9;
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_DISTANCE || e.velocityY > DISMISS_VELOCITY) {
        runOnJS(onClose)();
      } else {
        translateY.value = withTiming(0, {
          duration: 220,
          easing: Easing.out(Easing.cubic),
        });
        backdropOpacity.value = withTiming(1, { duration: 220 });
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const orderedSelection = useMemo(
    () => NOTIF_OFFSET_OPTIONS.filter((o) => selected.has(o)),
    [selected],
  );

  const toggle = (offset: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(offset)) next.delete(offset);
      else next.add(offset);
      return next;
    });
  };

  const handleSave = async () => {
    try {
      await save.mutateAsync(orderedSelection);
      onClose();
    } catch {
      // Failure surfaces via mutation status; sheet stays open so user can retry.
    }
  };

  if (!mounted) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View
          style={[{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)' }, backdropStyle]}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>
        <Animated.View
          pointerEvents="box-none"
          style={[
            { position: 'absolute', left: 0, right: 0, bottom: 0 },
            sheetStyle,
          ]}
        >
          <GestureDetector gesture={pan}>
            <Animated.View
              style={{
                backgroundColor: SURFACE,
                borderTopLeftRadius: SHEET_RADIUS,
                borderTopRightRadius: SHEET_RADIUS,
                paddingBottom: 24,
              }}
            >
              <View
                style={{
                  alignSelf: 'center',
                  width: 40,
                  height: 5,
                  borderRadius: 999,
                  backgroundColor: `rgba(${fg},0.18)`,
                  marginTop: 10,
                }}
              />

              <View style={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: 6 }}>
                <Text
                  style={{
                    fontFamily: fonts.bodySemibold,
                    fontSize: 18,
                    fontWeight: '700',
                    color: BUSH,
                  }}
                >
                  Reminder timing
                </Text>
                <Text
                  style={{
                    marginTop: 4,
                    fontFamily: fonts.body,
                    fontSize: 13,
                    color: MUTED,
                  }}
                >
                  Pick when you want to be reminded. Clear all to use this masjid&rsquo;s default.
                </Text>
              </View>

              <View style={{ paddingHorizontal: 14 }}>
                {NOTIF_OFFSET_OPTIONS.map((option, i) => {
                  const isOn = selected.has(option);
                  return (
                    <Pressable
                      key={option}
                      onPress={() => toggle(option)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 14,
                        paddingHorizontal: 8,
                        borderTopWidth: i === 0 ? 0 : 0.5,
                        borderTopColor: DIVIDER,
                      }}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isOn }}
                    >
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          borderWidth: 1.5,
                          borderColor: isOn ? ACCENT : `rgba(${fg},0.3)`,
                          backgroundColor: isOn ? ACCENT : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        {isOn ? (
                          <Ionicons name="checkmark" size={14} color={SURFACE} />
                        ) : null}
                      </View>
                      <Text
                        style={{
                          flex: 1,
                          fontFamily: isOn ? fonts.bodySemibold : fonts.body,
                          fontSize: 15,
                          fontWeight: isOn ? '600' : '400',
                          color: BUSH,
                        }}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  paddingHorizontal: 22,
                  paddingTop: 16,
                  gap: 10,
                }}
              >
                <Pressable
                  onPress={onClose}
                  disabled={save.isPending}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: `rgba(${fg},0.15)`,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: fonts.bodySemibold,
                      fontSize: 15,
                      fontWeight: '600',
                      color: BUSH,
                    }}
                  >
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  disabled={save.isPending}
                  style={{
                    flex: 1.4,
                    paddingVertical: 14,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: ACCENT,
                    opacity: save.isPending ? 0.6 : 1,
                  }}
                >
                  {save.isPending ? (
                    <ActivityIndicator size="small" color={SURFACE} />
                  ) : (
                    <Text
                      style={{
                        fontFamily: fonts.bodySemibold,
                        fontSize: 15,
                        fontWeight: '700',
                        color: SURFACE,
                      }}
                    >
                      Save
                    </Text>
                  )}
                </Pressable>
              </View>
            </Animated.View>
          </GestureDetector>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  PanResponder,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import type { JummahSlot } from '@/src/hooks/use-jummah-schedule';

const SCREEN_H = Dimensions.get('window').height;

export function JummahDetailSheet({
  slot,
  onClose,
}: {
  slot: JummahSlot | null;
  onClose: () => void;
}) {
  const { colors } = useMasjidConfig();
  const primary = colors.primary.replace(/ /g, ',');
  const mutedFg = colors.mutedForeground.replace(/ /g, ',');
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;
  const textRgb = `rgb(${primary})`;
  const mutedRgb = `rgb(${mutedFg})`;
  const visible = slot !== null;
  const [mounted, setMounted] = useState(visible);
  const [activeSlot, setActiveSlot] = useState<JummahSlot | null>(slot);
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setActiveSlot(slot);
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 1400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: SCREEN_H,
          duration: 1400,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setMounted(false);
        setActiveSlot(null);
      });
    }
  }, [visible, slot, translateY, backdrop, mounted]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_, g) => {
          if (g.dy > 0) translateY.setValue(g.dy);
        },
        onPanResponderRelease: (_, g) => {
          if (g.dy > 120 || g.vy > 0.8) {
            onClose();
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 4,
            }).start();
          }
        },
      }),
    [translateY, onClose],
  );

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 justify-end px-2 pb-3">
        <Animated.View
          pointerEvents={visible ? 'auto' : 'none'}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: `rgba(${primary},0.65)`,
            opacity: backdrop,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        <Animated.View
          {...panResponder.panHandlers}
          style={{
            transform: [{ translateY }],
            borderRadius: 56,
            overflow: 'hidden',
            shadowColor: `rgb(${primary})`,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.18,
            shadowRadius: 28,
            elevation: 14,
          }}
        >
          <View
            style={{
              paddingTop: 12,
              paddingHorizontal: 24,
              paddingBottom: 40,
              minHeight: SCREEN_H * 0.4,
              backgroundColor: '#FFFFFF',
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
                right: 22,
                width: 30,
                height: 30,
                borderRadius: 15,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: `rgba(${primary},0.08)`,
                zIndex: 10,
              }}
            >
              <MaterialCommunityIcons name="close" size={16} color={textRgb} />
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
                    fontFamily: 'PlayfairDisplay_400Regular',
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
                      marginRight: 12,
                      borderWidth: 0.5,
                      borderColor: `rgba(${primary},0.15)`,
                    }}
                  >
                    <Image
                      source={{ uri: activeSlot.avatar }}
                      style={{ width: 44, height: 44 }}
                    />
                  </View>
                  <View>
                    <Text
                      style={{
                        color: mutedRgb,
                        fontSize: 10,
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                      }}
                    >
                      Given by
                    </Text>
                    <Text style={{ color: textRgb, fontSize: 15, fontWeight: '600', marginTop: 2 }}>
                      {activeSlot.speaker}
                    </Text>
                    <Text
                      style={{
                        color: mutedRgb,
                        fontSize: 11,
                        marginTop: 2,
                      }}
                    >
                      {activeSlot.qualifications}
                    </Text>
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
      </View>
    </Modal>
  );
}

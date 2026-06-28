import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  Text,
  View,
} from 'react-native';

import { Icon } from '@/src/components/ui/icon';
import {
  type PrayerName,
  NOTIF_TOKENS,
  type NotifToken,
} from '@/src/hooks/use-prayer-alerts';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

const SCREEN_H = Dimensions.get('window').height;

type Option = {
  token: NotifToken | 'mute';
  labelKey: string;
  subtitleKey: string;
};

const OPTIONS: Option[] = [
  {
    token: NOTIF_TOKENS.PRAYER_TIME,
    labelKey: 'notifyPrayerTime',
    subtitleKey: 'notifyPrayerTimeDesc',
  },
  {
    token: NOTIF_TOKENS.IQAMAH_TIME,
    labelKey: 'notifyIqamahTime',
    subtitleKey: 'notifyIqamahTimeDesc',
  },
  {
    token: NOTIF_TOKENS.THIRTY_MIN,
    labelKey: 'reminder30Min',
    subtitleKey: 'reminder30MinDesc',
  },
  {
    token: 'mute',
    labelKey: 'mute',
    subtitleKey: 'muteDesc',
  },
];

// Map a raw prayer name to its i18n key suffix for translation.
function prayerNameKey(name: string): string | null {
  const n = name.toLowerCase();
  if (n.includes('fajr')) return 'fajr';
  if (n.includes('dhuhr') || n.includes('zuhr') || n.includes('duhr')) return 'dhuhr';
  if (n.includes('asr')) return 'asr';
  if (n.includes('maghrib')) return 'maghrib';
  if (n.includes('isha')) return 'isha';
  return null;
}

type Props = {
  prayer: PrayerName | null;
  currentSettings: string[];
  onSave: (settings: string[]) => void;
  onApplyToAll: (settings: string[]) => void;
  onClose: () => void;
};

export function PrayerNotificationSheet({
  prayer,
  currentSettings,
  onSave,
  onApplyToAll,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useMasjidConfig();
  const primaryRgb = `rgb(${colors.primary.replace(/ /g, ',')})`;
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;

  const visible = prayer !== null;
  const [mounted, setMounted] = useState(visible);
  const [activePrayer, setActivePrayer] = useState<PrayerName | null>(prayer);
  const [selected, setSelected] = useState<Set<string>>(new Set(currentSettings));

  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  // Sync local state when the sheet opens with a new prayer
  useEffect(() => {
    if (visible && prayer) {
      setActivePrayer(prayer);
      setSelected(new Set(currentSettings));
    }
  }, [visible, prayer, currentSettings]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.setValue(SCREEN_H);
      backdrop.setValue(0);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 0,
          duration: 250,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: SCREEN_H,
          duration: 350,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setMounted(false);
        setActivePrayer(null);
      });
    }
  }, [visible, translateY, backdrop, mounted]);

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

  const isMuted = selected.size === 0 || selected.has('mute');

  const toggleOption = (token: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (token === 'mute') {
        // Mute clears everything
        return new Set<string>();
      }
      // Selecting a real option removes mute
      next.delete('mute');
      if (next.has(token)) {
        next.delete(token);
      } else {
        next.add(token);
      }
      return next;
    });
  };

  const isChecked = (token: string): boolean => {
    if (token === 'mute') return isMuted;
    return selected.has(token) && !isMuted;
  };

  const buildSettings = (): string[] => {
    if (isMuted) return [];
    const result = new Set(selected);
    result.delete('mute');
    return Array.from(result);
  };

  const handleSave = () => {
    onSave(buildSettings());
    onClose();
  };

  const handleApplyToAll = () => {
    onApplyToAll(buildSettings());
    onClose();
  };

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 8, paddingBottom: 20 }}>
        <Animated.View
          pointerEvents={visible ? 'auto' : 'none'}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            opacity: backdrop,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        <Animated.View
          {...panResponder.panHandlers}
          style={{
            transform: [{ translateY }],
            borderRadius: 36,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 14,
          }}
        >
          <View
            style={{
              paddingTop: 16,
              paddingHorizontal: 24,
              paddingBottom: 28,
              backgroundColor: '#FFFFFF',
            }}
          >
            {/* Drag handle */}
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <View
                style={{
                  height: 4,
                  width: 40,
                  borderRadius: 2,
                  backgroundColor: 'rgba(0,0,0,0.15)',
                }}
              />
            </View>

            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: primaryRgb,
                }}
              >
                {t('prayer.notificationSettingsTitle', {
                  prayer: activePrayer
                    ? (() => {
                        const k = prayerNameKey(activePrayer);
                        return k ? t(`prayer.${k}`) : activePrayer;
                      })()
                    : '',
                })}
              </Text>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0,0,0,0.06)',
                }}
              >
                <Icon name="close" size={16} color={primaryRgb} />
              </Pressable>
            </View>

            {/* Options */}
            {OPTIONS.map((opt) => {
              const checked = isChecked(opt.token);
              return (
                <Pressable
                  key={opt.token}
                  onPress={() => toggleOption(opt.token)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    paddingVertical: 14,
                    borderBottomWidth: opt.token !== 'mute' ? 0.5 : 0,
                    borderBottomColor: 'rgba(0,0,0,0.08)',
                  }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 4,
                      borderWidth: checked ? 0 : 1.5,
                      borderColor: 'rgba(0,0,0,0.25)',
                      backgroundColor: checked ? accentRgb : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginEnd: 14,
                      marginTop: 1,
                    }}
                  >
                    {checked && (
                      <Icon name="check" size={16} color="#FFFFFF" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: primaryRgb,
                      }}
                    >
                      {t(`prayer.${opt.labelKey}`)}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: 'rgba(0,0,0,0.5)',
                        marginTop: 3,
                        lineHeight: 16,
                      }}
                    >
                      {t(`prayer.${opt.subtitleKey}`)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}

            {/* Apply to All Prayers */}
            <Pressable
              onPress={handleApplyToAll}
              style={{
                marginTop: 24,
                height: 48,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: accentRgb,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: accentRgb,
                }}
              >
                {t('prayer.applyToAll')}
              </Text>
            </Pressable>

            {/* Save */}
            <Pressable
              onPress={handleSave}
              style={{
                marginTop: 12,
                height: 48,
                borderRadius: 14,
                backgroundColor: accentRgb,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
              }}
            >
              <Icon
                name="check"
                size={18}
                color="#FFFFFF"
                style={{ marginEnd: 6 }}
              />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: '#FFFFFF',
                }}
              >
                {t('common.save')}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

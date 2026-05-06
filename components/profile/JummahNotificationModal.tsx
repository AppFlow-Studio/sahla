import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { JummahNotificationOption } from '@/src/hooks/use-notifications';

const COLORS = {
  sheetBg: '#FFFBF2',
  backdrop: 'rgba(0, 0, 0, 0.7)',
  titleText: '#0A261E',
  bodyText: '#0A261E',
  subtleText: 'rgba(10, 38, 30, 0.6)',
  accent: '#FFFBF2',
  checkboxBorder: '#0A261E',
  checkboxFill: '#0A261E',
  checkboxIcon: '#FFFBF2',
  saveBg: '#0A261E',
  saveBorder: '#0A261E',
  handle: 'rgba(10, 38, 30, 0.2)',
};

type OptionKey = JummahNotificationOption | 'mute';

const OPTIONS: {
  key: OptionKey;
  title: string;
  description: string;
}[] = [
  {
    key: 'prayer_time',
    title: 'Notify at Prayer Time',
    description: "Get notified exactly when it's time for Jummah",
  },
  {
    key: 'reminder_30m',
    title: '30-Minute Reminder',
    description: 'Get reminded 30 minutes before Jummah',
  },
  {
    key: 'reminder_1h',
    title: '1-Hour Reminder',
    description: 'Get reminded 1 hour before Jummah',
  },
  {
    key: 'mute',
    title: 'Mute',
    description: 'Disable all notifications for Jummah',
  },
];

type Props = {
  currentSettings: JummahNotificationOption[];
  isSaving: boolean;
  onClose: () => void;
  onSave: (settings: JummahNotificationOption[]) => Promise<void>;
};

export function JummahNotificationModal({
  currentSettings,
  isSaving,
  onClose,
  onSave,
}: Props) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<JummahNotificationOption[]>(
    currentSettings,
  );

  useEffect(() => {
    setSelected(currentSettings);
  }, [currentSettings]);

  const isMuted = selected.length === 0;

  const isChecked = (key: OptionKey): boolean =>
    key === 'mute' ? isMuted : selected.includes(key);

  const handleToggle = (key: OptionKey) => {
    if (key === 'mute') {
      setSelected([]);
      return;
    }
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key],
    );
  };

  const handleSave = async () => {
    try {
      await onSave(selected);
      onClose();
    } catch {}
  };

  return (
    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
      <Pressable
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: COLORS.backdrop,
        }}
        onPress={onClose}
      />
      <View
        style={{
          backgroundColor: COLORS.sheetBg,
          borderRadius: 28,
          marginHorizontal: 16,
          marginBottom: insets.bottom + 14,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 20,
        }}
      >
        <View
          style={{
            alignSelf: 'center',
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: COLORS.handle,
            marginBottom: 16,
          }}
        />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 18,
          }}
        >
          <Text
            style={{
              color: COLORS.titleText,
              fontSize: 18,
              fontWeight: '700',
            }}
          >
            Jummah notification settings
          </Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={22} color={COLORS.titleText} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {OPTIONS.map((opt, i) => {
            const checked = isChecked(opt.key);
            return (
              <Pressable
                key={opt.key}
                onPress={() => handleToggle(opt.key)}
                disabled={isSaving}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  paddingVertical: 10,
                  marginTop: i === 0 ? 0 : 4,
                }}
              >
                <View
                  style={{
                    height: 22,
                    width: 22,
                    borderRadius: 4,
                    borderWidth: 1.5,
                    borderColor: COLORS.checkboxBorder,
                    backgroundColor: checked
                      ? COLORS.checkboxFill
                      : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 2,
                    marginRight: 12,
                  }}
                >
                  {checked && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={COLORS.checkboxIcon}
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: COLORS.bodyText,
                      fontSize: 15,
                      fontWeight: '700',
                    }}
                  >
                    {opt.title}
                  </Text>
                  <Text
                    style={{
                      marginTop: 2,
                      color: COLORS.subtleText,
                      fontSize: 13,
                      lineHeight: 18,
                    }}
                  >
                    {opt.description}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          onPress={handleSave}
          disabled={isSaving}
          style={{
            marginTop: 16,
            paddingVertical: 14,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: COLORS.saveBorder,
            backgroundColor: COLORS.saveBg,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            opacity: isSaving ? 0.6 : 1,
          }}
        >
          <Ionicons
            name="checkmark"
            size={18}
            color={COLORS.accent}
            style={{ marginRight: 8 }}
          />
          <Text
            style={{
              color: COLORS.accent,
              fontSize: 16,
              fontWeight: '700',
            }}
          >
            Save
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

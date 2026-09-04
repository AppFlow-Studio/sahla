import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Fragment } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFontFamily } from '@/src/hooks/use-font-family';
import { useStatusBarStyle } from '@/src/hooks/use-status-bar-style';
import {
  useNotificationSettings,
  type SettingsToggleKey,
} from '@/src/hooks/use-notification-settings';

import { Toggle } from './Toggle';

const INK = '#0A261E';
const INK_MUTED = 'rgba(10,38,30,0.6)';
const SURFACE = '#FFFBF2';
const HAIRLINE = 'rgba(10,38,30,0.1)';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type ToggleRow = {
  kind: 'toggle';
  key: SettingsToggleKey;
  icon: IoniconName;
  label: string;
  subtitle?: string;
};

type LinkRow = {
  kind: 'link';
  key: string;
  icon: IoniconName;
  label: string;
  subtitle?: string;
  onPress?: () => void;
};

type Row = ToggleRow | LinkRow;

type Section = {
  title?: string;
  rows: Row[];
};

const SECTIONS: Section[] = [
  {
    rows: [
      {
        kind: 'toggle',
        key: 'athan',
        icon: 'moon-outline',
        label: 'Athan notifications',
        subtitle: 'Alert at athan time',
      },
      {
        kind: 'link',
        key: 'customize',
        icon: 'sunny-outline',
        label: 'Customize by prayer',
        onPress: () => router.push('/profile/prayer-alerts' as Href),
      },
    ],
  },
  {
    title: 'Events & programs',
    rows: [
      {
        kind: 'toggle',
        key: 'eventReminders',
        icon: 'calendar-outline',
        label: 'Event reminders',
        subtitle: "For your RSVP's events",
      },
      {
        kind: 'toggle',
        key: 'newPrograms',
        icon: 'sparkles-outline',
        label: 'New programs for you',
        subtitle: 'Based on your interests',
      },
    ],
  },
  {
    title: 'Community',
    rows: [
      {
        kind: 'toggle',
        key: 'jummah',
        icon: 'book-outline',
        label: 'Jummah reminders',
        subtitle: 'Thursday evening',
      },
      {
        kind: 'toggle',
        key: 'announcements',
        icon: 'chatbubble-ellipses-outline',
        label: 'Masjid announcements',
      },
    ],
  },
];

function SettingsRow({
  row,
  on,
  onToggle,
}: {
  row: Row;
  on?: boolean;
  onToggle?: (next: boolean) => void;
}) {
  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
      }}
    >
      <View style={{ width: 24, marginRight: 14, alignItems: 'center' }}>
        <Ionicons name={row.icon} size={16} color={INK} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '500',
            lineHeight: 18,
            color: INK,
          }}
        >
          {row.label}
        </Text>
        {row.subtitle ? (
          <Text
            style={{
              fontSize: 12,
              lineHeight: 18,
              color: INK_MUTED,
              marginTop: 2,
            }}
          >
            {row.subtitle}
          </Text>
        ) : null}
      </View>
      {row.kind === 'toggle' ? (
        <Toggle value={!!on} onChange={(next) => onToggle?.(next)} />
      ) : (
        <Ionicons name="chevron-forward" size={16} color={INK_MUTED} />
      )}
    </View>
  );

  if (row.kind === 'link') {
    return (
      <Pressable onPress={row.onPress} android_ripple={{ color: HAIRLINE }}>
        {content}
      </Pressable>
    );
  }
  return content;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={{ marginTop: 24 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: INK,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          marginBottom: 12,
        }}
      >
        {title}
      </Text>
      <View style={{ height: 1, backgroundColor: INK }} />
    </View>
  );
}

export function NotificationSettings({ onBack }: { onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  const fonts = useFontFamily();
  const { toggles, setToggle } = useNotificationSettings();
  useStatusBarStyle('dark');

  const handleBack = onBack ?? (() => router.back());

  const handleToggle = (key: SettingsToggleKey, next: boolean) => {
    setToggle(key, next).catch(() => {});
  };

  return (
    <View style={{ flex: 1, backgroundColor: SURFACE, paddingTop: insets.top }}>
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 12,
        }}
      >
        <Pressable onPress={handleBack} hitSlop={12} style={{ marginBottom: 12 }}>
          <Ionicons name="arrow-back" size={22} color={INK_MUTED} />
        </Pressable>
        <Text
          style={{
            fontFamily: fonts.display,
            fontWeight: '500',
            fontSize: 30,
            lineHeight: 38,
            color: INK,
          }}
        >
          Notification Settings
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS.map((section, sectionIndex) => (
          <Fragment key={section.title ?? `__top_${sectionIndex}`}>
            {section.title ? <SectionHeader title={section.title} /> : null}
            {section.rows.map((row, rowIndex) => {
              const isLast = rowIndex === section.rows.length - 1;
              return (
                <Fragment key={row.key}>
                  <SettingsRow
                    row={row}
                    on={
                      row.kind === 'toggle'
                        ? toggles[row.key]
                        : undefined
                    }
                    onToggle={
                      row.kind === 'toggle'
                        ? (next) => handleToggle(row.key, next)
                        : undefined
                    }
                  />
                  {!isLast ? (
                    <View
                      style={{ height: 1, backgroundColor: HAIRLINE }}
                    />
                  ) : null}
                </Fragment>
              );
            })}
          </Fragment>
        ))}
      </ScrollView>
    </View>
  );
}

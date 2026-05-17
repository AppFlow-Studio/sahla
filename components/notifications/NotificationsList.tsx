import { Ionicons } from '@expo/vector-icons';
import { Fragment } from 'react';
import { Image, Text, View } from 'react-native';

const TINY_COLORED_BELL = require('@/assets/images/tiny_colored_bell.png');

const INK = '#0A261E';
const INK_MUTED = 'rgba(10,38,30,0.6)';
const HAIRLINE = 'rgba(10,38,30,0.1)';
const GOLD = '#B8922A';
const GOLD_TINT = 'rgba(184,146,42,0.05)';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export type NotificationCategory = 'prayer' | 'event' | 'update';

export type NotificationItem = {
  id: string;
  category: NotificationCategory;
  group: string;
  title: string;
  subtitle?: string;
  time?: string;
  icon?: IoniconName;
  unread?: boolean;
};

type Props = {
  items: NotificationItem[];
};

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={{ marginTop: 24 }}>
      <Text
        style={{
          paddingHorizontal: 24,
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
      <View style={{ marginHorizontal: 24, height: 1, backgroundColor: INK }} />
    </View>
  );
}

function NotificationRow({ item }: { item: NotificationItem }) {
  return (
    <View
      style={{
        paddingVertical: 14,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: item.unread ? GOLD_TINT : 'transparent',
      }}
    >
      <View style={{ width: 20, marginRight: 12, paddingTop: 2, alignItems: 'center' }}>
        {item.unread ? (
          <Image
            source={TINY_COLORED_BELL}
            style={{ width: 16, height: 16 }}
            resizeMode="contain"
          />
        ) : (
          <Ionicons
            name={item.icon ?? 'notifications-outline'}
            size={16}
            color={INK}
          />
        )}
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {item.unread ? (
            <View
              style={{
                width: 4,
                height: 4,
                borderRadius: 999,
                backgroundColor: GOLD,
                marginRight: 6,
              }}
            />
          ) : null}
          <Text
            style={{
              flex: 1,
              fontSize: 13,
              fontWeight: '500',
              lineHeight: 18,
              color: INK,
            }}
          >
            {item.title}
          </Text>
        </View>
        {item.subtitle ? (
          <Text
            style={{
              fontSize: 12,
              lineHeight: 18,
              color: INK_MUTED,
              marginTop: 2,
            }}
          >
            {item.subtitle}
          </Text>
        ) : null}
      </View>

      {item.time ? (
        <Text
          style={{
            fontSize: 10,
            lineHeight: 14,
            color: INK_MUTED,
            marginLeft: 8,
            marginTop: 2,
          }}
        >
          {item.time}
        </Text>
      ) : null}
    </View>
  );
}

export function NotificationsList({ items }: Props) {
  const groups: { title: string; rows: NotificationItem[] }[] = [];
  for (const item of items) {
    let g = groups.find((x) => x.title === item.group);
    if (!g) {
      g = { title: item.group, rows: [] };
      groups.push(g);
    }
    g.rows.push(item);
  }

  return (
    <View>
      {groups.map((group) => (
        <Fragment key={group.title}>
          <SectionHeader title={group.title} />
          {group.rows.map((item, rIdx) => (
            <Fragment key={item.id}>
              <NotificationRow item={item} />
              {rIdx < group.rows.length - 1 ? (
                <View
                  style={{
                    marginHorizontal: 24,
                    height: 1,
                    backgroundColor: HAIRLINE,
                  }}
                />
              ) : null}
            </Fragment>
          ))}
        </Fragment>
      ))}
    </View>
  );
}

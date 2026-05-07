import { View, Text } from 'react-native';

import { useTodaysEvents } from '@/src/hooks/use-todays-events';

export function TodaysEvents() {
  const { events, date } = useTodaysEvents();

  if (events.length === 0) return null;

  return (
    <View>
      <View className="flex-row items-end justify-between pb-2">
        <Text className="text-[13px] font-semibold uppercase tracking-[1px] text-foreground">
          Today&apos;s Events
        </Text>
        <Text className="text-[11px] font-semibold text-accent">
          {date}
        </Text>
      </View>

      <View className="border-t border-foreground">
        {events.map((event, index) => (
          <View
            key={event.id}
            className={`flex-row items-center ${
              index < events.length - 1
                ? 'border-b border-foreground/15'
                : ''
            }`}
            style={{ height: 58 }}
          >
            <Text
              className="text-foreground"
              style={{
                width: 64,
                fontSize: 12,
                fontWeight: '500',
                textAlign: 'right',
                marginRight: 20,
              }}
            >
              {event.time}
            </Text>
            <Text
              className="flex-1 text-foreground"
              style={{ fontSize: 12, fontWeight: '500' }}
            >
              {event.title}
            </Text>
            <Text className="text-[9px] text-accent">{event.category}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

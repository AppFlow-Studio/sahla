import { View, Text } from 'react-native';
import { COLORS, withAlpha } from '../../config';
import { MOCK_EVENTS, MOCK_EVENTS_DATE } from '../../mock-data';

export function TodaysEvents() {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, color: COLORS.foreground }}>
          Today's Events
        </Text>
        <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.accent }}>
          {MOCK_EVENTS_DATE}
        </Text>
      </View>

      <View style={{ borderTopWidth: 1, borderTopColor: COLORS.foreground }}>
        {MOCK_EVENTS.map((event, index) => (
          <View
            key={event.id + index}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              height: 58,
              borderBottomWidth: index < MOCK_EVENTS.length - 1 ? 1 : 0,
              borderBottomColor: withAlpha(COLORS.foreground, 0.15),
            }}
          >
            <Text
              style={{
                width: 64,
                fontSize: 12,
                fontWeight: '500',
                textAlign: 'right',
                marginRight: 20,
                color: COLORS.foreground,
              }}
            >
              {event.time}
            </Text>
            <Text style={{ flex: 1, fontSize: 12, fontWeight: '500', color: COLORS.foreground }}>
              {event.title}
            </Text>
            <Text style={{ fontSize: 9, color: COLORS.accent }}>{event.category}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

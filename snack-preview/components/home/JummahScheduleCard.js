import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, withAlpha } from '../../config';
import { MOCK_JUMMAH_DATE, MOCK_JUMMAH_SCHEDULE } from '../../mock-data';

export function JummahScheduleCard() {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
      <View
        style={{
          alignSelf: 'flex-start',
          borderWidth: 0.5,
          borderColor: withAlpha(COLORS.accent, 0.5),
          paddingHorizontal: 10,
          paddingVertical: 3,
          borderRadius: 100,
        }}
      >
        <Text style={{ color: COLORS.accent, fontSize: 10 }}>{MOCK_JUMMAH_DATE}</Text>
      </View>

      <Text
        style={{
          color: COLORS.primaryForeground,
          fontSize: 20,
          marginTop: 10,
          marginBottom: 14,
        }}
      >
        Jummah Schedule
      </Text>

      <View style={{ gap: 8 }}>
        {MOCK_JUMMAH_SCHEDULE.map((slot) => (
          <TouchableOpacity
            key={slot.id}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 14,
              backgroundColor: slot.isCurrent ? withAlpha(COLORS.accent, 0.18) : 'transparent',
              borderWidth: slot.isCurrent ? 0.5 : 0,
              borderColor: withAlpha(COLORS.accent, 0.5),
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: withAlpha(COLORS.accent, 0.18),
                marginRight: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name={slot.icon} size={18} color={COLORS.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.primaryForeground, fontSize: 13, fontWeight: '600' }}>
                {slot.title}
              </Text>
              <Text style={{ color: withAlpha(COLORS.primaryForeground, 0.55), fontSize: 10, marginTop: 2 }}>
                {slot.speaker}
              </Text>
            </View>
            <Text style={{ color: COLORS.primaryForeground, fontSize: 13, fontWeight: '600' }}>
              {slot.time}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

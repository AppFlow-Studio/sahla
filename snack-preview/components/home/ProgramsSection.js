import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, withAlpha } from '../../config';
import { MOCK_PROGRAMS } from '../../mock-data';

export function ProgramsSection() {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, color: COLORS.foreground }}>
          Programs
        </Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={{ fontSize: 10, color: withAlpha(COLORS.foreground, 0.6) }}>SEE ALL {'\u2192'}</Text>
        </TouchableOpacity>
      </View>
      <View style={{ borderTopWidth: 1, borderTopColor: COLORS.foreground }}>
        {MOCK_PROGRAMS.map((program, index) => (
          <View
            key={program.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 16,
              borderBottomWidth: index < MOCK_PROGRAMS.length - 1 ? 1 : 0,
              borderBottomColor: withAlpha(COLORS.foreground, 0.1),
            }}
          >
            <View
              style={{
                marginRight: 12,
                height: 50,
                width: 50,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                backgroundColor: withAlpha(COLORS.primary, 0.1),
              }}
            >
              <MaterialCommunityIcons name={program.icon} size={24} color={COLORS.foreground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.foreground }}>
                {program.title}
              </Text>
              <Text style={{ marginTop: 2, fontSize: 10, color: withAlpha(COLORS.foreground, 0.6) }}>
                {program.date}
              </Text>
              <Text style={{ marginTop: 2, fontSize: 10, color: COLORS.accent }}>
                {program.category}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={16} color={withAlpha(COLORS.foreground, 0.4)} />
          </View>
        ))}
      </View>
    </View>
  );
}

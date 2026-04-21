import { View, Text, TouchableOpacity } from 'react-native';
import { COLORS, withAlpha } from '../../config';

export function DonateBanner() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 999,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: withAlpha(COLORS.primaryForeground, 0.1),
          }}
        >
          <Text style={{ color: COLORS.accent, fontSize: 20, lineHeight: 22 }}>{'\u2665'}</Text>
        </View>
        <View>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: COLORS.primaryForeground }}>
            Support Your Masjid
          </Text>
          <Text style={{ fontSize: 11, color: withAlpha(COLORS.primaryForeground, 0.55) }}>
            Donate
          </Text>
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.8}>
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 999,
            backgroundColor: withAlpha(COLORS.primaryForeground, 0.1),
          }}
        >
          <Text style={{ color: COLORS.accent, fontSize: 11, fontWeight: '800' }}>
            DONATE {'\u2192'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

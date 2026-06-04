import { View, Text } from 'react-native';
import { COLORS, withAlpha } from '../../config';
import { MOCK_FEATURED } from '../../mock-data';

export function FeaturedCard() {
  return (
    <View
      style={{
        overflow: 'hidden',
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingBottom: 16,
        paddingTop: 16,
        minHeight: 110,
      }}
    >
      <View
        style={{
          alignSelf: 'flex-start',
          borderRadius: 999,
          borderWidth: 1,
          borderColor: withAlpha(COLORS.accent, 0.4),
          paddingHorizontal: 10,
          paddingVertical: 2,
        }}
      >
        <Text style={{ fontSize: 10, color: COLORS.accent }}>{MOCK_FEATURED.badge}</Text>
      </View>

      <View style={{ marginTop: 12 }}>
        <Text style={{ fontSize: 17, fontWeight: 'bold', color: COLORS.primaryForeground }}>
          {MOCK_FEATURED.title}
        </Text>
        <Text style={{ marginTop: 4, fontSize: 11, color: withAlpha(COLORS.primaryForeground, 0.55) }}>
          {MOCK_FEATURED.subtitle}
        </Text>
      </View>
    </View>
  );
}

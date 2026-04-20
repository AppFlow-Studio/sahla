import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, withAlpha } from '../../config';
import { MOCK_RECOMMENDED } from '../../mock-data';

export function RecommendedForYou() {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, color: COLORS.foreground }}>
          Recommended for you
        </Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={{ fontSize: 10, color: withAlpha(COLORS.foreground, 0.6) }}>SEE ALL {'\u2192'}</Text>
        </TouchableOpacity>
      </View>
      <View style={{ borderTopWidth: 1, borderTopColor: COLORS.foreground, paddingTop: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {MOCK_RECOMMENDED.map((item) => (
            <TouchableOpacity key={item.id} activeOpacity={0.85}>
              <View
                style={{
                  marginBottom: 8,
                  height: 196,
                  width: 220,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  borderRadius: 16,
                  backgroundColor: COLORS.primary,
                }}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={64}
                  color={withAlpha(COLORS.primaryForeground, 0.85)}
                />
              </View>
              <Text style={{ width: 220, fontSize: 13, fontWeight: '600', color: COLORS.foreground }}>
                {item.title}
              </Text>
              <Text style={{ width: 220, fontSize: 11, color: withAlpha(COLORS.foreground, 0.6) }}>
                {item.category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

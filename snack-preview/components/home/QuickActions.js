import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, withAlpha } from '../../config';
import { MOCK_QUICK_ACTIONS } from '../../mock-data';

export function QuickActions() {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
      {MOCK_QUICK_ACTIONS.map((action) => (
        <TouchableOpacity key={action.id} style={{ alignItems: 'center' }} activeOpacity={0.7}>
          <View
            style={{
              marginBottom: 8,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: withAlpha(COLORS.foreground, 0.1),
              backgroundColor: COLORS.muted,
              height: 63,
              width: 66,
            }}
          >
            <MaterialCommunityIcons name={action.icon} size={24} color={COLORS.foreground} />
          </View>
          <Text
            style={{
              fontSize: 8,
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: 1,
              color: withAlpha(COLORS.foreground, 0.6),
            }}
          >
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

import { View, Text, TouchableOpacity } from 'react-native';
import { COLORS } from '../../config';

export function CommunityPartnerCta() {
  return (
    <TouchableOpacity activeOpacity={0.85}>
      <View style={{ alignItems: 'center', borderRadius: 999, backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Text style={{ fontSize: 14, color: COLORS.primaryForeground }}>
          Become a Community Partner {'\u2192'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

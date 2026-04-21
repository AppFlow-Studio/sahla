import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, withAlpha } from '../../config';
import { MOCK_COMMUNITY_PARTNER } from '../../mock-data';

function IconPill({ icon }) {
  return (
    <View
      style={{
        height: 26,
        width: 26,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 13,
        borderWidth: 1,
        borderColor: withAlpha(COLORS.foreground, 0.2),
      }}
    >
      <MaterialCommunityIcons name={icon} size={14} color={COLORS.foreground} />
    </View>
  );
}

export function CommunityPartners() {
  const partner = MOCK_COMMUNITY_PARTNER;

  return (
    <View>
      <View style={{ paddingBottom: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, color: COLORS.foreground }}>
          Community partners
        </Text>
      </View>

      <View style={{ borderTopWidth: 1, borderTopColor: COLORS.foreground, paddingTop: 16 }}>
        <View style={{ overflow: 'hidden', borderRadius: 16, backgroundColor: COLORS.muted }}>
          <View
            style={{
              height: 189,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: withAlpha(COLORS.primary, 0.1),
            }}
          >
            <MaterialCommunityIcons name={partner.icon} size={72} color={COLORS.foreground} />
            <Text style={{ marginTop: 8, fontSize: 18, fontWeight: 'bold', color: COLORS.foreground }}>
              {partner.name}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: COLORS.foreground }}>{partner.address}</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                style={{
                  marginTop: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  alignSelf: 'flex-start',
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: COLORS.foreground,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <MaterialCommunityIcons name="map-marker-outline" size={12} color={COLORS.foreground} />
                <Text style={{ marginLeft: 4, fontSize: 9, fontWeight: '600', color: COLORS.foreground }}>
                  Directions
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <IconPill icon="phone" />
              <IconPill icon="web" />
              <IconPill icon="message-text-outline" />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

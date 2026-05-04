import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { MOCK_COMMUNITY_PARTNER } from '@/src/data/mock-home';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export function CommunityPartners() {
  const { colors } = useMasjidConfig();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ',')})`;
  const partner = MOCK_COMMUNITY_PARTNER;

  return (
    <View>
      <View className="pb-3">
        <Text className="text-[13px] font-semibold uppercase tracking-[1px] text-foreground">
          Community partners
        </Text>
      </View>

      <View className="border-t border-foreground pt-4">
        <View className="overflow-hidden rounded-2xl bg-muted">
          <View className="h-[189px] items-center justify-center bg-primary/10">
            <MaterialCommunityIcons
              name={partner.icon as IconName}
              size={72}
              color={fgRgb}
            />
            <Text
              className="mt-2 text-[18px] font-bold text-foreground"
              style={{ fontFamily: 'Georgia' }}
            >
              {partner.name}
            </Text>
          </View>

          <View className="flex-row items-center justify-between px-4 py-4">
            <View className="flex-1">
              <Text className="text-[10px] text-foreground">{partner.address}</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                className="mt-2 flex-row items-center self-start rounded-full border border-foreground px-2.5 py-1"
              >
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={12}
                  color={fgRgb}
                />
                <Text className="ml-1 text-[9px] font-semibold text-foreground">
                  Directions
                </Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-2">
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

function IconPill({ icon }: { icon: string }) {
  const { colors } = useMasjidConfig();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ',')})`;
  return (
    <View className="h-[26px] w-[26px] items-center justify-center rounded-full border border-foreground/20">
      <MaterialCommunityIcons name={icon as IconName} size={14} color={fgRgb} />
    </View>
  );
}

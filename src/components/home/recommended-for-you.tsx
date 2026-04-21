import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { MOCK_RECOMMENDED } from '@/src/data/mock-home';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export function RecommendedForYou() {
  const { colors } = useMasjidConfig();
  const primary = colors.primary.replace(/ /g, ',');
  const fg = colors.primaryForeground.replace(/ /g, ',');

  return (
    <View>
      <View className="flex-row items-center justify-between pb-3">
        <Text className="text-[13px] font-semibold uppercase tracking-[1px] text-foreground">
          Recommended for you
        </Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text className="text-[10px] text-foreground/60">SEE ALL →</Text>
        </TouchableOpacity>
      </View>
      <View className="border-t border-foreground pt-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
        >
          {MOCK_RECOMMENDED.map((item) => (
            <TouchableOpacity key={item.id} activeOpacity={0.85}>
              <View
                className="mb-2 h-[196px] w-[220px] items-center justify-center overflow-hidden rounded-2xl"
                style={{ backgroundColor: `rgb(${primary})` }}
              >
                <MaterialCommunityIcons
                  name={item.icon as IconName}
                  size={64}
                  color={`rgba(${fg},0.85)`}
                />
              </View>
              <Text className="w-[220px] text-[13px] font-semibold text-foreground">
                {item.title}
              </Text>
              <Text className="w-[220px] text-[11px] text-foreground/60">
                {item.category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

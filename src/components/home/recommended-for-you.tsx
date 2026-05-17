import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useRecommendation } from '@/src/hooks/use-Recommendation';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const ICON_BY_TYPE: Record<string, IconName> = {
  class: 'school-outline',
  event: 'calendar-star',
  lecture: 'microphone-outline',
};

export function RecommendedForYou() {
  const { colors } = useMasjidConfig();
  const { recommendations, status, error } = useRecommendation();
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
        {status === 'loading' && (
          <Text className="text-[12px] text-foreground/60">Loading…</Text>
        )}
        {status === 'error' && (
          <Text className="text-[12px] text-foreground/60">Couldn’t load: {error}</Text>
        )}
        {status === 'success' && recommendations.length === 0 && (
          <Text className="text-[12px] text-foreground/60">No recommendations yet.</Text>
        )}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
        >
          {recommendations.map((item) => (
            <TouchableOpacity
              key={item.content_id}
              activeOpacity={0.85}
              onPress={() => router.push(`/content/${item.content_id}`)}
            >
              <View
                className="mb-2 h-[196px] w-[220px] items-center justify-center overflow-hidden rounded-2xl"
                style={{ backgroundColor: `rgb(${primary})` }}
              >
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                ) : (
                  <MaterialCommunityIcons
                    name={ICON_BY_TYPE[item.type ?? ''] ?? 'star-outline'}
                    size={64}
                    color={`rgba(${fg},0.85)`}
                  />
                )}
              </View>
              <Text className="w-[220px] text-[13px] font-semibold text-foreground" numberOfLines={1}>
                {item.name ?? 'Untitled'}
              </Text>
              <Text className="w-[220px] text-[11px] text-foreground/60" numberOfLines={1}>
                {item.type ?? ''}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

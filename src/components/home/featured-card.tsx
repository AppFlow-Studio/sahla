import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';

import { useFeaturedContent } from '@/src/hooks/use-featured-content';

export function FeaturedCard() {
  const { featured } = useFeaturedContent();

  if (!featured) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(`/content/${featured.id}`)}
      className="flex-row overflow-hidden rounded-2xl bg-primary"
      style={{ minHeight: 110 }}
    >
      <View className="flex-1 px-5 pb-4 pt-4">
        <Text className="text-[10px] text-accent">{featured.badge}</Text>

        <View className="mt-3">
          <Text
            className="text-[17px] font-bold text-primary-foreground"
            style={{ fontFamily: 'Georgia' }}
          >
            {featured.title}
          </Text>
          <Text className="mt-1 text-[11px] text-primary-foreground/55">
            {featured.subtitle}
          </Text>
        </View>
      </View>

      {featured.image && (
        <Image
          source={{ uri: featured.image }}
          style={{ width: 110, height: '100%' }}
          contentFit="cover"
        />
      )}
    </TouchableOpacity>
  );
}

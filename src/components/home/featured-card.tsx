import { View, Text } from 'react-native';

import { useFeaturedContent } from '@/src/hooks/use-featured-content';

export function FeaturedCard() {
  const { featured } = useFeaturedContent();

  if (!featured) return null;

  return (
    <View
      className="overflow-hidden rounded-2xl bg-primary px-5 pb-4 pt-4"
      style={{ minHeight: 110 }}
    >
      <View className="self-start rounded-full border border-accent/40 px-2.5 py-0.5">
        <Text className="text-[10px] text-accent">{featured.badge}</Text>
      </View>

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
  );
}

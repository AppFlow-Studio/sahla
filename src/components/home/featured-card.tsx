import { View, Text } from 'react-native';

import { MOCK_FEATURED } from '@/src/data/mock-home';

export function FeaturedCard() {
  return (
    <View
      className="overflow-hidden rounded-2xl bg-primary px-5 pb-4 pt-4"
      style={{ minHeight: 110 }}
    >
      <View className="self-start rounded-full border border-accent/40 px-2.5 py-0.5">
        <Text className="text-[10px] text-accent">{MOCK_FEATURED.badge}</Text>
      </View>

      <View className="mt-3">
        <Text
          className="text-[17px] font-bold text-primary-foreground"
          style={{ fontFamily: 'Georgia' }}
        >
          {MOCK_FEATURED.title}
        </Text>
        <Text className="mt-1 text-[11px] text-primary-foreground/55">
          {MOCK_FEATURED.subtitle}
        </Text>
      </View>
    </View>
  );
}

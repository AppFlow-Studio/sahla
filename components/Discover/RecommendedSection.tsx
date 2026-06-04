import { Image } from "expo-image";
import type { ImageSourcePropType } from "react-native";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";

import { useMasjidConfig } from "@/src/hooks/use-masjid-config";
import SectionTitle from "./SectionTitle";

export type RecommendedItem = {
  id: string;
  title: string;
  category: string;
  image?: ImageSourcePropType;
};

type Props = {
  items: RecommendedItem[];
  onPressItem?: (item: RecommendedItem) => void;
  onPressSeeAll?: () => void;
};

const platformUiFont = Platform.select({
  ios: "SF Pro Text",
  android: "Roboto",
  default: "system-ui",
});

function RecommendedCard({
  item,
  onPress,
}: {
  item: RecommendedItem;
  onPress?: () => void;
}) {
  const { colors } = useMasjidConfig();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ",")})`;
  const mutedFgRgb = `rgb(${colors.mutedForeground.replace(/ /g, ",")})`;
  const mutedRgb = `rgb(${colors.muted.replace(/ /g, ",")})`;

  return (
    <Pressable onPress={onPress} className="w-[220px]">
      <View
        className="h-[196px] w-full overflow-hidden rounded-[14px]"
        style={{ backgroundColor: mutedRgb }}
      >
        {item.image ? (
          <Image
            source={item.image}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : null}
      </View>
      <Text
        numberOfLines={1}
        style={{
          marginTop: 10,
          fontFamily: platformUiFont,
          fontSize: 13,
          fontWeight: "600",
          color: fgRgb,
        }}
      >
        {item.title}
      </Text>
      <Text
        numberOfLines={1}
        style={{
          fontFamily: platformUiFont,
          fontSize: 13,
          fontWeight: "400",
          color: mutedFgRgb,
        }}
      >
        {item.category}
      </Text>
    </Pressable>
  );
}

export default function RecommendedSection({
  items,
  onPressItem,
  onPressSeeAll,
}: Props) {
  return (
    <View>
      <SectionTitle
        title="Recommended for you"
        actionLabel="See all"
        onPressAction={onPressSeeAll}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 16, gap: 14 }}
      >
        {items.map((item) => (
          <RecommendedCard
            key={item.id}
            item={item}
            onPress={() => onPressItem?.(item)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

import { Image } from "expo-image";
import type { ImageSourcePropType } from "react-native";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";

import SectionTitle from "./SectionTitle";

const BUSH = "#0A261E";

export type ProgramItem = {
  id: string;
  title: string;
  image?: ImageSourcePropType;
};

type Props = {
  items: ProgramItem[];
  onPressItem?: (item: ProgramItem) => void;
  onPressSeeAll?: () => void;
};

const platformUiFont = Platform.select({
  ios: "SF Pro Text",
  android: "Roboto",
  default: "system-ui",
});

function ProgramCard({
  item,
  onPress,
}: {
  item: ProgramItem;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="w-[149px]">
      <View
        className="h-[217px] w-full overflow-hidden rounded-[16px] border"
        style={{
          backgroundColor: "#FAF9F4",
          borderColor: "rgba(10,38,30,0.1)",
        }}
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
        style={{
          marginTop: 10,
          fontFamily: platformUiFont,
          fontSize: 13,
          fontWeight: "500",
          color: BUSH,
        }}
      >
        {item.title}
      </Text>
    </Pressable>
  );
}

export default function ProgramsSection({
  items,
  onPressItem,
  onPressSeeAll,
}: Props) {
  return (
    <View>
      <SectionTitle
        title="Programs"
        actionLabel="See all"
        onPressAction={onPressSeeAll}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 16, gap: 14 }}
      >
        {items.map((item) => (
          <ProgramCard
            key={item.id}
            item={item}
            onPress={() => onPressItem?.(item)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

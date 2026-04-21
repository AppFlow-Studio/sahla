import { Image } from "expo-image";
import type { ImageSourcePropType } from "react-native";
import { Platform, Pressable, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";

const ROW_FOREGROUND = "#0A261E";
/** Chevron only — #0A261E @ 40% */
const CHEVRON_MUTED = "rgba(10, 38, 30, 0.4)";

type Props = {
  title: string;
  icon: ImageSourcePropType;
  onPress: () => void;
};

export default function RowItem({ title, icon, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between px-4 py-3"
    >
      <View className="flex-row items-center gap-2">
        <Image source={icon} style={{ width: 16, height: 16 }} contentFit="contain" />
        <Text
          style={{
            fontFamily: Platform.select({ android: "Roboto", default: undefined }),
            fontWeight: "500",
            fontSize: 11,
            lineHeight: 18,
            color: ROW_FOREGROUND,
            letterSpacing: 0,
          }}
        >
          {title}
        </Text>
      </View>
      <IconSymbol name="chevron.right" size={16} color={CHEVRON_MUTED} />
    </Pressable>
  );
}

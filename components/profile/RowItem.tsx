import { Image } from "expo-image";
import type { ImageSourcePropType } from "react-native";
import { Platform, Pressable, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMasjidConfig } from "@/src/hooks/use-masjid-config";

type Props = {
  title: string;
  icon: ImageSourcePropType;
  onPress: () => void;
};

export default function RowItem({ title, icon, onPress }: Props) {
  const { colors } = useMasjidConfig();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ",")})`;
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between px-4 py-3"
    >
      <View className="flex-row items-center gap-2">
        {/* Tint the (monochrome) icon glyph so it follows the masjid theme. */}
        <Image
          source={icon}
          style={{ width: 16, height: 16 }}
          contentFit="contain"
          tintColor={fgRgb}
        />
        <Text
          className="text-foreground"
          style={{
            fontFamily: Platform.select({ android: "Roboto", default: undefined }),
            fontWeight: "500",
            fontSize: 11,
            lineHeight: 18,
            letterSpacing: 0,
          }}
        >
          {title}
        </Text>
      </View>
      <IconSymbol name="chevron.right" size={8} className="text-foreground/40" />
    </Pressable>
  );
}

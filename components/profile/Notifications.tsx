import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform, Pressable, Text, View } from "react-native";

const BRAND_GOLD = "#B8922A";

const platformUiFont = Platform.select({
  ios: "SF Pro Text",
  android: "Roboto",
  default: "system-ui",
});

type Props = {
  onEnablePress: () => void;
};

export default function Notifications({ onEnablePress }: Props) {
  return (
    <View className="mb-1 min-h-[49px] w-full flex-row items-center justify-between rounded-full border-0.5 border-[#B8922A] bg-[#B8922A33] px-5 py-4">
      <View className="min-w-0 flex-1 flex-row items-center gap-2 pr-2">
        <IconSymbol name="bell.fill" size={14} color={BRAND_GOLD} />
        <Text
          numberOfLines={1}
          style={{
            fontFamily: platformUiFont,
            fontWeight: "500",
            fontSize: 11,
            lineHeight: 15,
            color: BRAND_GOLD,
          }}
        >
          Push Notifications are off
        </Text>
      </View>
      <Pressable
        onPress={onEnablePress}
        accessibilityRole="button"
        accessibilityLabel="Enable push notifications"
        className="shrink-0 flex-row items-center gap-1.5"
        hitSlop={8}
      >
        <Text
          style={{
            fontFamily: platformUiFont,
            fontWeight: "400",
            fontSize: 12,
            lineHeight: 15,
            color: BRAND_GOLD,
          }}
        >
          Enable
        </Text>
        <IconSymbol name="chevron.right" size={10} color={BRAND_GOLD} />
      </Pressable>
    </View>
  );
}

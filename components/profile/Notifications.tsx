import { Platform, Pressable, Text, View } from "react-native";
import { Icon } from "@/src/components/ui/icon";
import { useMasjidConfig } from "@/src/hooks/use-masjid-config";

const platformUiFont = Platform.select({
  ios: "SF Pro Text",
  android: "Roboto",
  default: "system-ui",
});

type Props = {
  onEnablePress: () => void;
};

export default function Notifications({ onEnablePress }: Props) {
  const { colors } = useMasjidConfig();
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;

  return (
    <View
      className="mb-1 w-full flex-row items-center justify-between rounded-[14px] bg-accent/20 px-5"
      style={{
        minHeight: 49,
        paddingVertical: 14,
        borderWidth: 0.5,
        borderColor: `rgba(${colors.accent.replace(/ /g, ',')}, 0.2)`,
        borderStyle: 'dashed',
      }}
    >
      <View className="min-w-0 flex-1 flex-row items-center gap-2 pr-2">
        <Icon name="bell" size={14} color={accentRgb} fill={accentRgb} />
        <Text
          numberOfLines={1}
          style={{
            fontFamily: platformUiFont,
            fontWeight: "500",
            fontSize: 11,
            lineHeight: 15,
            color: accentRgb,
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
            fontSize: 11,
            lineHeight: 15,
            color: accentRgb,
          }}
        >
          Enable
        </Text>
        <Icon name="chevron-right" size={14} color={accentRgb} />
      </Pressable>
    </View>
  );
}

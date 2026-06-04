import { Platform, Pressable, Text, View } from "react-native";

import { useMasjidConfig } from "@/src/hooks/use-masjid-config";

type Props = {
  title: string;
  actionLabel?: string;
  actionLeading?: React.ReactNode;
  onPressAction?: () => void;
};

const platformUiFont = Platform.select({
  ios: "SF Pro Text",
  android: "Roboto",
  default: "system-ui",
});

export default function SectionTitle({
  title,
  actionLabel,
  actionLeading,
  onPressAction,
}: Props) {
  const { colors } = useMasjidConfig();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ",")})`;
  const mutedFgRgb = `rgb(${colors.mutedForeground.replace(/ /g, ",")})`;

  return (
    <View className="px-5 pt-3">
      <View className="flex-row items-center justify-between pb-3">
        <Text
          style={{
            fontFamily: platformUiFont,
            fontSize: 13,
            fontWeight: "600",
            letterSpacing: 0.5,
            textTransform: "uppercase",
            color: fgRgb,
          }}
        >
          {title}
        </Text>
        {actionLabel ? (
          <Pressable
            onPress={onPressAction}
            hitSlop={8}
            className="flex-row items-center gap-1"
          >
            {actionLeading}
            <Text
              style={{
                fontFamily: platformUiFont,
                fontSize: 10,
                color: mutedFgRgb,
                textTransform: "uppercase",
              }}
            >
              {actionLeading ? actionLabel : `${actionLabel} \u2192`}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <View style={{ height: 1, backgroundColor: fgRgb }} />
    </View>
  );
}

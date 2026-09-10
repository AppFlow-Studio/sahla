import { Pressable, Text, View } from "react-native";

import { useFontFamily } from "@/src/hooks/use-font-family";
import { useIsRTL } from "@/src/hooks/use-is-rtl";
import { useMasjidConfig } from "@/src/hooks/use-masjid-config";

type Props = {
  title: string;
  actionLabel?: string;
  actionLeading?: React.ReactNode;
  onPressAction?: () => void;
};

export default function SectionTitle({
  title,
  actionLabel,
  actionLeading,
  onPressAction,
}: Props) {
  const isRTL = useIsRTL();
  const fonts = useFontFamily();
  const { colors } = useMasjidConfig();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ",")})`;
  const mutedFgRgb = `rgb(${colors.mutedForeground.replace(/ /g, ",")})`;

  return (
    <View className="px-5 pt-3">
      <View
        className="flex-row items-center justify-between"
        style={{ marginBottom: 5 }}
      >
        <Text
          style={{
            fontFamily: fonts.bodySemibold,
            fontSize: 15,
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
                fontFamily: fonts.body,
                fontSize: 10,
                color: mutedFgRgb,
                textTransform: "uppercase",
              }}
            >
              {actionLeading
                ? actionLabel
                : `${actionLabel} ${isRTL ? "\u2190" : "\u2192"}`}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <View style={{ height: 1, backgroundColor: fgRgb }} />
    </View>
  );
}

import { Pressable, Text, View } from "react-native";

import { Icon, type IconName } from "@/src/components/ui/icon";
import { useIsRTL } from "@/src/hooks/use-is-rtl";
import { useMasjidConfig } from "@/src/hooks/use-masjid-config";
import { useFontFamily } from '@/src/hooks/use-font-family';

type Props = {
  title: string;
  icon: IconName;
  onPress: () => void;
};

export default function RowItem({ title, icon, onPress }: Props) {
  const { colors } = useMasjidConfig();
  const fonts = useFontFamily();
  const isRTL = useIsRTL();
  const fg = colors.foreground.replace(/ /g, ",");
  const fgRgb = `rgb(${fg})`;
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between px-4 py-3"
    >
      <View className="flex-row items-center gap-2">
        {/* Icon stroke follows the masjid theme foreground. */}
        <Icon name={icon} size={16} color={fgRgb} />
        <Text
          className="text-foreground"
          style={{
            fontFamily: fonts.bodyMedium,
            fontWeight: "500",
            fontSize: 13,
            lineHeight: 18,
            letterSpacing: 0,
          }}
        >
          {title}
        </Text>
      </View>
      <Icon name={isRTL ? 'chevron-left' : 'chevron-right'} size={14} color={`rgba(${fg},0.4)`} />
    </Pressable>
  );
}

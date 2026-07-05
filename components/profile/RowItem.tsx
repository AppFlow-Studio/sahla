import { Pressable, Text, View } from "react-native";

import { Icon, type IconName } from "@/src/components/ui/icon";
import { NudgeDot } from "@/src/components/ui/nudge-dot";
import { useIsRTL } from "@/src/hooks/use-is-rtl";
import { useMasjidConfig } from "@/src/hooks/use-masjid-config";
import { useFontFamily } from '@/src/hooks/use-font-family';

type Props = {
  title: string;
  icon?: IconName;
  /** Custom SVG / component to render in place of a Lucide icon. Takes
   *  precedence over `icon` when provided. Useful for one-off Figma glyphs
   *  like the personalization sunburst emblem. */
  renderIcon?: () => React.ReactNode;
  onPress: () => void;
  /** Show an attention dot beside the title (e.g. an unfinished setup step). */
  showDot?: boolean;
};

export default function RowItem({ title, icon, renderIcon, onPress }: Props) {
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
        {renderIcon ? renderIcon() : icon ? (
          <Icon name={icon} size={16} color={fgRgb} />
        ) : null}
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
        {showDot && <NudgeDot size={7} style={{ marginStart: 2 }} />}
      </View>
      <Icon name={isRTL ? 'chevron-left' : 'chevron-right'} size={14} color={`rgba(${fg},0.4)`} />
    </Pressable>
  );
}

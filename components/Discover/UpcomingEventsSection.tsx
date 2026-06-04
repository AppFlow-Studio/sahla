import { Image } from "expo-image";
import type { ImageSourcePropType } from "react-native";
import { Platform, Pressable, Text, View } from "react-native";

import { useMasjidConfig } from "@/src/hooks/use-masjid-config";
import { IconSymbol } from "@/components/ui/icon-symbol";
import SectionTitle from "./SectionTitle";

export type EventItem = {
  id: string;
  title: string;
  dateLabel: string;
  category?: string | null;
  thumbnail?: ImageSourcePropType;
};

type Props = {
  items: EventItem[];
  onPressItem?: (item: EventItem) => void;
  onPressViewCalendar?: () => void;
};

const platformUiFont = Platform.select({
  ios: "SF Pro Text",
  android: "Roboto",
  default: "system-ui",
});

function EventRow({
  item,
  onPress,
}: {
  item: EventItem;
  onPress?: () => void;
}) {
  const { colors } = useMasjidConfig();
  const fg = colors.foreground.replace(/ /g, ",");
  const fgRgb = `rgb(${fg})`;
  const mutedFgRgb = `rgb(${colors.mutedForeground.replace(/ /g, ",")})`;
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ",")})`;
  const mutedRgb = `rgb(${colors.muted.replace(/ /g, ",")})`;
  const chevronColor = `rgba(${fg}, 0.4)`;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-6 py-3"
    >
      <View
        className="mr-4 h-[50px] w-[50px] overflow-hidden rounded-[10px]"
        style={{ backgroundColor: mutedRgb }}
      >
        {item.thumbnail ? (
          <Image
            source={item.thumbnail}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : null}
      </View>
      <View className="flex-1">
        <Text
          numberOfLines={1}
          style={{
            fontFamily: platformUiFont,
            fontSize: 12,
            fontWeight: "600",
            color: fgRgb,
          }}
        >
          {item.title}
        </Text>
        {item.dateLabel ? (
          <Text
            numberOfLines={1}
            style={{
              marginTop: 2,
              fontFamily: platformUiFont,
              fontSize: 11,
              color: mutedFgRgb,
            }}
          >
            {item.dateLabel}
          </Text>
        ) : null}
        {item.category ? (
          <Text
            numberOfLines={1}
            style={{
              marginTop: 2,
              fontFamily: platformUiFont,
              fontSize: 11,
              fontWeight: "500",
              color: accentRgb,
            }}
          >
            {item.category}
          </Text>
        ) : null}
      </View>
      <IconSymbol name="chevron.right" size={14} color={chevronColor} />
    </Pressable>
  );
}

export default function UpcomingEventsSection({
  items,
  onPressItem,
  onPressViewCalendar,
}: Props) {
  const { colors } = useMasjidConfig();
  const fg = colors.foreground.replace(/ /g, ",");
  const rowBorder = `rgba(${fg}, 0.1)`;

  return (
    <View>
      <SectionTitle
        title="Upcoming events"
        actionLabel="View calendar"
        actionLeading={
          <Image
            source={require("@/assets/images/discover_calendar_icon_next_to_search_bar.png")}
            style={{ width: 12, height: 12, opacity: 0.6 }}
            contentFit="contain"
          />
        }
        onPressAction={onPressViewCalendar}
      />
      <View className="mt-2">
        {items.map((item, i) => (
          <View key={item.id}>
            <EventRow item={item} onPress={() => onPressItem?.(item)} />
            {i < items.length - 1 ? (
              <View
                style={{
                  height: 1,
                  backgroundColor: rowBorder,
                  marginHorizontal: 20,
                }}
              />
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

import { Image } from "expo-image";
import type { ImageSourcePropType } from "react-native";
import { Platform, Pressable, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import SectionTitle from "./SectionTitle";

const BUSH = "#0A261E";
const MUTED = "rgba(10,38,30,0.6)";
const GOLD = "#B8922A";
const ROW_BORDER = "#0A261E1A";
const CHEVRON_MUTED = "rgba(10,38,30,0.4)";

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
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-6 py-3"
    >
      <View
        className="mr-4 h-[50px] w-[50px] overflow-hidden rounded-[10px]"
        style={{ backgroundColor: "#E8E3D6" }}
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
            color: BUSH,
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
              color: MUTED,
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
              color: GOLD,
            }}
          >
            {item.category}
          </Text>
        ) : null}
      </View>
      <IconSymbol name="chevron.right" size={14} color={CHEVRON_MUTED} />
    </Pressable>
  );
}

export default function UpcomingEventsSection({
  items,
  onPressItem,
  onPressViewCalendar,
}: Props) {
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
                  backgroundColor: ROW_BORDER,
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

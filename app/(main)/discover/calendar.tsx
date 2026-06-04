import { Image } from "expo-image";
import { router } from "expo-router";
import { useMemo } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import EventsCalendar, {
  type EventCalendarItem,
} from "@/components/Discover/EventsCalendar";
import { useContentItems } from "@/src/hooks/use-content-items";
import { useMasjidConfig } from "@/src/hooks/use-masjid-config";

const platformUiFont = Platform.select({
  ios: "SF Pro Text",
  android: "Roboto",
  default: "system-ui",
});

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/(\s+)/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

function deriveCategory(item: {
  is_kids: boolean | null;
  is_fourteen_plus: boolean | null;
  is_young_professionals: boolean;
  is_pace: boolean;
  is_quran: boolean;
}): string | null {
  const labels: string[] = [];
  if (item.is_kids) labels.push("Kids");
  if (item.is_fourteen_plus) labels.push("Youth");
  if (item.is_young_professionals) labels.push("Young Professionals");
  if (item.is_pace) labels.push("PACE");
  if (item.is_quran) labels.push("Quran");
  if (labels.length === 0) return "For All";
  return labels.slice(0, 2).join(" & ");
}

export default function DiscoverCalendarScreen() {
  const { colors } = useMasjidConfig();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ",")})`;
  const bgRgb = `rgb(${colors.background.replace(/ /g, ",")})`;
  const mutedFgRgb = `rgb(${colors.mutedForeground.replace(/ /g, ",")})`;
  const insets = useSafeAreaInsets();

  const { items } = useContentItems();

  const calendarItems: EventCalendarItem[] = useMemo(
    () =>
      items
        .filter((r) => r.type === "event")
        .map((r) => ({
          id: r.content_id,
          title: toTitleCase(r.name ?? "Untitled"),
          image: r.image ? { uri: r.image } : undefined,
          startDate: r.start_date,
          startTime: r.start_time,
          category: deriveCategory(r),
        })),
    [items],
  );

  const openContent = (id: string) => router.push(`/content/${id}`);

  return (
    <View className="flex-1" style={{ backgroundColor: bgRgb }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 32 }}
      >
        <View className="px-6 pt-6">
          <View
            className="items-center justify-center"
            style={{ position: "relative" }}
          >
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                justifyContent: "center",
              }}
            >
              <Image
                source={require("@/assets/images/left_arrow.png")}
                style={{ width: 16, height: 16 }}
                contentFit="contain"
              />
            </Pressable>
            <Text
              style={{
                fontFamily: "PlayfairDisplay_500Medium",
                fontSize: 30,
                lineHeight: 36,
                color: fgRgb,
                textAlign: "center",
              }}
            >
              Calendar
            </Text>
            <Text
              style={{
                fontFamily: platformUiFont,
                fontSize: 12,
                color: mutedFgRgb,
                marginTop: 4,
                textAlign: "center",
              }}
            >
              Today and upcoming events
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          <EventsCalendar items={calendarItems} onPressItem={openContent} />
        </View>
      </ScrollView>
    </View>
  );
}

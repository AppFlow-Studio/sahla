import { Image } from "expo-image";
import { router } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import EventsCalendar, {
  type EventCalendarItem,
} from "@/components/Discover/EventsCalendar";
import { useContentItems } from "@/src/hooks/use-content-items";
import { useFontFamily } from "@/src/hooks/use-font-family";
import { useIsRTL } from "@/src/hooks/use-is-rtl";
import { useMasjidConfig } from "@/src/hooks/use-masjid-config";

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/(\s+)/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

function deriveCategory(
  item: {
    is_kids: boolean | null;
    is_fourteen_plus: boolean | null;
    is_young_professionals: boolean;
    is_pace: boolean;
    is_quran: boolean;
  },
  t: (key: string) => string,
): string | null {
  const labels: string[] = [];
  if (item.is_kids) labels.push(t("discover.categoryKids"));
  if (item.is_fourteen_plus) labels.push(t("discover.categoryYouth"));
  if (item.is_young_professionals)
    labels.push(t("discover.categoryYoungProfessionals"));
  if (item.is_pace) labels.push(t("discover.categoryPace"));
  if (item.is_quran) labels.push(t("discover.categoryQuran"));
  if (labels.length === 0) return t("discover.categoryForAll");
  return labels.slice(0, 2).join(t("discover.categoryJoiner"));
}

export default function DiscoverCalendarScreen() {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const { colors } = useMasjidConfig();
  const fonts = useFontFamily();
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
          title: toTitleCase(r.name ?? t("discover.untitled")),
          image: r.image ? { uri: r.image } : undefined,
          startDate: r.start_date,
          startTime: r.start_time,
          category: deriveCategory(r, t),
        })),
    [items, t],
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
              accessibilityLabel={t("common.back")}
              style={{
                position: "absolute",
                [isRTL ? "right" : "left"]: 0,
                top: 0,
                bottom: 0,
                justifyContent: "center",
              }}
            >
              <Image
                source={require("@/assets/images/left_arrow.png")}
                style={{
                  width: 16,
                  height: 16,
                  transform: [{ scaleX: isRTL ? -1 : 1 }],
                }}
                contentFit="contain"
              />
            </Pressable>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 30,
                lineHeight: 36,
                color: fgRgb,
                textAlign: "center",
              }}
            >
              {t("discover.calendarTitle")}
            </Text>
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: 12,
                color: mutedFgRgb,
                marginTop: 4,
                textAlign: "center",
              }}
            >
              {t("discover.calendarSubtitle")}
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

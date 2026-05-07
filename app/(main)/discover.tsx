import {
  PlayfairDisplay_500Medium,
  useFonts,
} from "@expo-google-fonts/playfair-display";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import DiscoverHeader, {
  type DiscoverTab,
} from "@/components/Discover/DiscoverHeader";
import ProgramsSection, {
  type ProgramItem,
} from "@/components/Discover/ProgramsSection";
import RecommendedSection, {
  type RecommendedItem,
} from "@/components/Discover/RecommendedSection";
import UpcomingEventsSection, {
  type EventItem,
} from "@/components/Discover/UpcomingEventsSection";
import DonateCard from "@/components/profile/DonateCard";
import { useContentItems } from "@/src/hooks/use-content-items";

const PROGRAMS: ProgramItem[] = [
  {
    id: "p1",
    title: "Kids",
    image: require("@/assets/images/kids_discover_design.png"),
  },
  {
    id: "p2",
    title: "Youth",
    image: require("@/assets/images/youth_discover_design.png"),
  },
  {
    id: "p3",
    title: "Adults",
    image: require("@/assets/images/adult_discover_design.png"),
  },
];

function formatTime(time: string | null): string {
  if (!time) return "";
  const m = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!m) return time;
  const hour = Number(m[1]);
  const minute = m[2];
  const period = hour >= 12 ? "pm" : "am";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return minute === "00" ? `${h12}${period}` : `${h12}:${minute}${period}`;
}

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatScheduleLabel(
  type: string | null,
  startDate: string | null,
  endDate: string | null,
  startTime: string | null,
  days: string[] | null,
): string {
  const time = formatTime(startTime);
  if (type === "program") {
    const day = days?.[0] ?? "";
    return [day, time].filter(Boolean).join(" • ");
  }
  if (!startDate) return time;
  const start = formatEventDate(startDate);
  const range =
    endDate && endDate !== startDate ? `${start} - ${formatEventDate(endDate)}` : start;
  return time ? `${range} • ${time}` : range;
}

export default function DiscoverScreen() {
  const [activeTab, setActiveTab] = useState<DiscoverTab>("All");
  const [fontsLoaded] = useFonts({ PlayfairDisplay_500Medium });
  const { items, status, error } = useContentItems();

  const filtered = useMemo(() => {
    if (activeTab === "All") return items;
    if (activeTab === "Events") return items.filter((i) => i.type === "event");
    if (activeTab === "Programs") return items.filter((i) => i.type === "program");
    // "For You" — show a curated subset (first 4)
    return items.filter((_, idx) => idx % 2 === 0);
  }, [items, activeTab]);

  const recommendedItems: RecommendedItem[] = useMemo(
    () =>
      filtered.slice(0, 8).map((r) => ({
        id: r.content_id,
        title: r.name ?? "Untitled",
        category: r.type ?? "",
        image: r.image ? { uri: r.image } : undefined,
      })),
    [filtered],
  );

  const upcomingItems: EventItem[] = useMemo(
    () =>
      filtered
        .filter((r) => activeTab === "Programs" ? r.type === "program" : true)
        .slice(0, 3)
        .map((r) => ({
          id: r.content_id,
          title: r.name ?? "Untitled",
          dateLabel: formatScheduleLabel(r.type, r.start_date, r.end_date, r.start_time, r.days),
          description: r.description ?? "",
          thumbnail: r.image ? { uri: r.image } : undefined,
        })),
    [filtered, activeTab],
  );

  const openContent = useCallback((id: string) => {
    router.push(`/content/${id}`);
  }, []);

  if (!fontsLoaded) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: "#FFFBF2" }}
      >
        <ActivityIndicator color="#0A261E" />
      </View>
    );
  }

  const isLoading = status === "loading" && items.length === 0;

  return (
    <View className="flex-1" style={{ backgroundColor: "#0A261E" }}>
      <SafeAreaView edges={["top"]} />
      <View className="flex-1" style={{ backgroundColor: "#FFFBF2" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <DiscoverHeader active={activeTab} onSelect={setActiveTab} />

        {status === "error" ? (
          <View className="mx-6 mt-4 rounded-lg bg-[#FDECEC] p-3">
            <Text className="text-xs text-[#7A1F1F]">
              Couldn&apos;t load content: {error}
            </Text>
          </View>
        ) : null}

        <View className="mt-4">
          {isLoading ? (
            <View className="px-6 py-8">
              <ActivityIndicator color="#0A261E" />
            </View>
          ) : (
            <RecommendedSection
              items={recommendedItems}
              onPressItem={(item) => openContent(item.id)}
            />
          )}
        </View>

        {activeTab !== "Programs" && (
          <View className="mt-4">
            <UpcomingEventsSection
              items={upcomingItems}
              onPressItem={(item) => openContent(item.id)}
            />
          </View>
        )}

        {activeTab !== "Events" && (
          <View className="mt-4">
            <ProgramsSection items={PROGRAMS} />
          </View>
        )}

        <View className="mt-6 px-6">
          <DonateCard onPress={() => {}} />
        </View>
      </ScrollView>
      </View>
    </View>
  );
}

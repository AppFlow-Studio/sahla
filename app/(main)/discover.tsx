import {
  PlayfairDisplay_500Medium,
  useFonts,
} from "@expo-google-fonts/playfair-display";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AudienceBrowse, {
  type AudienceItem,
} from "@/components/Discover/AudienceBrowse";
import DiscoverHeader, {
  type DiscoverTab,
} from "@/components/Discover/DiscoverHeader";
import ForYouContent, {
  type ForYouRowItem,
} from "@/components/Discover/ForYouContent";
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
import { useRecommendation } from "@/src/hooks/use-Recommendation";
import { useDonation } from "@/src/providers/donation-provider";

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

function formatTime12(time: string | null): string {
  if (!time) return "";
  const m = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!m) return time;
  const hour = Number(m[1]);
  const minute = m[2];
  const period = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${minute} ${period}`;
}

function formatCardDate(
  type: string | null,
  startDate: string | null,
  startTime: string | null,
  days: string[] | null,
): string {
  const time = formatTime12(startTime);
  if (type === "program") {
    const day = days?.[0] ?? "";
    return [day, time].filter(Boolean).join(" • ");
  }
  if (!startDate) return time;
  const start = new Date(startDate).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });
  return time ? `${start} • ${time}` : start;
}

export default function DiscoverScreen() {
  const [activeTab, setActiveTab] = useState<DiscoverTab>("All");
  const [fontsLoaded] = useFonts({ PlayfairDisplay_500Medium });
  const { open: openDonate } = useDonation();
  const { items, status, error } = useContentItems();
  const { recommendations, status: recStatus, error: recError } = useRecommendation();

  const recommendedItems: RecommendedItem[] = useMemo(
    () =>
      recommendations.map((r) => ({
        id: r.content_id,
        title: r.name ?? "Untitled",
        category: r.type ?? "",
        image: r.image ? { uri: r.image } : undefined,
      })),
    [recommendations],
  );

  const upcomingItems: EventItem[] = useMemo(
    () =>
      items.slice(0, 3).map((r) => ({
        id: r.content_id,
        title: r.name ?? "Untitled",
        dateLabel: formatScheduleLabel(r.type, r.start_date, r.end_date, r.start_time, r.days),
        description: r.description ?? "",
        thumbnail: r.image ? { uri: r.image } : undefined,
      })),
    [items],
  );

  const itemsById = useMemo(() => {
    const map = new Map<string, (typeof items)[number]>();
    for (const item of items) map.set(item.content_id, item);
    return map;
  }, [items]);

  const formatType = (type: string | null): string | null => {
    if (!type) return null;
    return type
      .split(/[\s_-]+/)
      .map((s) => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : ""))
      .join(" ");
  };

  const deriveCategory = (
    item: (typeof items)[number] | undefined,
    type: string | null,
  ): string | null => {
    if (!item) return formatType(type);
    const labels: string[] = [];
    if (item.is_kids) labels.push("Kids");
    if (item.is_fourteen_plus) labels.push("Youth");
    if (item.is_young_professionals) labels.push("Young Professionals");
    if (item.is_pace) labels.push("PACE");
    if (item.is_quran) labels.push("Quran");
    if (labels.length === 0) return formatType(type);
    return labels.slice(0, 2).join(" & ");
  };

  const buildRow = useCallback(
    (r: (typeof recommendations)[number]): ForYouRowItem => {
      const matched = itemsById.get(r.content_id);
      return {
        id: r.content_id,
        title: r.name ?? "Untitled",
        speaker: matched?.speakers?.[0] ?? null,
        category: deriveCategory(matched, r.type),
        image: r.image ? { uri: r.image } : undefined,
      };
    },
    [itemsById],
  );

  const forYouEvents: ForYouRowItem[] = useMemo(
    () =>
      recommendations
        .filter((r) => r.type !== "program")
        .slice(0, 3)
        .map(buildRow),
    [recommendations, buildRow],
  );

  const forYouPrograms: ForYouRowItem[] = useMemo(
    () =>
      recommendations
        .filter((r) => r.type === "program")
        .slice(0, 3)
        .map(buildRow),
    [recommendations, buildRow],
  );

  const audienceItems = useCallback(
    (kind: "event" | "program"): AudienceItem[] =>
      items
        .filter((r) => r.type === kind)
        .map((r) => ({
          id: r.content_id,
          title: r.name ?? "Untitled",
          dateLabel: formatCardDate(r.type, r.start_date, r.start_time, r.days),
          image: r.image ? { uri: r.image } : undefined,
          isKids: r.is_kids === true,
          isYouth: r.is_fourteen_plus === true,
        })),
    [items],
  );

  const eventBrowseItems = useMemo(
    () => audienceItems("event"),
    [audienceItems],
  );
  const programBrowseItems = useMemo(
    () => audienceItems("program"),
    [audienceItems],
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

  const isLoading = recStatus === "loading" && recommendations.length === 0;

  return (
    <View className="flex-1" style={{ backgroundColor: "#0A261E" }}>
      <SafeAreaView edges={["top"]} />
      <View className="flex-1" style={{ backgroundColor: "#FFFBF2" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <DiscoverHeader
          title={
            activeTab === "For You"
              ? "For you"
              : activeTab === "Events"
                ? "Events"
                : activeTab === "Programs"
                  ? "Programs"
                  : "Discover"
          }
          active={activeTab}
          onSelect={setActiveTab}
        />

        {status === "error" ? (
          <View className="mx-6 mt-4 rounded-lg bg-[#FDECEC] p-3">
            <Text className="text-xs text-[#7A1F1F]">
              Couldn&apos;t load content: {error}
            </Text>
          </View>
        ) : null}

        {recStatus === "error" ? (
          <View className="mx-6 mt-4 rounded-lg bg-[#FDECEC] p-3">
            <Text className="text-xs text-[#7A1F1F]">
              Couldn&apos;t load recommendations: {recError}
            </Text>
          </View>
        ) : null}

        {activeTab === "For You" ? (
          isLoading ? (
            <View className="px-6 py-8">
              <ActivityIndicator color="#0A261E" />
            </View>
          ) : (
            <ForYouContent
              events={forYouEvents}
              programs={forYouPrograms}
              onPressItem={openContent}
              onPressEdit={() => router.push("/(personalization)/reasons")}
            />
          )
        ) : activeTab === "Events" ? (
          <AudienceBrowse
            items={eventBrowseItems}
            onPressItem={openContent}
            allTabFooter={<DonateCard onPress={openDonate} />}
          />
        ) : activeTab === "Programs" ? (
          <AudienceBrowse
            items={programBrowseItems}
            onPressItem={openContent}
            allTabFooter={<DonateCard onPress={openDonate} />}
          />
        ) : (
          <>
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

            <View className="mt-4">
              <UpcomingEventsSection
                items={upcomingItems}
                onPressItem={(item) => openContent(item.id)}
              />
            </View>

            <View className="mt-4">
              <ProgramsSection items={PROGRAMS} />
            </View>

            <View className="mt-6 px-6">
              <DonateCard onPress={openDonate} />
            </View>
          </>
        )}
      </ScrollView>
      </View>
    </View>
  );
}

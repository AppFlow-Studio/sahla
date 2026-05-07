import {
  PlayfairDisplay_500Medium,
  useFonts,
} from "@expo-google-fonts/playfair-display";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import Animated, {
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import AudienceBrowse, {
  type AudienceFilter,
  type AudienceItem,
} from "@/components/Discover/AudienceBrowse";
import DiscoverHeader, {
  type DiscoverTab,
} from "@/components/Discover/DiscoverHeader";
import EventsCalendar, {
  type EventCalendarItem,
} from "@/components/Discover/EventsCalendar";
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

const TAB_INDEX: Record<DiscoverTab, number> = {
  All: 0,
  "For You": 1,
  Events: 2,
  Programs: 3,
};

export default function DiscoverScreen() {
  const [activeTab, setActiveTabState] = useState<DiscoverTab>("All");
  const [direction, setDirection] = useState<"right" | "left">("right");
  const [nextTab, setNextTab] = useState<DiscoverTab | null>(null);
  const [programsInitialFilter, setProgramsInitialFilter] =
    useState<AudienceFilter>("All");
  const [hasMounted, setHasMounted] = useState(false);
  const [fontsLoaded] = useFonts({ PlayfairDisplay_500Medium });

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const switchTab = useCallback(
    (newTab: DiscoverTab) => {
      if (newTab === activeTab) return;
      const oldIdx = TAB_INDEX[activeTab];
      const newIdx = TAB_INDEX[newTab];
      setDirection(newIdx > oldIdx ? "right" : "left");
      setNextTab(newTab);
    },
    [activeTab],
  );

  useEffect(() => {
    if (nextTab && nextTab !== activeTab) {
      setActiveTabState(nextTab);
      setNextTab(null);
    }
  }, [nextTab, activeTab, direction]);

  const handleHeaderSelect = useCallback(
    (tab: DiscoverTab) => {
      if (tab === "Programs") setProgramsInitialFilter("All");
      switchTab(tab);
    },
    [switchTab],
  );

  const goToProgramsWithFilter = useCallback(
    (audience: AudienceFilter) => {
      setProgramsInitialFilter(audience);
      switchTab("Programs");
    },
    [switchTab],
  );
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

  const deriveCategory = (
    item: (typeof items)[number] | undefined,
  ): string | null => {
    if (!item) return null;
    const labels: string[] = [];
    if (item.is_kids) labels.push("Kids");
    if (item.is_fourteen_plus) labels.push("Youth");
    if (item.is_young_professionals) labels.push("Young Professionals");
    if (item.is_pace) labels.push("PACE");
    if (item.is_quran) labels.push("Quran");
    if (labels.length === 0) return "For All";
    return labels.slice(0, 2).join(" & ");
  };

  const buildRow = useCallback(
    (r: (typeof recommendations)[number]): ForYouRowItem => {
      const matched = itemsById.get(r.content_id);
      return {
        id: r.content_id,
        title: r.name ?? "Untitled",
        speaker: matched?.speakers?.[0] ?? null,
        category: deriveCategory(matched),
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
          category: deriveCategory(r),
          isWeekly: r.is_weekly_program === true,
        })),
    [items],
  );

  const programBrowseItems = useMemo(
    () => audienceItems("program"),
    [audienceItems],
  );

  const eventsCalendarItems: EventCalendarItem[] = useMemo(
    () =>
      items
        .filter((r) => r.type === "event")
        .map((r) => ({
          id: r.content_id,
          title: r.name ?? "Untitled",
          image: r.image ? { uri: r.image } : undefined,
          startDate: r.start_date,
          startTime: r.start_time,
          category: deriveCategory(r),
        })),
    [items],
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
          onSelect={handleHeaderSelect}
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

        <View style={{ overflow: "hidden" }}>
          <Animated.View
            key={activeTab}
            entering={
              hasMounted
                ? direction === "right"
                  ? SlideInRight.duration(220)
                  : SlideInLeft.duration(220)
                : undefined
            }
            exiting={
              direction === "right"
                ? SlideOutLeft.duration(220)
                : SlideOutRight.duration(220)
            }
          >
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
              <>
                <EventsCalendar
                  items={eventsCalendarItems}
                  onPressItem={openContent}
                />
                <View className="px-6" style={{ marginTop: 24 }}>
                  <DonateCard onPress={openDonate} />
                </View>
              </>
            ) : activeTab === "Programs" ? (
              <AudienceBrowse
                kind="programs"
                items={programBrowseItems}
                onPressItem={openContent}
                initialFilter={programsInitialFilter}
                onPressSeeAll={(audience) =>
                  setProgramsInitialFilter(audience)
                }
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
                    onPressViewCalendar={() => switchTab("Events")}
                  />
                </View>

                <View className="mt-4">
                  <ProgramsSection
                    items={PROGRAMS}
                    onPressItem={(item) =>
                      goToProgramsWithFilter(
                        item.title as AudienceFilter,
                      )
                    }
                    onPressSeeAll={() => goToProgramsWithFilter("All")}
                  />
                </View>

                <View className="mt-6 px-6">
                  <DonateCard onPress={openDonate} />
                </View>
              </>
            )}
          </Animated.View>
        </View>
      </ScrollView>
      </View>
    </View>
  );
}

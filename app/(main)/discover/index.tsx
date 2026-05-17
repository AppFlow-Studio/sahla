import {
  PlayfairDisplay_500Medium,
  useFonts,
} from "@expo-google-fonts/playfair-display";
import { router, useLocalSearchParams } from "expo-router";
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

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/(\s+)/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

function formatCardDate(
  startDate: string | null,
  startTime: string | null,
): string {
  const time = formatTime12(startTime);
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
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTabState] = useState<DiscoverTab>("All");
  const [direction, setDirection] = useState<"right" | "left">("right");
  const [nextTab, setNextTab] = useState<DiscoverTab | null>(null);
  const [programsInitialFilter, setProgramsInitialFilter] =
    useState<AudienceFilter>("All");
  const [hasMounted, setHasMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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

  useEffect(() => {
    const requested = params.tab;
    if (!requested) return;
    if (!(requested in TAB_INDEX)) return;
    const target = requested as DiscoverTab;
    if (target === activeTab) return;
    if (target === "Programs") setProgramsInitialFilter("All");
    switchTab(target);
  }, [params.tab, activeTab, switchTab]);

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

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredItems = useMemo(
    () =>
      normalizedQuery
        ? items.filter((i) =>
            (i.name ?? "").toLowerCase().includes(normalizedQuery),
          )
        : items,
    [items, normalizedQuery],
  );

  const filteredRecommendations = useMemo(
    () =>
      normalizedQuery
        ? recommendations.filter((r) =>
            (r.name ?? "").toLowerCase().includes(normalizedQuery),
          )
        : recommendations,
    [recommendations, normalizedQuery],
  );

  const recommendedItems: RecommendedItem[] = useMemo(
    () =>
      filteredRecommendations.map((r) => ({
        id: r.content_id,
        title: toTitleCase(r.name ?? "Untitled"),
        category: r.type ?? "",
        image: r.image ? { uri: r.image } : undefined,
      })),
    [filteredRecommendations],
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

  const upcomingItems: EventItem[] = useMemo(
    () =>
      filteredItems.slice(0, 3).map((r) => ({
        id: r.content_id,
        title: toTitleCase(r.name ?? "Untitled"),
        dateLabel: formatCardDate(r.start_date, r.start_time),
        category: deriveCategory(r),
        thumbnail: r.image ? { uri: r.image } : undefined,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredItems],
  );

  const buildRow = useCallback(
    (r: (typeof recommendations)[number]): ForYouRowItem => {
      const matched = itemsById.get(r.content_id);
      return {
        id: r.content_id,
        title: toTitleCase(r.name ?? "Untitled"),
        speaker: matched?.speakers?.[0] ?? null,
        category: deriveCategory(matched),
        image: r.image ? { uri: r.image } : undefined,
      };
    },
    [itemsById],
  );

  const forYouEvents: ForYouRowItem[] = useMemo(
    () =>
      filteredRecommendations
        .filter((r) => r.type !== "program")
        .slice(0, 3)
        .map(buildRow),
    [filteredRecommendations, buildRow],
  );

  const forYouPrograms: ForYouRowItem[] = useMemo(
    () =>
      filteredRecommendations
        .filter((r) => r.type === "program")
        .slice(0, 3)
        .map(buildRow),
    [filteredRecommendations, buildRow],
  );

  const audienceItems = useCallback(
    (kind: "event" | "program"): AudienceItem[] => {
      const todayIso = new Date().toISOString().slice(0, 10);
      return filteredItems
        .filter((r) => r.type === kind)
        .map((r) => ({
          id: r.content_id,
          title: toTitleCase(r.name ?? "Untitled"),
          dateLabel: formatCardDate(r.start_date, r.start_time),
          image: r.image ? { uri: r.image } : undefined,
          isKids: r.is_kids === true,
          isYouth: r.is_fourteen_plus === true,
          category: deriveCategory(r),
          isWeekly: r.is_weekly_program === true,
          isUpcoming: r.start_date ? r.start_date >= todayIso : false,
        }));
    },
    [filteredItems],
  );

  const programBrowseItems = useMemo(
    () => audienceItems("program"),
    [audienceItems],
  );

  const eventBrowseItems = useMemo(
    () => audienceItems("event"),
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
          onSelect={handleHeaderSelect}
          onPressCalendar={() => router.push("/discover/calendar")}
          searchValue={searchQuery}
          onChangeSearch={setSearchQuery}
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
              <AudienceBrowse
                kind="events"
                items={eventBrowseItems}
                onPressItem={openContent}
                allTabFooter={<DonateCard onPress={openDonate} />}
              />
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
                <View className="mt-8">
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
                    onPressViewCalendar={() =>
                      router.push("/discover/calendar")
                    }
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

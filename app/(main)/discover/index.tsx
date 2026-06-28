import {
  PlayfairDisplay_500Medium,
  useFonts,
} from "@expo-google-fonts/playfair-display";
import { router, useLocalSearchParams } from "expo-router";

import { useTranslation } from "react-i18next";

import { useStatusBarStyle } from "@/src/hooks/use-status-bar-style";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import { ActivityIndicator, Text, View } from "react-native";
import Animated, {
  runOnJS,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AudienceBrowse, {
  type AudienceItem,
  type BrowseFilter,
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
import DiscoverSkeleton from "@/components/Discover/DiscoverSkeleton";
import RingSpinner from "@/components/Discover/RingSpinner";
import DonateCard from "@/components/profile/DonateCard";
import { useContentItems } from "@/src/hooks/use-content-items";
import { describeRecurrence, ruleFromRow } from "@/src/lib/recurrence";
import { useMasjidConfig } from "@/src/hooks/use-masjid-config";
import { useRecommendation } from "@/src/hooks/use-Recommendation";
import { useProgramCategories } from "@/src/hooks/use-program-categories";
import { useProgramCategoryContent } from "@/src/hooks/use-program-category-content";
import {
  DEFAULT_CATEGORIES,
  defaultImageForTitle,
} from "@/src/lib/program-category-defaults";

// Fallback cards shown when a mosque hasn't configured custom categories.
const DEFAULT_PROGRAMS: ProgramItem[] = DEFAULT_CATEGORIES.map((c, i) => ({
  id: `default-${i}`,
  title: c.title,
  image: c.image,
  audience: c.audience_filter,
}));

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

function formatCardDate(item: {
  start_date: string | null;
  start_time: string | null;
  recurrence_freq?: string | null;
  recurrence_interval?: number | null;
  recurrence_anchor?: string | null;
  week_of_month?: number | null;
  days?: string[] | null;
  end_date?: string | null;
}): string {
  const time = formatTime12(item.start_time);
  // Recurring items have no single start_date \u2014 describe the pattern instead.
  if (item.recurrence_freq && item.recurrence_freq !== "once") {
    const label = describeRecurrence(ruleFromRow(item));
    if (label) return time ? `${label} \u2022 ${time}` : label;
  }
  if (!item.start_date) return time;
  const start = new Date(item.start_date).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });
  return time ? `${start} \u2022 ${time}` : start;
}

const TAB_INDEX: Record<DiscoverTab, number> = {
  All: 0,
  "For You": 1,
  Events: 2,
  Programs: 3,
};

export default function DiscoverScreen() {
  const { t } = useTranslation();
  const { colors } = useMasjidConfig();
  const fg = colors.foreground.replace(/ /g, ",");
  const fgRgb = `rgb(${fg})`;
  const primaryRgb = `rgb(${colors.primary.replace(/ /g, ",")})`;
  const bgRgb = `rgb(${colors.background.replace(/ /g, ",")})`;
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTabState] = useState<DiscoverTab>("All");
  const [direction, setDirection] = useState<"right" | "left">("right");
  const [nextTab, setNextTab] = useState<DiscoverTab | null>(null);
  const [programsInitialFilter, setProgramsInitialFilter] =
    useState<string>("All");
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

  const [lastProcessedTab, setLastProcessedTab] = useState<string | null>(null);
  useEffect(() => {
    const requested = params.tab;
    if (!requested) return;
    if (requested === lastProcessedTab) return;
    if (!(requested in TAB_INDEX)) return;
    setLastProcessedTab(requested);
    const target = requested as DiscoverTab;
    if (target === activeTab) return;
    if (target === "Programs") setProgramsInitialFilter("All");
    switchTab(target);
  }, [params.tab, activeTab, switchTab, lastProcessedTab]);

  const handleHeaderSelect = useCallback(
    (tab: DiscoverTab) => {
      if (tab === "Programs") setProgramsInitialFilter("All");
      switchTab(tab);
    },
    [switchTab],
  );

  const goToProgramsWithFilter = useCallback(
    (filterKey: string) => {
      setProgramsInitialFilter(filterKey);
      switchTab("Programs");
    },
    [switchTab],
  );
  const { items, status, error, refetch: refetchItems } = useContentItems();
  const {
    recommendations,
    status: recStatus,
    error: recError,
    refetch: refetchRecs,
  } = useRecommendation();

  // Admin-managed Discover "Programs" cards. Falls back to the bundled
  // Kids/Youth/Adults defaults when a mosque hasn't configured any.
  const { categories: programCategories } = useProgramCategories();
  const { byContent: programCategoryByContent } = useProgramCategoryContent();
  const programCards = useMemo<ProgramItem[]>(() => {
    if (programCategories.length === 0) return DEFAULT_PROGRAMS;
    return programCategories.map((c) => ({
      id: c.id,
      title: c.title,
      image: c.image_url
        ? { uri: c.image_url }
        : defaultImageForTitle(c.title),
      audience: c.audience_filter,
      bgColor: c.bg_color,
    }));
  }, [programCategories]);

  // When a mosque has configured program cards, the Programs tab pills become
  // those cards (filtering by the program↔card assignments) instead of the
  // built-in Kids/Youth/Adults audiences. With no cards, `undefined` lets
  // AudienceBrowse fall back to its default audience filters.
  const programFilters = useMemo<BrowseFilter[] | undefined>(() => {
    if (programCategories.length === 0) return undefined;
    return [
      { key: "All", label: t("common.all") },
      ...programCategories.map((c) => ({ key: c.id, label: c.title })),
    ];
  }, [programCategories]);

  const matchProgramFilter = useCallback(
    (item: AudienceItem, key: string) =>
      programCategoryByContent.get(item.id)?.has(key) ?? false,
    [programCategoryByContent],
  );

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing((already) => {
      if (already) return already; // guard against a double-trigger
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Keep the spinner on screen for at least a beat — in demo/mock mode the
      // refetch resolves instantly, which would otherwise flash the loader for
      // a single frame and look like nothing happened.
      const minVisible = new Promise((resolve) => setTimeout(resolve, 700));
      Promise.all([refetchItems(), refetchRecs(), minVisible]).finally(() => {
        // Success buzz when the reload finishes, matching the Prayer screen.
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setRefreshing(false);
      });
      return true;
    });
  }, [refetchItems, refetchRecs]);

  // Custom pull-to-refresh: we drive the gesture ourselves (NO native
  // RefreshControl) so the ring spinner is the only indicator — the native
  // spinner can't be reliably hidden and kept showing as a second one.
  const PULL_THRESHOLD = 80;
  // 0..1 pull progress — drives the ring spinner's fade-in while dragging.
  const pullProgress = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      // With contentInset.top the resting offset is -insets.top; anything
      // more negative than that is an overscroll pull-down.
      const pull = -(e.contentOffset.y + insets.top);
      pullProgress.value = Math.min(Math.max(pull / PULL_THRESHOLD, 0), 1);
    },
    onEndDrag: () => {
      if (pullProgress.value >= 1) {
        runOnJS(onRefresh)();
      }
      // Hide the ring on release — the skeleton takes over from here.
      pullProgress.value = 0;
    },
  });

  // Ring spinner only shows during the pull; it fades away once you release
  // and the skeleton loading state takes over.
  const ringStyle = useAnimatedStyle(() => ({
    opacity: pullProgress.value,
    transform: [{ scale: 0.7 + pullProgress.value * 0.3 }],
  }));

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
        title: toTitleCase(r.name ?? t("discover.untitled")),
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
    if (item.is_kids) labels.push(t("discover.categoryKids"));
    if (item.is_fourteen_plus) labels.push(t("discover.categoryYouth"));
    if (item.is_young_professionals)
      labels.push(t("discover.categoryYoungProfessionals"));
    if (item.is_pace) labels.push(t("discover.categoryPace"));
    if (item.is_quran) labels.push(t("discover.categoryQuran"));
    if (labels.length === 0) return t("discover.categoryForAll");
    return labels.slice(0, 2).join(t("discover.categoryJoiner"));
  };

  const upcomingItems: EventItem[] = useMemo(() => {
    // Drop items whose last day is in the past — they shouldn't render in
    // an "Upcoming events" list even if the DB still has them. The admin
    // portal still surfaces them under All / Past so they aren't lost.
    // YYYY-MM-DD string compare aligns with how content_items.start_date is
    // stored; items with no date are treated as ongoing and kept.
    const today = new Date().toISOString().slice(0, 10);
    const future = filteredItems.filter((r) => {
      if (!r.start_date) return true;
      const lastDay = r.end_date ?? r.start_date;
      return lastDay >= today;
    });
    return future.slice(0, 3).map((r) => ({
      id: r.content_id,
      title: toTitleCase(r.name ?? t("discover.untitled")),
      dateLabel: formatCardDate(r),
      category: deriveCategory(r),
      thumbnail: r.image ? { uri: r.image } : undefined,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredItems]);

  const buildRow = useCallback(
    (r: (typeof recommendations)[number]): ForYouRowItem => {
      const matched = itemsById.get(r.content_id);
      return {
        id: r.content_id,
        title: toTitleCase(r.name ?? t("discover.untitled")),
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
          title: toTitleCase(r.name ?? t("discover.untitled")),
          dateLabel: formatCardDate(r),
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

  useStatusBarStyle("dark");

  if (!fontsLoaded) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: bgRgb }}
      >
        <ActivityIndicator color={fgRgb} />
      </View>
    );
  }

  const isLoading = recStatus === "loading" && recommendations.length === 0;

  return (
    <View className="flex-1" style={{ backgroundColor: bgRgb }}>
      <View className="flex-1">
      {/* Gradient ring spinner — fades in as you pull and disappears on
          release, handing off to the skeleton loading state. */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: insets.top + 8,
            left: 0,
            right: 0,
            alignItems: "center",
            zIndex: 20,
          },
          ringStyle,
        ]}
      >
        <RingSpinner color={fgRgb} />
      </Animated.View>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        // Inset the content (instead of paddingTop) so it sits in the visible
        // safe area — same approach as the Prayer screen.
        contentInset={{ top: insets.top }}
        contentOffset={{ x: 0, y: -insets.top }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <DiscoverHeader
          title={
            activeTab === "For You"
              ? t("discover.titleForYou")
              : activeTab === "Events"
                ? t("discover.titleEvents")
                : activeTab === "Programs"
                  ? t("discover.titlePrograms")
                  : t("discover.titleDiscover")
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
              {t("discover.errorLoadContent", { error })}
            </Text>
          </View>
        ) : null}

        {recStatus === "error" ? (
          <View className="mx-6 mt-4 rounded-lg bg-[#FDECEC] p-3">
            <Text className="text-xs text-[#7A1F1F]">
              {t("discover.errorLoadRecommendations", { error: recError })}
            </Text>
          </View>
        ) : null}

        {isLoading || refreshing ? (
          <DiscoverSkeleton />
        ) : (
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
                  <ActivityIndicator color={fgRgb} />
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
                allTabFooter={<DonateCard />}
              />
            ) : activeTab === "Programs" ? (
              <AudienceBrowse
                kind="programs"
                items={programBrowseItems}
                onPressItem={openContent}
                initialFilter={programsInitialFilter}
                filters={programFilters}
                matchFilter={programFilters ? matchProgramFilter : undefined}
                onPressSeeAll={(key) => setProgramsInitialFilter(key)}
                allTabFooter={<DonateCard />}
              />
            ) : (
              <>
                <View className="mt-8">
                  {isLoading ? (
                    <View className="px-6 py-8">
                      <ActivityIndicator color={fgRgb} />
                    </View>
                  ) : (
                    <RecommendedSection
                      items={recommendedItems}
                      onPressItem={(item) => openContent(item.id)}
                      onPressSeeAll={() => switchTab("For You")}
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
                    items={programCards}
                    onPressItem={(item) =>
                      goToProgramsWithFilter(
                        // With cards configured, the card id IS the filter key;
                        // otherwise route by the card's audience bucket.
                        programFilters
                          ? item.id
                          : item.audience ?? item.title,
                      )
                    }
                    onPressSeeAll={() => goToProgramsWithFilter("All")}
                  />
                </View>

                <View className="mt-6 px-6">
                  <DonateCard />
                </View>
              </>
            )}
          </Animated.View>
        </View>
        )}
      </Animated.ScrollView>
      </View>
    </View>
  );
}

import AntDesign from "@expo/vector-icons/AntDesign";
import { Image } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from "react-native-reanimated";

import { useFontFamily } from "@/src/hooks/use-font-family";
import { useIsRTL } from "@/src/hooks/use-is-rtl";
import { useMasjidConfig } from "@/src/hooks/use-masjid-config";

export type AudienceItem = {
  id: string;
  title: string;
  dateLabel: string;
  image?: { uri: string } | number;
  isKids: boolean;
  isYouth: boolean;
  category?: string | null;
  isWeekly?: boolean;
  isUpcoming?: boolean;
};

export type AudienceFilter = "All" | "Kids" | "Youth" | "Adults";

/** A single selectable pill. `key` is the filter identity (audience name or a
 *  program-category id); `label` is what the user sees. */
export type BrowseFilter = { key: string; label: string };

type Props = {
  items: AudienceItem[];
  onPressItem: (id: string) => void;
  onPressSeeAll?: (key: string) => void;
  allTabFooter?: React.ReactNode;
  kind?: "events" | "programs";
  initialFilter?: string;
  /** Override the pills. Defaults to the All/Kids/Youth/Adults audience set.
   *  The first entry is treated as the "show everything" tab. */
  filters?: BrowseFilter[];
  /** Whether an item belongs under a given non-"all" filter key. Defaults to
   *  audience matching (Kids/Youth/Adults via item flags). */
  matchFilter?: (item: AudienceItem, key: string) => boolean;
};

function FilterPills({
  filters,
  active,
  onSelect,
}: {
  filters: BrowseFilter[];
  active: string;
  onSelect: (key: string) => void;
}) {
  const fonts = useFontFamily();
  const { colors } = useMasjidConfig();
  const fg = colors.foreground.replace(/ /g, ",");
  const primaryRgb = `rgb(${colors.primary.replace(/ /g, ",")})`;
  const bgRgb = `rgb(${colors.background.replace(/ /g, ",")})`;
  const mutedFgRgb = `rgb(${colors.mutedForeground.replace(/ /g, ",")})`;
  const pillTrackBg = `rgba(${fg}, 0.06)`;

  // Up to 4 pills fit the full-width segmented look; beyond that, scroll.
  const scrollable = filters.length > 4;

  const pill = (f: BrowseFilter) => {
    const isActive = f.key === active;
    return (
      <Pressable
        key={f.key}
        onPress={() => onSelect(f.key)}
        className={scrollable ? "items-center justify-center" : "flex-1 items-center justify-center"}
        style={{
          paddingVertical: 7,
          paddingHorizontal: scrollable ? 16 : 0,
          borderRadius: 999,
          backgroundColor: isActive ? primaryRgb : "transparent",
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            fontFamily: fonts.body,
            fontSize: 11,
            color: isActive ? bgRgb : mutedFgRgb,
          }}
        >
          {f.label}
        </Text>
      </Pressable>
    );
  };

  // No outline, and no inner padding — so the active pill fills the whole track
  // (a clean stadium-in-stadium), clipped to the rounded ends.
  const trackStyle = {
    backgroundColor: pillTrackBg,
    borderRadius: 999,
    overflow: 'hidden',
  } as const;

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24 }}
      >
        <View className="flex-row items-center" style={trackStyle}>
          {filters.map(pill)}
        </View>
      </ScrollView>
    );
  }

  return (
    <View className="px-6">
      <View className="flex-row items-center" style={trackStyle}>
        {filters.map(pill)}
      </View>
    </View>
  );
}

function Card({
  item,
  onPress,
}: {
  item: AudienceItem;
  onPress: () => void;
}) {
  const fonts = useFontFamily();
  const { colors } = useMasjidConfig();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ",")})`;
  const mutedFgRgb = `rgb(${colors.mutedForeground.replace(/ /g, ",")})`;
  const mutedRgb = `rgb(${colors.muted.replace(/ /g, ",")})`;

  return (
    <Pressable
      onPress={onPress}
      style={{ width: 145, marginEnd: 16 }}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <View
        style={{
          width: 145,
          height: 145,
          borderRadius: 14,
          overflow: "hidden",
          backgroundColor: mutedRgb,
        }}
      >
        {item.image ? (
          <Image
            source={item.image}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : null}
      </View>
      <Text
        numberOfLines={1}
        style={{
          marginTop: 10,
          fontFamily: fonts.bodySemibold,
          fontSize: 13,
          fontWeight: "600",
          color: fgRgb,
          lineHeight: 18,
        }}
      >
        {item.title}
      </Text>
      <Text
        numberOfLines={1}
        style={{
          marginTop: 2,
          fontFamily: fonts.body,
          fontSize: 12,
          color: mutedFgRgb,
          lineHeight: 16,
        }}
      >
        {item.dateLabel}
      </Text>
    </Pressable>
  );
}

function ListRow({
  item,
  onPress,
  showDivider,
}: {
  item: AudienceItem;
  onPress: () => void;
  showDivider: boolean;
}) {
  const isRTL = useIsRTL();
  const fonts = useFontFamily();
  const { colors } = useMasjidConfig();
  const fg = colors.foreground.replace(/ /g, ",");
  const fgRgb = `rgb(${fg})`;
  const mutedFgRgb = `rgb(${colors.mutedForeground.replace(/ /g, ",")})`;
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ",")})`;
  const mutedRgb = `rgb(${colors.muted.replace(/ /g, ",")})`;
  const rowDivider = `rgba(${fg}, 0.1)`;

  return (
    <View>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={item.title}
        className="flex-row items-center px-6"
        style={{ paddingVertical: 14 }}
      >
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 10,
            overflow: "hidden",
            backgroundColor: mutedRgb,
          }}
        >
          {item.image ? (
            <Image
              source={item.image}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : null}
        </View>

        <View className="ms-3 flex-1">
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fonts.bodySemibold,
              fontSize: 13,
              fontWeight: "600",
              color: fgRgb,
              lineHeight: 18,
            }}
          >
            {item.title}
          </Text>
          {item.dateLabel ? (
            <Text
              numberOfLines={1}
              style={{
                fontFamily: fonts.body,
                fontSize: 12,
                color: mutedFgRgb,
                lineHeight: 16,
                marginTop: 2,
              }}
            >
              {item.dateLabel}
            </Text>
          ) : null}
          {item.category ? (
            <Text
              numberOfLines={1}
              style={{
                fontFamily: fonts.bodyMedium,
                fontSize: 12,
                color: accentRgb,
                fontWeight: "500",
                lineHeight: 16,
                marginTop: 2,
              }}
            >
              {item.category}
            </Text>
          ) : null}
        </View>

        <AntDesign
          name={isRTL ? "left" : "right"}
          size={12}
          color={mutedFgRgb}
        />
      </Pressable>

      {showDivider ? (
        <View
          style={{
            height: 1,
            backgroundColor: rowDivider,
            marginHorizontal: 24,
          }}
        />
      ) : null}
    </View>
  );
}

function ListSection({
  label,
  items,
  onPressItem,
}: {
  label: string;
  items: AudienceItem[];
  onPressItem: (id: string) => void;
}) {
  const fonts = useFontFamily();
  const { colors } = useMasjidConfig();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ",")})`;

  if (items.length === 0) return null;
  return (
    <View style={{ marginTop: 24 }}>
      <View className="px-6">
        <Text
          style={{
            fontFamily: fonts.bodySemibold,
            fontSize: 13,
            fontWeight: "700",
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: fgRgb,
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
        <View style={{ height: 1, backgroundColor: fgRgb }} />
      </View>
      <View style={{ marginTop: 2 }}>
        {items.map((item, idx) => (
          <ListRow
            key={item.id}
            item={item}
            onPress={() => onPressItem(item.id)}
            showDivider={idx < items.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

function Section({
  label,
  items,
  onPressItem,
  onPressSeeAll,
}: {
  label: string;
  items: AudienceItem[];
  onPressItem: (id: string) => void;
  onPressSeeAll?: () => void;
}) {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const fonts = useFontFamily();
  const { colors } = useMasjidConfig();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ",")})`;
  const mutedFgRgb = `rgb(${colors.mutedForeground.replace(/ /g, ",")})`;

  if (items.length === 0) return null;
  return (
    <View style={{ marginTop: 24 }}>
      <View className="flex-row items-center px-6">
        <Text
          style={{
            flex: 1,
            fontFamily: fonts.bodySemibold,
            fontSize: 13,
            fontWeight: "700",
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: fgRgb,
          }}
        >
          {label}
        </Text>
        {onPressSeeAll ? (
          <Pressable
            onPress={onPressSeeAll}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t("discover.seeAllLabel", { label })}
            className="flex-row items-center"
          >
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: 10,
                textTransform: "uppercase",
                color: mutedFgRgb,
                letterSpacing: 0.4,
                marginEnd: 4,
              }}
            >
              {t("discover.seeAll")}
            </Text>
            <AntDesign
              name={isRTL ? "arrow-left" : "arrow-right"}
              size={10}
              color={mutedFgRgb}
            />
          </Pressable>
        ) : null}
      </View>
      <View
        style={{
          height: 1,
          backgroundColor: fgRgb,
          marginTop: 6,
          marginHorizontal: 24,
        }}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 16,
        }}
      >
        {items.map((item) => (
          <Card
            key={item.id}
            item={item}
            onPress={() => onPressItem(item.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function EmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const fonts = useFontFamily();
  const { colors } = useMasjidConfig();
  const fg = colors.foreground.replace(/ /g, ",");
  const fgRgb = `rgb(${fg})`;
  const mutedFgRgb = `rgb(${colors.mutedForeground.replace(/ /g, ",")})`;

  return (
    <View className="items-center px-6" style={{ marginTop: 64 }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: `rgba(${fg}, 0.05)`,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14,
        }}
      >
        <AntDesign name="calendar" size={26} color={mutedFgRgb} />
      </View>
      <Text
        style={{
          fontFamily: fonts.bodySemibold,
          fontSize: 14,
          fontWeight: "600",
          color: fgRgb,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 12,
            color: mutedFgRgb,
            textAlign: "center",
            marginTop: 4,
            lineHeight: 17,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

function matchesAudience(
  item: AudienceItem,
  audience: Exclude<AudienceFilter, "All">,
): boolean {
  if (audience === "Kids") return item.isKids;
  if (audience === "Youth") return !item.isKids && item.isYouth;
  return !item.isKids && !item.isYouth;
}

export default function AudienceBrowse({
  items,
  onPressItem,
  onPressSeeAll,
  allTabFooter,
  kind = "events",
  initialFilter,
  filters: filtersProp,
  matchFilter,
}: Props) {
  const { t } = useTranslation();

  // When the caller doesn't supply pills, fall back to the built-in audience
  // set — translating the labels while keeping the keys stable (the keys are
  // the filter identity that `matchesAudience` switches on).
  const defaultFilters = useMemo<BrowseFilter[]>(
    () => [
      { key: "All", label: t("common.all") },
      { key: "Kids", label: t("discover.audienceKids") },
      { key: "Youth", label: t("discover.audienceYouth") },
      { key: "Adults", label: t("discover.audienceAdults") },
    ],
    [t],
  );
  const filters = filtersProp ?? defaultFilters;
  const allKey = filters[0]?.key ?? "All";
  const match = matchFilter ?? ((item, key) => matchesAudience(item, key as Exclude<AudienceFilter, "All">));

  const [filter, setFilter] = useState<string>(initialFilter ?? allKey);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (initialFilter) setFilter(initialFilter);
  }, [initialFilter]);

  const indexOfKey = (key: string) => filters.findIndex((f) => f.key === key);

  // Change filter while recording the swipe/tap direction so the new content
  // slides in from the matching side.
  const goToFilter = (next: string) => {
    if (next === filter) return;
    setDirection(indexOfKey(next) > indexOfKey(filter) ? "right" : "left");
    setFilter(next);
  };

  const nonAllFilters = useMemo(
    () => filters.filter((f) => f.key !== allKey),
    [filters, allKey],
  );

  // All-tab carousels: one per filter, plus a catch-all for items matching none
  // (empty for the audience default; holds uncategorized programs otherwise).
  const allViewSections = useMemo(() => {
    const sections = nonAllFilters.map((f) => ({
      key: f.key,
      label: f.label,
      items: items.filter((item) => match(item, f.key)),
    }));
    const uncategorized = items.filter(
      (item) => !nonAllFilters.some((f) => match(item, f.key)),
    );
    return { sections, uncategorized };
  }, [items, nonAllFilters, match]);

  const showAudienceList = filter !== allKey;

  const itemsForAudience = useMemo(() => {
    if (!showAudienceList) return [];
    return items.filter((item) => match(item, filter));
  }, [items, filter, showAudienceList, match]);

  const activeLabel = filters.find((f) => f.key === filter)?.label ?? filter;
  const allLabel =
    kind === "programs"
      ? t("discover.allPrograms")
      : t("discover.allEvents");
  const secondaryLabel =
    kind === "programs"
      ? t("discover.weeklyPrograms")
      : t("discover.upcomingEvents");
  const secondaryFilter = (item: AudienceItem) =>
    kind === "programs" ? item.isWeekly === true : item.isUpcoming === true;

  const kindNoun =
    kind === "programs"
      ? t("discover.nounPrograms")
      : t("discover.nounEvents");

  // Swipe horizontally to move through the filters.
  const cycleFilter = (dir: 1 | -1) => {
    const next = indexOfKey(filter) + dir;
    if (next >= 0 && next < filters.length) goToFilter(filters[next].key);
  };

  const swipe = useMemo(
    () =>
      Gesture.Pan()
        // Only claim decisive horizontal swipes; let vertical page scroll and
        // the All-view card carousels keep working.
        .activeOffsetX([-25, 25])
        .failOffsetY([-15, 15])
        .onEnd((e) => {
          if (e.translationX < -55 || e.velocityX < -600) runOnJS(cycleFilter)(1);
          else if (e.translationX > 55 || e.velocityX > 600) runOnJS(cycleFilter)(-1);
        }),
    [filter, filters],
  );

  return (
    <GestureDetector gesture={swipe}>
    <View>
      <View style={{ marginTop: 22 }}>
        <FilterPills filters={filters} active={filter} onSelect={goToFilter} />
      </View>

      <View style={{ overflow: "hidden" }}>
      <Animated.View
        key={filter}
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
      {showAudienceList ? (
        itemsForAudience.length === 0 ? (
          <EmptyState
            title={t("discover.emptyAudienceTitle", {
              audience: activeLabel.toLowerCase(),
              kind: kindNoun,
            })}
            subtitle={t("discover.emptyAudienceSubtitle")}
          />
        ) : (
          <>
            <ListSection
              label={allLabel}
              items={itemsForAudience}
              onPressItem={onPressItem}
            />
            <ListSection
              label={secondaryLabel}
              items={itemsForAudience.filter(secondaryFilter)}
              onPressItem={onPressItem}
            />
          </>
        )
      ) : items.length === 0 ? (
        <EmptyState
          title={t("discover.emptyKindTitle", { kind: kindNoun })}
          subtitle={t("discover.emptyKindSubtitle", { kind: kindNoun })}
        />
      ) : (
        <>
          {allViewSections.sections.map((s) => (
            <Section
              key={s.key}
              label={s.label}
              items={s.items}
              onPressItem={onPressItem}
              onPressSeeAll={() => {
                if (onPressSeeAll) onPressSeeAll(s.key);
                else goToFilter(s.key);
              }}
            />
          ))}
          {allViewSections.uncategorized.length > 0 ? (
            <Section
              label={t("discover.otherKind", { kind: kindNoun })}
              items={allViewSections.uncategorized}
              onPressItem={onPressItem}
            />
          ) : null}
        </>
      )}

      {filter === allKey && allTabFooter ? (
        <View className="px-6" style={{ marginTop: 24 }}>
          {allTabFooter}
        </View>
      ) : null}
      </Animated.View>
      </View>
    </View>
    </GestureDetector>
  );
}

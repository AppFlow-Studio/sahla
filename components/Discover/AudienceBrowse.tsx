import AntDesign from "@expo/vector-icons/AntDesign";
import { Image } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import {
  Platform,
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

import { useMasjidConfig } from "@/src/hooks/use-masjid-config";

const platformUiFont = Platform.select({
  ios: "SF Pro Text",
  android: "Roboto",
  default: "system-ui",
});

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
const FILTERS: AudienceFilter[] = ["All", "Kids", "Youth", "Adults"];

type Props = {
  items: AudienceItem[];
  onPressItem: (id: string) => void;
  onPressSeeAll?: (audience: Exclude<AudienceFilter, "All">) => void;
  allTabFooter?: React.ReactNode;
  kind?: "events" | "programs";
  initialFilter?: AudienceFilter;
};

function FilterPills({
  active,
  onSelect,
}: {
  active: AudienceFilter;
  onSelect: (f: AudienceFilter) => void;
}) {
  const { colors } = useMasjidConfig();
  const fg = colors.foreground.replace(/ /g, ",");
  const primaryRgb = `rgb(${colors.primary.replace(/ /g, ",")})`;
  const bgRgb = `rgb(${colors.background.replace(/ /g, ",")})`;
  const mutedFgRgb = `rgb(${colors.mutedForeground.replace(/ /g, ",")})`;
  const pillTrackBg = `rgba(${fg}, 0.06)`;
  const pillTrackBorder = `rgba(${fg}, 0.4)`;

  return (
    <View className="px-6">
      <View
        className="flex-row items-center"
        style={{
          backgroundColor: pillTrackBg,
          borderRadius: 999,
          padding: 3,
          borderWidth: 0.5,
          borderColor: pillTrackBorder,
        }}
      >
        {FILTERS.map((f) => {
          const isActive = f === active;
          return (
            <Pressable
              key={f}
              onPress={() => onSelect(f)}
              className="flex-1 items-center justify-center"
              style={{
                paddingVertical: 7,
                borderRadius: 999,
                backgroundColor: isActive ? primaryRgb : "transparent",
              }}
            >
              <Text
                style={{
                  fontFamily: platformUiFont,
                  fontSize: 11,
                  color: isActive ? bgRgb : mutedFgRgb,
                }}
              >
                {f}
              </Text>
            </Pressable>
          );
        })}
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
  const { colors } = useMasjidConfig();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ",")})`;
  const mutedFgRgb = `rgb(${colors.mutedForeground.replace(/ /g, ",")})`;
  const mutedRgb = `rgb(${colors.muted.replace(/ /g, ",")})`;

  return (
    <Pressable
      onPress={onPress}
      style={{ width: 145, marginRight: 16 }}
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
          fontFamily: platformUiFont,
          fontSize: 11,
          fontWeight: "600",
          color: fgRgb,
          lineHeight: 16,
        }}
      >
        {item.title}
      </Text>
      <Text
        numberOfLines={1}
        style={{
          marginTop: 2,
          fontFamily: platformUiFont,
          fontSize: 10,
          color: mutedFgRgb,
          lineHeight: 14,
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

        <View className="ml-3 flex-1">
          <Text
            numberOfLines={1}
            style={{
              fontFamily: platformUiFont,
              fontSize: 13,
              fontWeight: "600",
              color: fgRgb,
              lineHeight: 16,
            }}
          >
            {item.title}
          </Text>
          {item.dateLabel ? (
            <Text
              numberOfLines={1}
              style={{
                fontFamily: platformUiFont,
                fontSize: 11,
                color: mutedFgRgb,
                lineHeight: 14,
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
                fontFamily: platformUiFont,
                fontSize: 11,
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

        <AntDesign name="right" size={12} color={mutedFgRgb} />
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
  const { colors } = useMasjidConfig();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ",")})`;

  if (items.length === 0) return null;
  return (
    <View style={{ marginTop: 24 }}>
      <View className="px-6">
        <Text
          style={{
            fontFamily: platformUiFont,
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
            fontFamily: platformUiFont,
            fontSize: 13,
            fontWeight: "700",
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: fgRgb,
          }}
        >
          {label}
        </Text>
        <Pressable
          onPress={onPressSeeAll}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`See all ${label}`}
          className="flex-row items-center"
        >
          <Text
            style={{
              fontFamily: platformUiFont,
              fontSize: 10,
              textTransform: "uppercase",
              color: mutedFgRgb,
              letterSpacing: 0.4,
              marginRight: 4,
            }}
          >
            See all
          </Text>
          <AntDesign name="arrow-right" size={10} color={mutedFgRgb} />
        </Pressable>
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
          fontFamily: platformUiFont,
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
            fontFamily: platformUiFont,
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
}: Props) {
  const [filter, setFilter] = useState<AudienceFilter>(initialFilter ?? "All");
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (initialFilter) setFilter(initialFilter);
  }, [initialFilter]);

  // Change filter while recording the swipe/tap direction so the new content
  // slides in from the matching side.
  const goToFilter = (next: AudienceFilter) => {
    if (next === filter) return;
    setDirection(FILTERS.indexOf(next) > FILTERS.indexOf(filter) ? "right" : "left");
    setFilter(next);
  };

  const grouped = useMemo(() => {
    const kids: AudienceItem[] = [];
    const youth: AudienceItem[] = [];
    const adults: AudienceItem[] = [];
    for (const item of items) {
      if (item.isKids) kids.push(item);
      else if (item.isYouth) youth.push(item);
      else adults.push(item);
    }
    return { kids, youth, adults };
  }, [items]);

  const showAudienceList = filter !== "All";

  const itemsForAudience = useMemo(() => {
    if (!showAudienceList) return [];
    return items.filter((item) => matchesAudience(item, filter));
  }, [items, filter, showAudienceList]);

  const allLabel = kind === "programs" ? "All programs" : "All events";
  const secondaryLabel =
    kind === "programs" ? "Weekly programs" : "Upcoming events";
  const secondaryFilter = (item: AudienceItem) =>
    kind === "programs" ? item.isWeekly === true : item.isUpcoming === true;

  const showKids = filter === "All" || filter === "Kids";
  const showYouth = filter === "All" || filter === "Youth";
  const showAdults = filter === "All" || filter === "Adults";

  const kindNoun = kind === "programs" ? "programs" : "events";

  // Swipe horizontally to move through the All / Kids / Youth / Adults filters.
  const cycleFilter = (dir: 1 | -1) => {
    const next = FILTERS.indexOf(filter) + dir;
    if (next >= 0 && next < FILTERS.length) goToFilter(FILTERS[next]);
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
    [filter],
  );

  return (
    <GestureDetector gesture={swipe}>
    <View>
      <View style={{ marginTop: 22 }}>
        <FilterPills active={filter} onSelect={goToFilter} />
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
            title={`No ${filter.toLowerCase()} ${kindNoun}`}
            subtitle="Check back soon or try another filter."
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
          title={`No ${kindNoun} yet`}
          subtitle={`New ${kindNoun} will appear here when they're added.`}
        />
      ) : (
        <>
          {showKids ? (
            <Section
              label="Kids"
              items={grouped.kids}
              onPressItem={onPressItem}
              onPressSeeAll={() => {
                if (onPressSeeAll) onPressSeeAll("Kids");
                else goToFilter("Kids");
              }}
            />
          ) : null}
          {showYouth ? (
            <Section
              label="Youth"
              items={grouped.youth}
              onPressItem={onPressItem}
              onPressSeeAll={() => {
                if (onPressSeeAll) onPressSeeAll("Youth");
                else goToFilter("Youth");
              }}
            />
          ) : null}
          {showAdults ? (
            <Section
              label="Adults"
              items={grouped.adults}
              onPressItem={onPressItem}
              onPressSeeAll={() => {
                if (onPressSeeAll) onPressSeeAll("Adults");
                else goToFilter("Adults");
              }}
            />
          ) : null}
        </>
      )}

      {filter === "All" && allTabFooter ? (
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

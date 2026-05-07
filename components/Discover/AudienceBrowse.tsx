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

const BUSH = "#0A261E";
const MUTED = "rgba(10,38,30,0.6)";
const GOLD = "#B8922A";
const SECTION_LINE = "#0A261E";
const ROW_DIVIDER = "rgba(10,38,30,0.1)";
const PILL_TRACK_BG = "rgba(10,38,30,0.06)";
const PILL_TRACK_BORDER = "rgba(10,38,30,0.4)";
const CARD_PLACEHOLDER = "#EFEDE6";

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
  return (
    <View className="px-6">
      <View
        className="flex-row items-center"
        style={{
          backgroundColor: PILL_TRACK_BG,
          borderRadius: 999,
          padding: 3,
          borderWidth: 0.5,
          borderColor: PILL_TRACK_BORDER,
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
                backgroundColor: isActive ? BUSH : "transparent",
              }}
            >
              <Text
                style={{
                  fontFamily: platformUiFont,
                  fontSize: 11,
                  color: isActive ? "#FFFBF2" : MUTED,
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
          backgroundColor: CARD_PLACEHOLDER,
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
          color: BUSH,
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
          color: MUTED,
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
            backgroundColor: CARD_PLACEHOLDER,
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
              color: BUSH,
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
                color: MUTED,
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
                color: GOLD,
                fontWeight: "500",
                lineHeight: 16,
                marginTop: 2,
              }}
            >
              {item.category}
            </Text>
          ) : null}
        </View>

        <AntDesign name="right" size={12} color={MUTED} />
      </Pressable>

      {showDivider ? (
        <View
          style={{
            height: 1,
            backgroundColor: ROW_DIVIDER,
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
            color: BUSH,
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
        <View style={{ height: 1, backgroundColor: SECTION_LINE }} />
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
            color: BUSH,
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
              color: MUTED,
              letterSpacing: 0.4,
              marginRight: 4,
            }}
          >
            See all
          </Text>
          <AntDesign name="arrow-right" size={10} color={MUTED} />
        </Pressable>
      </View>
      <View
        style={{
          height: 1,
          backgroundColor: SECTION_LINE,
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

  useEffect(() => {
    if (initialFilter) setFilter(initialFilter);
  }, [initialFilter]);

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

  const showProgramsList = kind === "programs" && filter !== "All";

  const programsForAudience = useMemo(() => {
    if (!showProgramsList) return [];
    return items.filter((item) => matchesAudience(item, filter));
  }, [items, filter, showProgramsList]);

  const showKids = filter === "All" || filter === "Kids";
  const showYouth = filter === "All" || filter === "Youth";
  const showAdults = filter === "All" || filter === "Adults";

  return (
    <View>
      <View style={{ marginTop: 22 }}>
        <FilterPills active={filter} onSelect={setFilter} />
      </View>

      {showProgramsList ? (
        <>
          <ListSection
            label="All programs"
            items={programsForAudience}
            onPressItem={onPressItem}
          />
          <ListSection
            label="Weekly programs"
            items={programsForAudience.filter((item) => item.isWeekly)}
            onPressItem={onPressItem}
          />
        </>
      ) : (
        <>
          {showKids ? (
            <Section
              label="Kids"
              items={grouped.kids}
              onPressItem={onPressItem}
              onPressSeeAll={() => onPressSeeAll?.("Kids")}
            />
          ) : null}
          {showYouth ? (
            <Section
              label="Youth"
              items={grouped.youth}
              onPressItem={onPressItem}
              onPressSeeAll={() => onPressSeeAll?.("Youth")}
            />
          ) : null}
          {showAdults ? (
            <Section
              label="Adults"
              items={grouped.adults}
              onPressItem={onPressItem}
              onPressSeeAll={() => onPressSeeAll?.("Adults")}
            />
          ) : null}
        </>
      )}

      {filter === "All" && allTabFooter ? (
        <View className="px-6" style={{ marginTop: 24 }}>
          {allTabFooter}
        </View>
      ) : null}
    </View>
  );
}

import AntDesign from "@expo/vector-icons/AntDesign";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useFontFamily } from "@/src/hooks/use-font-family";
import { useMasjidConfig } from "@/src/hooks/use-masjid-config";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export type EventCalendarItem = {
  id: string;
  title: string;
  image?: { uri: string } | number;
  startDate: string | null;
  startTime: string | null;
  category: string | null;
};

type Mode = "Today" | "Upcoming";

type Props = {
  items: EventCalendarItem[];
  onPressItem: (id: string) => void;
};

function toIsoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromIsoDay(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

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

function buildMonthGrid(viewMonth: Date): Date[] {
  const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function MonthHeader({
  viewMonth,
  onPrev,
  onNext,
}: {
  viewMonth: Date;
  onPrev: () => void;
  onNext: () => void;
}) {
  const fonts = useFontFamily();
  const { colors } = useMasjidConfig();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ",")})`;

  return (
    <View className="flex-row items-center px-6" style={{ marginTop: 18 }}>
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
        {MONTH_NAMES[viewMonth.getMonth()]}
      </Text>
      <Pressable
        onPress={onPrev}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Previous month"
        style={{ marginRight: 22 }}
      >
        <AntDesign name="left" size={12} color={fgRgb} />
      </Pressable>
      <Pressable
        onPress={onNext}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Next month"
      >
        <AntDesign name="right" size={12} color={fgRgb} />
      </Pressable>
    </View>
  );
}

function DayCell({
  date,
  inMonth,
  selected,
  hasEvent,
  onPress,
}: {
  date: Date;
  inMonth: boolean;
  selected: boolean;
  hasEvent: boolean;
  onPress: () => void;
}) {
  const fonts = useFontFamily();
  const { colors } = useMasjidConfig();
  const primaryRgb = `rgb(${colors.primary.replace(/ /g, ",")})`;
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ",")})`;
  const bgRgb = `rgb(${colors.background.replace(/ /g, ",")})`;
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ",")})`;

  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 6,
      }}
      accessibilityRole="button"
      accessibilityLabel={date.toDateString()}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: selected ? primaryRgb : "transparent",
        }}
      >
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 12,
            textAlign: "center",
            color: selected ? bgRgb : fgRgb,
            opacity: inMonth ? 1 : 0.3,
          }}
        >
          {date.getDate()}
        </Text>
      </View>
      <View
        style={{
          width: 4,
          height: 4,
          borderRadius: 2,
          marginTop: 3,
          backgroundColor: hasEvent && !selected ? accentRgb : "transparent",
        }}
      />
    </Pressable>
  );
}

function CalendarGrid({
  viewMonth,
  selectedDate,
  eventDates,
  onSelect,
}: {
  viewMonth: Date;
  selectedDate: Date;
  eventDates: Set<string>;
  onSelect: (d: Date) => void;
}) {
  const fonts = useFontFamily();
  const { colors } = useMasjidConfig();
  const mutedFgRgb = `rgb(${colors.mutedForeground.replace(/ /g, ",")})`;

  const days = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <View className="px-6" style={{ marginTop: 14 }}>
      <View className="flex-row">
        {WEEKDAY_LABELS.map((w, i) => (
          <View
            key={`${w}-${i}`}
            style={{ flex: 1, alignItems: "center", paddingVertical: 4 }}
          >
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: 11,
                color: mutedFgRgb,
              }}
            >
              {w}
            </Text>
          </View>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} className="flex-row">
          {week.map((d) => (
            <DayCell
              key={d.toISOString()}
              date={d}
              inMonth={d.getMonth() === viewMonth.getMonth()}
              selected={sameDay(d, selectedDate)}
              hasEvent={eventDates.has(toIsoDay(d))}
              onPress={() => onSelect(d)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  const fonts = useFontFamily();
  const { colors } = useMasjidConfig();
  const primaryRgb = `rgb(${colors.primary.replace(/ /g, ",")})`;
  const bgRgb = `rgb(${colors.background.replace(/ /g, ",")})`;
  const mutedFgRgb = `rgb(${colors.mutedForeground.replace(/ /g, ",")})`;
  const mutedRgb = `rgb(${colors.muted.replace(/ /g, ",")})`;

  return (
    <View className="px-6" style={{ marginTop: 18 }}>
      <View
        className="flex-row items-center"
        style={{
          backgroundColor: mutedRgb,
          borderRadius: 999,
          padding: 3,
        }}
      >
        {(["Today", "Upcoming"] as const).map((m) => {
          const isActive = m === mode;
          return (
            <Pressable
              key={m}
              onPress={() => onChange(m)}
              className="flex-1 items-center justify-center"
              style={{
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: isActive ? primaryRgb : "transparent",
              }}
              accessibilityRole="button"
              accessibilityLabel={m}
            >
              <Text
                style={{
                  fontFamily: fonts.bodySemibold,
                  fontSize: 12,
                  fontWeight: "600",
                  color: isActive ? bgRgb : mutedFgRgb,
                }}
              >
                {m}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function EventRow({
  item,
  onPress,
  showDivider,
}: {
  item: EventCalendarItem;
  onPress: () => void;
  showDivider: boolean;
}) {
  const fonts = useFontFamily();
  const { colors } = useMasjidConfig();
  const fg = colors.foreground.replace(/ /g, ",");
  const fgRgb = `rgb(${fg})`;
  const mutedFgRgb = `rgb(${colors.mutedForeground.replace(/ /g, ",")})`;
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ",")})`;
  const mutedRgb = `rgb(${colors.muted.replace(/ /g, ",")})`;
  const rowDivider = `rgba(${fg}, 0.1)`;

  const time = formatTime(item.startTime);
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
              fontFamily: fonts.bodySemibold,
              fontSize: 13,
              fontWeight: "600",
              color: fgRgb,
              lineHeight: 16,
            }}
          >
            {item.title}
          </Text>
          {time || item.category ? (
            <Text
              numberOfLines={1}
              style={{
                fontFamily: fonts.body,
                fontSize: 11,
                lineHeight: 16,
                marginTop: 2,
              }}
            >
              {time ? <Text style={{ color: mutedFgRgb }}>{time}</Text> : null}
              {time && item.category ? (
                <Text style={{ color: mutedFgRgb }}> {"\u2022"} </Text>
              ) : null}
              {item.category ? (
                <Text style={{ color: accentRgb, fontWeight: "500" }}>
                  {item.category}
                </Text>
              ) : null}
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

function DayHeading({ date }: { date: Date }) {
  const fonts = useFontFamily();
  const { colors } = useMasjidConfig();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ",")})`;

  const label = `${WEEKDAY_NAMES[date.getDay()]}, ${
    MONTH_NAMES[date.getMonth()]
  } ${date.getDate()}`;
  return (
    <View className="px-6" style={{ marginTop: 22 }}>
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
  );
}

export default function EventsCalendar({ items, onPressItem }: Props) {
  const fonts = useFontFamily();
  const { colors } = useMasjidConfig();
  const mutedFgRgb = `rgb(${colors.mutedForeground.replace(/ /g, ",")})`;

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const [viewMonth, setViewMonth] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [mode, setMode] = useState<Mode>("Today");

  const eventDates = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.startDate) set.add(item.startDate);
    }
    return set;
  }, [items]);

  const selectedIso = toIsoDay(selectedDate);
  const dayItems = useMemo(
    () => items.filter((i) => i.startDate === selectedIso),
    [items, selectedIso],
  );

  const upcomingGroups = useMemo(() => {
    if (mode !== "Upcoming") return [];
    const filtered = items
      .filter((i) => i.startDate && i.startDate >= selectedIso)
      .sort((a, b) => (a.startDate! < b.startDate! ? -1 : 1));
    const groups: { date: string; items: EventCalendarItem[] }[] = [];
    for (const item of filtered) {
      const date = item.startDate!;
      const last = groups[groups.length - 1];
      if (last && last.date === date) last.items.push(item);
      else groups.push({ date, items: [item] });
    }
    return groups;
  }, [items, mode, selectedIso]);

  const goPrev = () =>
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  const goNext = () =>
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));

  // Swipe left/right on the grid to change months. activeOffsetX / failOffsetY
  // keep it from hijacking the page's vertical scroll.
  const gridX = useSharedValue(0);
  const monthSwipe = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-16, 16])
    .onUpdate((e) => {
      gridX.value = e.translationX * 0.3; // light rubber-band resistance
    })
    .onEnd((e) => {
      if (e.translationX > 50 || e.velocityX > 500) runOnJS(goPrev)();
      else if (e.translationX < -50 || e.velocityX < -500) runOnJS(goNext)();
      gridX.value = withTiming(0, { duration: 180 });
    });

  const gridStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: gridX.value }],
  }));

  // Swipe the list area to switch between Today / Upcoming.
  const modeSwipe = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-16, 16])
    .onEnd((e) => {
      if (e.translationX < -50 || e.velocityX < -500) runOnJS(setMode)("Upcoming");
      else if (e.translationX > 50 || e.velocityX > 500) runOnJS(setMode)("Today");
    });

  const handleSelect = (d: Date) => {
    setSelectedDate(d);
    if (
      d.getMonth() !== viewMonth.getMonth() ||
      d.getFullYear() !== viewMonth.getFullYear()
    ) {
      setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
    if (mode !== "Today") setMode("Today");
  };

  return (
    <View>
      <MonthHeader viewMonth={viewMonth} onPrev={goPrev} onNext={goNext} />
      <GestureDetector gesture={monthSwipe}>
        <Animated.View style={gridStyle}>
          <CalendarGrid
            viewMonth={viewMonth}
            selectedDate={selectedDate}
            eventDates={eventDates}
            onSelect={handleSelect}
          />
        </Animated.View>
      </GestureDetector>
      <ModeToggle mode={mode} onChange={setMode} />

      <GestureDetector gesture={modeSwipe}>
      <View style={{ overflow: "hidden" }}>
        {mode === "Today" ? (
          <Animated.View
            key="today"
            entering={SlideInLeft.duration(220)}
            exiting={SlideOutLeft.duration(220)}
          >
            <DayHeading date={selectedDate} />
            <View style={{ marginTop: 2 }}>
              {dayItems.length === 0 ? (
                <View className="px-6" style={{ paddingVertical: 24 }}>
                  <Text
                    style={{
                      fontFamily: fonts.body,
                      fontSize: 12,
                      color: mutedFgRgb,
                    }}
                  >
                    No events on this day.
                  </Text>
                </View>
              ) : (
                dayItems.map((item, idx) => (
                  <EventRow
                    key={item.id}
                    item={item}
                    onPress={() => onPressItem(item.id)}
                    showDivider={idx < dayItems.length - 1}
                  />
                ))
              )}
            </View>
          </Animated.View>
        ) : (
          <Animated.View
            key="upcoming"
            entering={SlideInRight.duration(220)}
            exiting={SlideOutRight.duration(220)}
          >
            {upcomingGroups.length === 0 ? (
              <View
                className="px-6"
                style={{ marginTop: 22, paddingVertical: 24 }}
              >
                <Text
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 12,
                    color: mutedFgRgb,
                  }}
                >
                  No upcoming events.
                </Text>
              </View>
            ) : (
              upcomingGroups.map((group) => (
                <View key={group.date}>
                  <DayHeading date={fromIsoDay(group.date)} />
                  <View style={{ marginTop: 2 }}>
                    {group.items.map((item, idx) => (
                      <EventRow
                        key={item.id}
                        item={item}
                        onPress={() => onPressItem(item.id)}
                        showDivider={idx < group.items.length - 1}
                      />
                    ))}
                  </View>
                </View>
              ))
            )}
          </Animated.View>
        )}
      </View>
      </GestureDetector>
    </View>
  );
}

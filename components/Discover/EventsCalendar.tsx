import AntDesign from "@expo/vector-icons/AntDesign";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import Animated, {
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from "react-native-reanimated";

const BUSH = "#0A261E";
const MUTED = "rgba(10,38,30,0.6)";
const GOLD = "#B8922A";
const SECTION_LINE = "#0A261E";
const ROW_DIVIDER = "rgba(10,38,30,0.1)";
const PILL_TRACK_BG = "#F1EDE4";
const CARD_PLACEHOLDER = "#EFEDE6";
const DAY_TEXT = "#333333";

const platformUiFont = Platform.select({
  ios: "SF Pro Text",
  android: "Roboto",
  default: "system-ui",
});

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
  // Monday-first: 0=Mon..6=Sun
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
  return (
    <View className="flex-row items-center px-6" style={{ marginTop: 18 }}>
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
        {MONTH_NAMES[viewMonth.getMonth()]}
      </Text>
      <Pressable
        onPress={onPrev}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Previous month"
        style={{ marginRight: 16 }}
      >
        <AntDesign name="left" size={12} color={BUSH} />
      </Pressable>
      <Pressable
        onPress={onNext}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Next month"
      >
        <AntDesign name="right" size={12} color={BUSH} />
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
          backgroundColor: selected ? BUSH : "transparent",
        }}
      >
        <Text
          style={{
            fontFamily: platformUiFont,
            fontSize: 12,
            color: selected ? "#FFFBF2" : DAY_TEXT,
            opacity: inMonth ? 1 : 0.3,
          }}
        >
          {String(date.getDate()).padStart(2, "0")}
        </Text>
      </View>
      <View
        style={{
          width: 4,
          height: 4,
          borderRadius: 2,
          marginTop: 3,
          backgroundColor: hasEvent && !selected ? GOLD : "transparent",
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
                fontFamily: platformUiFont,
                fontSize: 11,
                color: MUTED,
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
  return (
    <View className="px-6" style={{ marginTop: 18 }}>
      <View
        className="flex-row items-center"
        style={{
          backgroundColor: PILL_TRACK_BG,
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
                backgroundColor: isActive ? BUSH : "transparent",
              }}
              accessibilityRole="button"
              accessibilityLabel={m}
            >
              <Text
                style={{
                  fontFamily: platformUiFont,
                  fontSize: 12,
                  fontWeight: "600",
                  color: isActive ? "#FFFBF2" : MUTED,
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
          {time || item.category ? (
            <Text
              numberOfLines={1}
              style={{
                fontFamily: platformUiFont,
                fontSize: 11,
                lineHeight: 16,
                marginTop: 2,
              }}
            >
              {time ? <Text style={{ color: MUTED }}>{time}</Text> : null}
              {time && item.category ? (
                <Text style={{ color: MUTED }}> • </Text>
              ) : null}
              {item.category ? (
                <Text style={{ color: GOLD, fontWeight: "500" }}>
                  {item.category}
                </Text>
              ) : null}
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

function DayHeading({ date }: { date: Date }) {
  const label = `${WEEKDAY_NAMES[date.getDay()]}, ${
    MONTH_NAMES[date.getMonth()]
  } ${date.getDate()}`;
  return (
    <View className="px-6" style={{ marginTop: 22 }}>
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
  );
}

export default function EventsCalendar({ items, onPressItem }: Props) {
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
      <CalendarGrid
        viewMonth={viewMonth}
        selectedDate={selectedDate}
        eventDates={eventDates}
        onSelect={handleSelect}
      />
      <ModeToggle mode={mode} onChange={setMode} />

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
                      fontFamily: platformUiFont,
                      fontSize: 12,
                      color: MUTED,
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
                    fontFamily: platformUiFont,
                    fontSize: 12,
                    color: MUTED,
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
    </View>
  );
}

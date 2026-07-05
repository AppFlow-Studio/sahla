import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from "react-native-reanimated";

import { CalendarIcon, SearchIcon } from "./DiscoverIcons";
import { useFontFamily } from "@/src/hooks/use-font-family";
import { useMasjidConfig } from "@/src/hooks/use-masjid-config";

const TABS = ["All", "For You", "Events", "Programs"] as const;

type Tab = (typeof TABS)[number];

type Props = {
  title?: string;
  active?: Tab;
  onSelect?: (tab: Tab) => void;
  onPressCalendar?: () => void;
  searchValue?: string;
  onChangeSearch?: (value: string) => void;
};

const DURATION = 250;

export default function DiscoverHeader({
  title = "Discover",
  active = "All",
  onSelect,
  onPressCalendar,
  searchValue,
  onChangeSearch,
}: Props) {
  const fonts = useFontFamily();
  const { colors } = useMasjidConfig();
  const fg = colors.foreground.replace(/ /g, ",");
  const fgRgb = `rgb(${fg})`;
  const mutedFgRgb = `rgb(${colors.mutedForeground.replace(/ /g, ",")})`;
  const pillBg = `rgba(${fg}, 0.06)`;

  const [isSearching, setIsSearching] = useState(false);
  const [internalValue, setInternalValue] = useState("");
  const inputRef = useRef<TextInput>(null);
  const value = searchValue ?? internalValue;
  const setValue = (v: string) => {
    if (onChangeSearch) onChangeSearch(v);
    else setInternalValue(v);
  };

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(isSearching ? 1 : 0, { duration: DURATION });
    if (isSearching) {
      setTimeout(() => inputRef.current?.focus(), DURATION);
    }
  }, [isSearching, progress]);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4], [1, 0]),
    transform: [{ translateX: interpolate(progress.value, [0, 1], [0, -20]) }],
  }));

  const searchBarStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.3, 1], [0, 1]),
    transform: [{ translateX: interpolate(progress.value, [0, 1], [40, 0]) }],
  }));

  return (
    <View className="px-6 pt-6">
      <View className="flex-row items-center" style={{ height: 36 }}>
        {/* Left side: title / search bar crossfade */}
        <View style={{ flex: 1, height: 36, justifyContent: "center" }}>
          {/* Title */}
          <Animated.View
            style={[{ position: "absolute", left: 0, right: 0 }, titleStyle]}
            pointerEvents={isSearching ? "none" : "auto"}
          >
            <View className="flex-row items-center">
              <Text
                style={{
                  fontFamily: fonts.display,
                  fontSize: 30,
                  lineHeight: 36,
                  color: fgRgb,
                  flex: 1,
                }}
              >
                {title}
              </Text>
              <Pressable
                onPress={() => setIsSearching(true)}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Search"
                style={{ marginRight: 16, marginTop: 4 }}
              >
                {/* Bumped to 32pt so the visible magnifier glyph reads
                    the same size as the 24pt calendar. The Figma
                    export's 29×29 viewBox has ~40% empty padding around
                    the glyph, so a straight 24pt size looks smaller. */}
                <SearchIcon size={32} color={fgRgb} />
              </Pressable>
            </View>
          </Animated.View>

          {/* Search bar */}
          <Animated.View
            style={[
              {
                position: "absolute",
                left: 0,
                right: 0,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                height: 36,
              },
              searchBarStyle,
            ]}
            pointerEvents={isSearching ? "auto" : "none"}
          >
            <View
              className="flex-1 flex-row items-center rounded-full px-3"
              style={{ backgroundColor: pillBg, height: 36 }}
            >
              <SearchIcon size={18} color={mutedFgRgb} opacity={1} />
              <TextInput
                ref={inputRef}
                placeholder="Search..."
                placeholderTextColor={mutedFgRgb}
                value={value}
                onChangeText={setValue}
                onBlur={() => {
                  // Dismissing the keyboard with an empty field collapses the
                  // search bar back to the title. A typed query keeps the bar
                  // so results stay browsable without the keyboard.
                  if (!value) setIsSearching(false);
                }}
                returnKeyType="search"
                style={{
                  flex: 1,
                  marginLeft: 8,
                  fontFamily: fonts.body,
                  fontSize: 14,
                  color: fgRgb,
                  paddingVertical: 0,
                }}
              />
              {value.length > 0 ? (
                <Pressable
                  onPress={() => setValue("")}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <Text style={{ color: mutedFgRgb, fontSize: 14 }}>{"\u2715"}</Text>
                </Pressable>
              ) : null}
            </View>
            <Pressable
              onPress={() => {
                setIsSearching(false);
                setValue("");
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Cancel search"
              style={{ marginRight: 8 }}
            >
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 11,
                  color: fgRgb,
                }}
              >
                Cancel
              </Text>
            </Pressable>
          </Animated.View>
        </View>

        {/* Calendar button — always in place. Uses the exact Figma SVG
            (node 343:1750) so it matches design pixel-for-pixel; the
            search icon (Figma node 343:1641) matches likewise. Both are
            tinted with the tenant foreground so they theme correctly
            across masjids. */}
        <Pressable
          onPress={onPressCalendar}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Events calendar"
        >
          <CalendarIcon size={24} color={fgRgb} />
        </Pressable>
      </View>

      <View className="mt-4 flex-row items-center gap-4">
        {TABS.map((tab) => {
          const isActive = tab === active;
          return (
            <Pressable key={tab} onPress={() => onSelect?.(tab)}>
              <Text
                style={{
                  fontFamily: isActive ? fonts.bodySemibold : fonts.bodyMedium,
                  fontSize: 15,
                  fontWeight: isActive ? "600" : "500",
                  color: isActive ? fgRgb : mutedFgRgb,
                }}
              >
                {tab}
              </Text>
              {/* Underline space is always reserved (transparent when
                  inactive) so the label height never changes — the text
                  stays put instead of nudging up when a tab activates. */}
              <View
                className="self-stretch"
                style={{
                  height: 1,
                  marginTop: 4,
                  backgroundColor: isActive ? fgRgb : "transparent",
                }}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export type { Tab as DiscoverTab };

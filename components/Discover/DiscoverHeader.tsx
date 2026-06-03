import { useEffect, useRef, useState } from "react";
import { Image, Platform, Pressable, Text, TextInput, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from "react-native-reanimated";

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

const platformUiFont = Platform.select({
  ios: "SF Pro Text",
  android: "Roboto",
  default: "system-ui",
});

const DURATION = 250;

export default function DiscoverHeader({
  title = "Discover",
  active = "All",
  onSelect,
  onPressCalendar,
  searchValue,
  onChangeSearch,
}: Props) {
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
                  fontFamily: "PlayfairDisplay_500Medium",
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
                style={{ marginRight: 16 }}
              >
                <Image
                  source={require("@/assets/images/search_icon.png")}
                  style={{ width: 18, height: 18 }}
                  resizeMode="contain"
                />
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
              <Image
                source={require("@/assets/images/search_icon.png")}
                style={{ width: 16, height: 16, opacity: 0.6 }}
                resizeMode="contain"
              />
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
                  fontFamily: platformUiFont,
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
                  fontFamily: platformUiFont,
                  fontSize: 11,
                  color: fgRgb,
                }}
              >
                Cancel
              </Text>
            </Pressable>
          </Animated.View>
        </View>

        {/* Calendar button — always in place */}
        <Pressable
          onPress={onPressCalendar}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Events calendar"
        >
          <Image
            source={require("@/assets/images/discover_calendar_icon_next_to_search_bar.png")}
            style={{ width: 18, height: 18 }}
            resizeMode="contain"
          />
        </Pressable>
      </View>

      <View className="mt-4 flex-row items-center gap-4">
        {TABS.map((tab) => {
          const isActive = tab === active;
          return (
            <Pressable key={tab} onPress={() => onSelect?.(tab)}>
              <Text
                style={{
                  fontFamily: platformUiFont,
                  fontSize: 12,
                  fontWeight: isActive ? "600" : "500",
                  color: isActive ? fgRgb : mutedFgRgb,
                }}
              >
                {tab}
              </Text>
              {isActive ? (
                <View
                  className="mt-1 h-px w-4"
                  style={{ backgroundColor: fgRgb }}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export type { Tab as DiscoverTab };

import { useState } from "react";
import { Image, Platform, Pressable, Text, TextInput, View } from "react-native";

const BUSH = "#0A261E";
const MUTED = "rgba(10,38,30,0.6)";
const PILL_BG = "rgba(10,38,30,0.06)";
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

export default function DiscoverHeader({
  title = "Discover",
  active = "All",
  onSelect,
  onPressCalendar,
  searchValue,
  onChangeSearch,
}: Props) {
  const [isSearching, setIsSearching] = useState(false);
  const [internalValue, setInternalValue] = useState("");
  const value = searchValue ?? internalValue;
  const setValue = (v: string) => {
    if (onChangeSearch) onChangeSearch(v);
    else setInternalValue(v);
  };

  return (
    <View className="px-6 pt-6">
      {isSearching ? (
        <View className="flex-row items-center gap-3" style={{ height: 36 }}>
          <View
            className="flex-1 flex-row items-center rounded-full px-3"
            style={{ backgroundColor: PILL_BG, height: 36 }}
          >
            <Image
              source={require("@/assets/images/search_icon.png")}
              style={{ width: 16, height: 16, opacity: 0.6 }}
              resizeMode="contain"
            />
            <TextInput
              autoFocus
              placeholder="Search..."
              placeholderTextColor={MUTED}
              value={value}
              onChangeText={setValue}
              returnKeyType="search"
              style={{
                flex: 1,
                marginLeft: 8,
                fontFamily: platformUiFont,
                fontSize: 14,
                color: BUSH,
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
                <Text style={{ color: MUTED, fontSize: 14 }}>✕</Text>
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
          >
            <Text
              style={{
                fontFamily: platformUiFont,
                fontSize: 14,
                color: BUSH,
              }}
            >
              Cancel
            </Text>
          </Pressable>
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
      ) : (
        <View
          className="flex-row items-center justify-between"
          style={{ minHeight: 36 }}
        >
          <Text
            style={{
              fontFamily: "PlayfairDisplay_500Medium",
              fontSize: 30,
              lineHeight: 36,
              color: BUSH,
            }}
          >
            {title}
          </Text>
          <View className="flex-row items-center gap-4">
            <Pressable
              onPress={() => setIsSearching(true)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Search"
            >
              <Image
                source={require("@/assets/images/search_icon.png")}
                style={{ width: 18, height: 18 }}
                resizeMode="contain"
              />
            </Pressable>
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
        </View>
      )}

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
                  color: isActive ? BUSH : MUTED,
                }}
              >
                {tab}
              </Text>
              {isActive ? (
                <View
                  className="mt-1 h-px w-4"
                  style={{ backgroundColor: BUSH }}
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

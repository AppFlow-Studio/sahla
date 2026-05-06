import AntDesign from "@expo/vector-icons/AntDesign";
import { Platform, Pressable, Text, View } from "react-native";

const BUSH = "#0A261E";
const MUTED = "rgba(10,38,30,0.6)";
const TABS = ["All", "For You", "Events", "Programs"] as const;

type Tab = (typeof TABS)[number];

type Props = {
  title?: string;
  active?: Tab;
  onSelect?: (tab: Tab) => void;
  onPressSearch?: () => void;
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
  onPressSearch,
}: Props) {
  return (
    <View className="px-6 pt-2">
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

      <View className="mt-4 flex-row items-center">
        <View className="flex-row items-center gap-4 flex-1">
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
        <Pressable
          onPress={onPressSearch}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Search"
        >
          <AntDesign name="search" size={18} color={BUSH} />
        </Pressable>
      </View>
    </View>
  );
}

export type { Tab as DiscoverTab };

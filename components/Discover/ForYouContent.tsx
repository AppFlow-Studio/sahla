import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { Platform, Pressable, Text, View } from "react-native";

import { useMasjidConfig } from "@/src/hooks/use-masjid-config";

const platformUiFont = Platform.select({
  ios: "SF Pro Text",
  android: "Roboto",
  default: "system-ui",
});

export type ForYouRowItem = {
  id: string;
  title: string;
  speaker: string | null;
  category: string | null;
  image?: { uri: string } | number;
};

type Props = {
  events: ForYouRowItem[];
  programs: ForYouRowItem[];
  onPressItem: (id: string) => void;
  onPressEdit?: () => void;
};

function CustomizedPill({ onPress }: { onPress?: () => void }) {
  const { colors } = useMasjidConfig();
  const fg = colors.foreground.replace(/ /g, ",");
  const fgRgb = `rgb(${fg})`;
  const mutedFgRgb = `rgb(${colors.mutedForeground.replace(/ /g, ",")})`;
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ",")})`;
  const accent = colors.accent.replace(/ /g, ",");
  const pillBg = `rgba(${accent}, 0.2)`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Edit your preferences"
      className="flex-row items-center rounded-full px-4 py-3"
      style={{ backgroundColor: pillBg }}
    >
      <Feather name="sun" size={18} color={accentRgb} />
      <View className="ml-3 flex-1">
        <Text
          style={{
            fontFamily: platformUiFont,
            fontSize: 12,
            fontWeight: "600",
            color: fgRgb,
            lineHeight: 16,
          }}
        >
          Customized for you
        </Text>
        <Text
          style={{
            fontFamily: platformUiFont,
            fontSize: 11,
            color: mutedFgRgb,
            lineHeight: 14,
            marginTop: 2,
          }}
        >
          Based on your preferences
        </Text>
      </View>
      <Text
        style={{
          fontFamily: platformUiFont,
          fontSize: 12,
          color: accentRgb,
          marginRight: 4,
        }}
      >
        Edit
      </Text>
      <AntDesign name="right" size={10} color={accentRgb} />
    </Pressable>
  );
}

function SectionHeading({ label }: { label: string }) {
  const { colors } = useMasjidConfig();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ",")})`;

  return (
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
  );
}

function Row({
  item,
  onPress,
  showDivider,
}: {
  item: ForYouRowItem;
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
          <Text
            numberOfLines={1}
            style={{
              fontFamily: platformUiFont,
              fontSize: 11,
              lineHeight: 16,
              marginTop: 2,
            }}
          >
            {item.speaker ? (
              <Text style={{ color: mutedFgRgb }}>{item.speaker}</Text>
            ) : null}
            {item.speaker && item.category ? (
              <Text style={{ color: mutedFgRgb }}> {"\u2022"} </Text>
            ) : null}
            {item.category ? (
              <Text style={{ color: accentRgb, fontWeight: "500" }}>
                {item.category}
              </Text>
            ) : null}
          </Text>
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

export default function ForYouContent({
  events,
  programs,
  onPressItem,
  onPressEdit,
}: Props) {
  return (
    <View>
      <View className="px-6" style={{ marginTop: 33 }}>
        <CustomizedPill onPress={onPressEdit} />
      </View>

      {events.length > 0 ? (
        <View className="mt-7">
          <SectionHeading label="Events for you" />
          <View className="mt-2">
            {events.map((item, idx) => (
              <Row
                key={item.id}
                item={item}
                onPress={() => onPressItem(item.id)}
                showDivider={idx < events.length - 1}
              />
            ))}
          </View>
        </View>
      ) : null}

      {programs.length > 0 ? (
        <View className="mt-7">
          <SectionHeading label="Programs for you" />
          <View className="mt-2">
            {programs.map((item, idx) => (
              <Row
                key={item.id}
                item={item}
                onPress={() => onPressItem(item.id)}
                showDivider={idx < programs.length - 1}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

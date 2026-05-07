import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import AntDesign from "@expo/vector-icons/AntDesign";
type Props = {
  onPress: () => void;
};

const platformUiFont = Platform.select({
  ios: "SF Pro Text",
  android: "Roboto",
  default: "system-ui",
});

export default function DonateCard({ onPress }: Props) {
  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel="Support your masjid"
      className="w-full flex-row items-center justify-between rounded-full bg-[#0A261E] px-5 py-5 z-10"
    >
      <View className="flex-row items-center gap-2">
        <View className="relative h-10 w-10 overflow-hidden rounded-full bg-[#B8922A33]">
          {/* Neumorphic-style rim: soft highlight top-left + soft shadow bottom-right */}
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.38)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.7, y: 0.7 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <LinearGradient
            colors={["transparent", "rgba(0, 0, 0, 0.22)"]}
            start={{ x: 0.25, y: 0.25 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View
            className="absolute inset-0 items-center justify-center"
            pointerEvents="none"
          >
            <Image
              source={require("@/assets/images/heart.png")}
              style={{ width: 16, height: 16 }}
              contentFit="contain"
              tintColor="#B8922A"
            />
          </View>
        </View>
        <View className="flex-col items-start gap-1 ml-2">
          <Text
            style={{
              fontFamily: platformUiFont,
              fontWeight: "700",
              fontSize: 14,
              lineHeight: 14,
              letterSpacing: 0,
              color: "#F0EDE6",
            }}
          >
            Support Your Masjid
          </Text>
          <Text
            style={{
              fontFamily: platformUiFont,
              fontWeight: "500",
              fontSize: 10,
              lineHeight: 10,
              letterSpacing: 0,
              color: "rgba(240, 237, 230, 0.55)",
            }}
          >
            Donate
          </Text>
        </View>
      </View>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Donate"
        hitSlop={8}
        className="ml-2 mt-1.5 flex-row items-center gap-1 rounded-full bg-[#B8922A] px-[14px] py-[7px] justify-center"
      >
        <Text
          style={{
            fontFamily: "Inter_800ExtraBold",
            fontWeight: "800",
            fontSize: 11,
            lineHeight: 11,
            color: "#0A261E",
            marginTop: 1,
            marginLeft: 0.5,
          }}
          className="text-center"
        >
          DONATE
        </Text>
        <AntDesign name="arrow-right" size={13} color="#0A261E"
        />
      </Pressable>
    </View>
  );
}

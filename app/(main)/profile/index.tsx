import ProfileBody from "@/components/profile/ProfileBody";
import ProfileHeader from "@/components/profile/ProfileHeader";
import { useDonation } from "@/src/providers/donation-provider";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Linking, Platform, ScrollView, View } from "react-native";

export default function ProfileScreen() {
  const { open: openDonate } = useDonation();
  const router = useRouter();

  return (
    <View className="flex-1" style={{ backgroundColor: "#0D2B1A" }}>
      <Image
        source={require("@/assets/images/islamic-pattern.png")}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 340,
          opacity: 0.18,
        }}
        contentFit="cover"
        pointerEvents="none"
      />
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: "transparent" }}
        contentInsetAdjustmentBehavior={
          Platform.OS === "ios" ? "never" : undefined
        }
      >
        <View className="w-full">
          <ProfileHeader />
          <ProfileBody
            onPressPersonalized={() => router.push("/(personalization)/reasons")}
            onPressDonate={openDonate}
            onPressNotifications={() => Linking.openSettings()}
          />
        </View>
      </ScrollView>
    </View>
  );
}

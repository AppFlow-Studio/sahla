import ProfileBody from "@/components/profile/ProfileBody";
import ProfileHeader from "@/components/profile/ProfileHeader";
import { useDonation } from "@/src/providers/donation-provider";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Platform, ScrollView, View } from "react-native";

import { useEnableNotifications } from "@/src/hooks/use-notification-status";
import { useStatusBarStyle } from "@/src/hooks/use-status-bar-style";

export default function ProfileScreen() {
  const { open: openDonate } = useDonation();
  const router = useRouter();
  const enableNotifications = useEnableNotifications();

  useStatusBarStyle("dark");

  return (
    <View className="flex-1 bg-depth">
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
        bounces={false}
        overScrollMode="never"
        contentInsetAdjustmentBehavior={
          Platform.OS === "ios" ? "never" : undefined
        }
      >
        <View className="w-full ">
          <ProfileHeader />
          <ProfileBody
            onPressPersonalized={() => router.push("/(personalization)/reasons")}
            onPressNotifications={enableNotifications}
          />
        </View>
      </ScrollView>
    </View>
  );
}

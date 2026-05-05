import ProfileBody from "@/components/profile/ProfileBody";
import ProfileHeader from "@/components/profile/ProfileHeader";
import { Image } from "expo-image";
import { Linking, Platform, ScrollView, View } from "react-native";

export default function ProfileScreen() {
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
        <View className="w-full">
          <ProfileHeader />
          <ProfileBody
            onPressPersonalized={() => {}}
            onPressNotifications={() => Linking.openSettings()}
          />
        </View>
      </ScrollView>
    </View>
  );
}

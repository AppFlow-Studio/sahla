import ProfileBody from "@/components/profile/ProfileBody";
import ProfileHeader from "@/components/profile/ProfileHeader";
import { Linking, Platform, ScrollView, View } from "react-native";

export default function ProfileScreen() {
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior={
        Platform.OS === "ios" ? "never" : undefined
      }
    >
      <View className="w-full bg-[#0A261E]">
        <ProfileHeader />
        <ProfileBody
          onPressPersonalized={() => {}}
          onPressDonate={() => {}}
          onPressNotifications={() => Linking.openSettings()}
        />
      </View>
    </ScrollView>
  );
}

import ProfileBody from "@/components/profile/ProfileBody";
import ProfileHeader from "@/components/profile/ProfileHeader";
import { Linking, Platform, ScrollView, View } from "react-native";

export default function ProfileScreen() {
  return (
    <View className="flex-1 bg-primary">
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
            onPressPersonalized={() => {}}
            onPressDonate={() => {}}
            onPressNotifications={() => Linking.openSettings()}
          />
        </View>
      </ScrollView>
    </View>
  );
}

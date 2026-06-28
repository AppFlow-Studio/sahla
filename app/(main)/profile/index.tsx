import EditProfileSheet from "@/components/profile/EditProfileSheet";
import ProfileBody from "@/components/profile/ProfileBody";
import ProfileHeader from "@/components/profile/ProfileHeader";
import { useDonation } from "@/src/providers/donation-provider";
import { useSetupCompleteness } from "@/src/hooks/use-setup-completeness";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Linking, Platform, ScrollView, View } from "react-native";

import { useStatusBarStyle } from "@/src/hooks/use-status-bar-style";

export default function ProfileScreen() {
  const { open: openDonate } = useDonation();
  const router = useRouter();
  const setup = useSetupCompleteness();
  // EditProfileSheet lifted from ProfileHeader so both the header's
  // Edit/Complete buttons and the body's new Profile setup row drive a
  // single instance.
  const [editVisible, setEditVisible] = useState(false);

  useStatusBarStyle("dark");

  const openPersonalization = useCallback(
    () => router.push("/(personalization)/reasons"),
    [router],
  );
  const openNotificationSettings = useCallback(
    () => Linking.openSettings(),
    [],
  );
  const openEditProfile = useCallback(() => setEditVisible(true), []);

  // "Complete Profile" header CTA routes to the first outstanding step in
  // priority order: profile fields → personalization → notifications.
  const handlePressCompleteProfile = useCallback(() => {
    switch (setup.firstIncomplete) {
      case 'profile':
        openEditProfile();
        return;
      case 'personalization':
        openPersonalization();
        return;
      case 'notifications':
        openNotificationSettings();
        return;
      default:
        // All complete — CTA shouldn't be visible, but guard anyway.
        openEditProfile();
    }
  }, [setup.firstIncomplete, openEditProfile, openPersonalization, openNotificationSettings]);

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
          <ProfileHeader
            onPressEdit={openEditProfile}
            onPressCompleteProfile={handlePressCompleteProfile}
          />
          <ProfileBody
            onPressPersonalized={openPersonalization}
            onPressNotifications={openNotificationSettings}
            onPressCompleteProfile={openEditProfile}
          />
        </View>
      </ScrollView>
      <EditProfileSheet visible={editVisible} onClose={() => setEditVisible(false)} />
    </View>
  );
}

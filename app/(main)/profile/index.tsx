import EditProfileSheet from "@/components/profile/EditProfileSheet";
import ProfileBody from "@/components/profile/ProfileBody";
import ProfileHeader from "@/components/profile/ProfileHeader";
import { useDonation } from "@/src/providers/donation-provider";
import { useSetupCompleteness } from "@/src/hooks/use-setup-completeness";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Platform, ScrollView, View } from "react-native";

import { useEnableNotifications } from "@/src/hooks/use-notification-status";
import { useScrollAwareStatusBar } from "@/src/hooks/use-status-bar-style";
import { useMasjidConfig } from "@/src/hooks/use-masjid-config";

export default function ProfileScreen() {
  const { open: openDonate } = useDonation();
  const router = useRouter();
  const setup = useSetupCompleteness();
  const enableNotifications = useEnableNotifications();
  // EditProfileSheet lifted from ProfileHeader so both the header's
  // Edit/Complete buttons and the body's Profile setup row drive one instance.
  const [editVisible, setEditVisible] = useState(false);

  // ProfileHeader paints its top area with the tenant's `primary`, then
  // ProfileBody starts a light `background` region. The scroll-aware
  // status bar flips icons as the light body climbs under the status bar.
  const { colors: masjidColors } = useMasjidConfig();
  const statusBar = useScrollAwareStatusBar({
    topSurface: masjidColors.primary,
    bottomSurface: masjidColors.background,
  });

  const openPersonalization = useCallback(
    () => router.push("/(personalization)/reasons"),
    [router],
  );
  const openEditProfile = useCallback(() => setEditVisible(true), []);

  // "Complete Profile" header CTA routes to the first outstanding step in
  // priority order: profile fields → personalization → notifications. (The CTA
  // itself gates on profile fields, so in practice this hits the profile case.)
  const handlePressCompleteProfile = useCallback(() => {
    switch (setup.firstIncomplete) {
      case 'personalization':
        openPersonalization();
        return;
      case 'notifications':
        void enableNotifications();
        return;
      case 'profile':
      default:
        openEditProfile();
    }
  }, [setup.firstIncomplete, openEditProfile, openPersonalization, enableNotifications]);

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
        onScroll={statusBar.onScroll}
        scrollEventThrottle={16}
      >
        <View className="w-full ">
          <ProfileHeader
            onPressEdit={openEditProfile}
            onPressCompleteProfile={handlePressCompleteProfile}
          />
          {/* Wrap ProfileBody so we can measure where the light bg region
              begins — the scroll-aware status bar flips icons once this
              boundary climbs above the safe-area top. */}
          <View onLayout={statusBar.onLayoutBottomSurface}>
            <ProfileBody
              onPressPersonalized={openPersonalization}
              onPressNotifications={enableNotifications}
              onPressCompleteProfile={openEditProfile}
            />
          </View>
        </View>
      </ScrollView>
      <EditProfileSheet visible={editVisible} onClose={() => setEditVisible(false)} />
    </View>
  );
}

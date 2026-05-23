import { SendFeedback } from "@/src/components/send_feedback";
import { useMasjidConfig } from "@/src/hooks/use-masjid-config";
import { router, type Href } from "expo-router";
import { useCallback, useState } from "react";
import { Platform, Share, View } from "react-native";
import DonateCard from "./DonateCard";
import Notifications from "./Notifications";
import PersonalizedCard from "./PersonalizedCard";
import RowItem from "./RowItem";
import SectionHeader from "./SectionHeader";

const COMMUNITY_ICON = require("@/assets/images/Vector_addfriends.png");
const SAVED_PROGRAMS_AND_EVENTS_ICON = require("@/assets/images/Saved_Programgs_and_events.png");
const SAVED_CLIPS_ICON = require("@/assets/images/saved_clips.png");
const PAYMENT_HISTORY_ICON = require("@/assets/images/Payment_history.png");
const PAYMENT_METHODS_ICON = require("@/assets/images/Payment_Methods.png");
const PRAYER_ALERTS_ICON = require("@/assets/images/Bell_Ring.png");
const PROGRAMS_ICON = require("@/assets/images/Programs.png");
const EVENTS_ICON = require("@/assets/images/Events.png");
const MAS_BAG_ICON = require("@/assets/images/Mas_bag.png");
const APPLICATION_ICON = require("@/assets/images/Start_Application.png");
const CHECK_STATUS_ICON = require("@/assets/images/check_status2.png");
const MANAGE_SUBS_ICON = require("@/assets/images/Manage_subs.png");
const FEEDBACK_ICON = require("@/assets/images/feedback.png");
const ADMIN_ICON = require("@/assets/images/Admin_Portal.png");

type Props = {
  onPressPersonalized: () => void;
  onPressDonate: () => void;
  onPressNotifications: () => void;
};

function SectionRule() {
  return <View className="w-full border-t border-[#0A261E1A] pt-2" />;
}

export default function ProfileBody({
  onPressPersonalized,
  onPressDonate,
  onPressNotifications,
}: Props) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const config = useMasjidConfig();

  const handleInviteFriends = useCallback(async () => {
    try {
      // TODO: replace with the real download URL once we have an App Store /
      // landing-page link. The share sheet works fine with text alone, but a
      // URL gives recipients something to tap.
      await Share.share({
        message: `Join me at ${config.displayName} on Sahla — https://sahla.app`,
        url: 'https://sahla.app',
      });
    } catch {
      // User dismissed or platform error — nothing actionable to show.
    }
  }, [config.displayName]);

  return (
    <View
      className="-mt-4 w-full flex-col rounded-t-[32px] bg-[#FFFBF2] px-4 pt-6"
      style={{
        zIndex: 1,
        ...(Platform.OS === "android" ? { elevation: 3 } : {}),
      }}
    >
      <PersonalizedCard onPress={onPressPersonalized} />
      <View className="flex-col">
        <SectionHeader title="COMMUNITY" />
        <View className="pl-4">
          <RowItem
            icon={COMMUNITY_ICON}
            title="Invite friends"
            onPress={handleInviteFriends}
          />
        </View>
      </View>
      <View className="flex-col">
        <SectionHeader title="MY ACTIVITY" />
        <View className="pl-4">
          <RowItem
            icon={SAVED_PROGRAMS_AND_EVENTS_ICON}
            title="Saved Programs & Events"
            onPress={() => router.push("/profile/saved-events" as Href)}
          />
          <RowItem
            icon={SAVED_CLIPS_ICON}
            title="Saved Clips"
            onPress={() => router.push("/profile/saved-clips" as Href)}
          />
          <RowItem
            icon={PAYMENT_HISTORY_ICON}
            title="Payment History"
            onPress={() => {}}
          />
          <RowItem
            icon={PAYMENT_METHODS_ICON}
            title="Payment Methods"
            onPress={() => {}}
          />
        </View>
      </View>
      <View className="my-6">
        <DonateCard onPress={onPressDonate} />
      </View>
      <View className="flex-col gap-2">
        <SectionHeader title="NOTIFICATIONS" />
        <Notifications onEnablePress={onPressNotifications} />
        <View className="flex-col pl-4">
          <RowItem
            icon={PRAYER_ALERTS_ICON}
            title="Prayer Alerts"
            onPress={() => router.push("/profile/notification-center" as Href)}
          />
          <RowItem
            icon={PROGRAMS_ICON}
            title="Programs"
            onPress={() =>
              router.push("/profile/notification-center?tab=Programs" as Href)
            }
          />
          <RowItem icon={EVENTS_ICON} title="Events" onPress={() => {}} />
        </View>
        <SectionRule />
      </View>
      <View className="flex-col">
        <SectionHeader title="MAS SHOP" />
        <View className="pl-4">
          <RowItem
            icon={MAS_BAG_ICON}
            title="Programs / Events Shop"
            onPress={() => {}}
          />
        </View>
        <SectionRule />
      </View>
      <View className="flex-col">
        <SectionHeader title="BUSINESS ADS" />
        <View className="pl-4">
          <RowItem
            icon={APPLICATION_ICON}
            title="Start an Application"
            onPress={() => {}}
          />
          <RowItem
            icon={CHECK_STATUS_ICON}
            title="Check the Status"
            onPress={() => {}}
          />
          <RowItem
            icon={MANAGE_SUBS_ICON}
            title="Manage Subscriptions"
            onPress={() => {}}
          />
        </View>
        <SectionRule />
      </View>
      <View className="flex-col">
        <SectionHeader title="LEAVE A COMMENT" />
        <View className="pl-4">
          <RowItem
            icon={FEEDBACK_ICON}
            title="Send Feedback"
            onPress={() => setFeedbackOpen(true)}
          />
        </View>
        <SectionRule />
      </View>
      <View className="flex-col pb-6">
        <SectionHeader title="ADMIN" />
        <View className="pl-4">
          <RowItem icon={ADMIN_ICON} title="Admin Portal" onPress={() => {}} />
        </View>
      </View>
      <SendFeedback
        visible={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </View>
  );
}

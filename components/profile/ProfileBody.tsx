import { SendFeedback } from "@/src/components/send_feedback";
import { useIsAdmin } from "@/src/hooks/use-is-admin";
import { useMasjidConfig } from "@/src/hooks/use-masjid-config";
import { useSupabase } from "@/src/hooks/use-supabase";
import { useOnboardingStore } from "@/src/stores/onboarding-store";
import { useAuth } from "@clerk/clerk-expo";
import { router, type Href } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, Share, Text, View } from "react-native";
import DonateCard from "./DonateCard";
import Notifications from "./Notifications";
import PersonalizedCard from "./PersonalizedCard";
import RowItem from "./RowItem";
import SectionHeader from "./SectionHeader";

const APP_STORE_URL = "https://apps.apple.com/app/sahla/id0000000000"; // TODO: replace with real App Store URL

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
  onPressNotifications: () => void;
};

function SectionRule() {
  return <View className="w-full border-t border-foreground/10" style={{ marginTop: 4 }} />;
}

function SignOutButton() {
  const { signOut } = useAuth();
  const resetOnboarding = useOnboardingStore((s) => s.reset);

  return (
    <Pressable
      onPress={async () => {
        resetOnboarding();
        await signOut();
      }}
      className="rounded-full border border-red-500/30 px-8 py-3 active:opacity-70"
    >
      <Text className="text-red-500" style={{ fontSize: 14, fontWeight: '600' }}>
        Sign Out
      </Text>
    </Pressable>
  );
}

function DeleteAccountButton() {
  const { signOut } = useAuth();
  const supabase = useSupabase();
  const resetOnboarding = useOnboardingStore((s) => s.reset);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = useCallback(() => {
    Alert.alert(
      "Delete Account",
      "This permanently deletes your Sahla account and all your data — saved items, preferences, notifications, and history. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              const { error } = await supabase.functions.invoke("delete-account", {
                body: {},
              });
              if (error) throw error;
              resetOnboarding();
              await signOut();
            } catch (err: any) {
              setDeleting(false);
              Alert.alert(
                "Couldn't delete account",
                err?.message || "Something went wrong. Please try again or contact support.",
              );
            }
          },
        },
      ],
    );
  }, [supabase, resetOnboarding, signOut]);

  return (
    <Pressable
      onPress={confirmDelete}
      disabled={deleting}
      className="mt-4 flex-row items-center active:opacity-70"
      style={{ opacity: deleting ? 0.5 : 1 }}
    >
      {deleting && <ActivityIndicator size="small" color="#9ca3af" style={{ marginRight: 8 }} />}
      <Text className="text-foreground/40" style={{ fontSize: 13, fontWeight: '500' }}>
        {deleting ? "Deleting…" : "Delete Account"}
      </Text>
    </Pressable>
  );
}

export default function ProfileBody({
  onPressPersonalized,
  onPressNotifications,
}: Props) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const config = useMasjidConfig();
  const { isAdmin } = useIsAdmin();

  const handleInviteFriends = useCallback(async () => {
    try {
      await Share.share({
        message: `Join me at ${config.displayName} on Sahla — ${APP_STORE_URL}`,
        url: APP_STORE_URL,
      });
    } catch {
      // User dismissed or platform error — nothing actionable to show.
    }
  }, [config.displayName]);

  return (
    <View
      className="w-full flex-col rounded-t-[48px] bg-card px-5 pt-6"
      style={{
        marginTop: -36,
        zIndex: 1,
        ...(Platform.OS === "android" ? { elevation: 3 } : {}),
      }}
    >
      <PersonalizedCard onPress={onPressPersonalized} />

      {/* COMMUNITY */}
      <View className="flex-col">
        <SectionHeader title="COMMUNITY" />
        <View
          style={{
            borderWidth: 0.5,
            borderColor: `rgba(${config.colors.foreground.replace(/ /g, ',')}, 0.1)`,
            borderStyle: 'dashed',
            borderRadius: 14,
          }}
        >
          <RowItem
            icon={COMMUNITY_ICON}
            title="Invite friends"
            onPress={handleInviteFriends}
          />
        </View>
      </View>

      {/* MY ACTIVITY */}
      <View className="flex-col">
        <SectionHeader title="MY ACTIVITY" />
        <View>
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
            onPress={() => router.push('/profile/payment-history')}
          />
          <RowItem
            icon={PAYMENT_METHODS_ICON}
            title="Payment Methods"
            onPress={() => router.push('/profile/payment-methods')}
          />
        </View>
      </View>

      {/* DONATE */}
      <View style={{ marginVertical: 20 }}>
        <DonateCard />
      </View>

      {/* NOTIFICATIONS */}
      <View className="flex-col gap-2">
        <SectionHeader title="NOTIFICATIONS" />
        <Notifications onEnablePress={onPressNotifications} />
        <View className="flex-col">
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
          <RowItem
            icon={EVENTS_ICON}
            title="Events"
            onPress={() =>
              router.push("/profile/notification-center?tab=Events" as Href)
            }
          />
        </View>
        <SectionRule />
      </View>

      {/* MAS SHOP */}
      <View className="flex-col">
        <SectionHeader title="SHOP" />
        <View>
          <RowItem
            icon={MAS_BAG_ICON}
            title="Programs / Events Shop"
            onPress={() => {}}
          />
        </View>
        <SectionRule />
      </View>

      {/* BUSINESS ADS */}
      <View className="flex-col">
        <SectionHeader title="BUSINESS ADS" />
        <View>
          <RowItem
            icon={APPLICATION_ICON}
            title="Start an Application"
            onPress={() => router.push("/advertise" as Href)}
          />
          <RowItem
            icon={CHECK_STATUS_ICON}
            title="Check the Status"
            onPress={() => router.push("/advertise-status" as Href)}
          />
          <RowItem
            icon={MANAGE_SUBS_ICON}
            title="Manage Subscriptions"
            onPress={() => router.push("/advertise-status" as Href)}
          />
        </View>
        <SectionRule />
      </View>

      {/* LEAVE A COMMENT */}
      <View className="flex-col">
        <SectionHeader title="LEAVE A COMMENT" />
        <View>
          <RowItem
            icon={FEEDBACK_ICON}
            title="Send Feedback"
            onPress={() => setFeedbackOpen(true)}
          />
        </View>
        <SectionRule />
      </View>

      {/* ADMIN */}
      {isAdmin && (
        <View className="flex-col">
          <SectionHeader title="ADMIN" />
          <View>
            <RowItem
              icon={ADMIN_ICON}
              title="Admin Portal"
              onPress={() => router.push("/profile/admin" as Href)}
            />
          </View>
          <SectionRule />
        </View>
      )}

      {/* SIGN OUT */}
      <View className="items-center" style={{ paddingBottom: 120, paddingTop: 20 }}>
        <SignOutButton />
        <DeleteAccountButton />
      </View>
      <SendFeedback
        visible={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </View>
  );
}

import { SendFeedback } from "@/src/components/send_feedback";
import { useAppUpdates } from "@/src/hooks/use-app-updates";
import { useAppVersion } from "@/src/hooks/use-app-version";
import { useIsAdmin } from "@/src/hooks/use-is-admin";
import { useMasjidConfig } from "@/src/hooks/use-masjid-config";
import { useFontFamily } from '@/src/hooks/use-font-family';
import { useSupabase } from "@/src/hooks/use-supabase";
import { useOnboardingStore } from "@/src/stores/onboarding-store";
import { useUpdatesActions } from "@/src/providers/updates-provider";
import { useAuth } from "@clerk/clerk-expo";
import { router, type Href } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Platform, Pressable, Share, Text, View } from "react-native";
import DonateCard from "./DonateCard";
import LanguageRow from "./LanguageRow";
import Notifications from "./Notifications";
import PersonalizedCard from "./PersonalizedCard";
import RowItem from "./RowItem";
import SectionHeader from "./SectionHeader";

const APP_STORE_URL = "https://apps.apple.com/app/sahla/id0000000000"; // TODO: replace with real App Store URL

// Profile menu row icons, mapped to the shared Lucide registry (src/components/ui/icon.tsx).
const COMMUNITY_ICON = "user-plus";
const SAVED_PROGRAMS_AND_EVENTS_ICON = "calendar-heart";
const SAVED_CLIPS_ICON = "clapperboard";
const PAYMENT_HISTORY_ICON = "receipt-outline";
const PAYMENT_METHODS_ICON = "card-outline";
const PRAYER_ALERTS_ICON = "bell";
const PROGRAMS_ICON = "graduation-cap";
const EVENTS_ICON = "calendar-outline";
const MAS_BAG_ICON = "shopping-bag";
const APPLICATION_ICON = "file-text";
const CHECK_STATUS_ICON = "clipboard-check";
const MANAGE_SUBS_ICON = "repeat";
const FEEDBACK_ICON = "message-outline";
const ADMIN_ICON = "shield";

type Props = {
  onPressPersonalized: () => void;
  onPressNotifications: () => void;
};

function SectionRule() {
  return <View className="w-full border-t border-foreground/10" style={{ marginTop: 4 }} />;
}

function SignOutButton() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const resetOnboarding = useOnboardingStore((s) => s.reset);

  return (
    <Pressable
      onPress={async () => {
        // Sign out first: once isSignedIn flips false the auth guard wins
        // regardless of onboarding state. Resetting onboarding before signOut
        // resolves briefly satisfies showOnboarding (still signed in +
        // complete=false) and flashes the onboarding screen.
        await signOut();
        resetOnboarding();
      }}
      className="rounded-full border border-red-500/30 px-8 py-3 active:opacity-70"
    >
      <Text className="text-red-500" style={{ fontSize: 14, fontWeight: '600' }}>
        {t('profile.signOut')}
      </Text>
    </Pressable>
  );
}

function DeleteAccountButton() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const supabase = useSupabase();
  const resetOnboarding = useOnboardingStore((s) => s.reset);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = useCallback(() => {
    Alert.alert(
      t('profile.deleteAccount'),
      t('profile.deleteAccountConfirm'),
      [
        { text: t('common.cancel'), style: "cancel" },
        {
          text: t('profile.delete'),
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              const { error } = await supabase.functions.invoke("delete-account", {
                body: {},
              });
              if (error) throw error;
              // Sign out before resetting onboarding — see SignOutButton note:
              // the reverse order flashes the onboarding screen mid-sign-out.
              await signOut();
              resetOnboarding();
            } catch (err: any) {
              setDeleting(false);
              Alert.alert(
                t('profile.deleteAccountError'),
                err?.message || t('profile.deleteAccountErrorBody'),
              );
            }
          },
        },
      ],
    );
  }, [supabase, resetOnboarding, signOut, t]);

  return (
    <Pressable
      onPress={confirmDelete}
      disabled={deleting}
      className="mt-4 flex-row items-center active:opacity-70"
      style={{ opacity: deleting ? 0.5 : 1 }}
    >
      {deleting && <ActivityIndicator size="small" color="#9ca3af" style={{ marginEnd: 8 }} />}
      <Text className="text-foreground/40" style={{ fontSize: 13, fontWeight: '500' }}>
        {deleting ? t('profile.deleting') : t('profile.deleteAccount')}
      </Text>
    </Pressable>
  );
}

export default function ProfileBody({
  onPressPersonalized,
  onPressNotifications,
}: Props) {
  const { t } = useTranslation();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const config = useMasjidConfig();
  const fonts = useFontFamily();
  const { isAdmin } = useIsAdmin();
  const appVersion = useAppVersion();
  const updates = useAppUpdates();
  const { checkAndNotify } = useUpdatesActions();

  const handleInviteFriends = useCallback(async () => {
    try {
      await Share.share({
        message: t('profile.inviteShareMessage', {
          masjid: config.displayName,
          url: APP_STORE_URL,
        }),
        url: APP_STORE_URL,
      });
    } catch {
      // User dismissed or platform error — nothing actionable to show.
    }
  }, [config.displayName, t]);

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
        <SectionHeader title={t('profile.sectionCommunity')} />
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
            title={t('profile.inviteFriends')}
            onPress={handleInviteFriends}
          />
        </View>
      </View>

      {/* MY ACTIVITY */}
      <View className="flex-col">
        <SectionHeader title={t('profile.sectionMyActivity')} />
        <View>
          <RowItem
            icon={SAVED_PROGRAMS_AND_EVENTS_ICON}
            title={t('profile.savedProgramsEvents')}
            onPress={() => router.push("/profile/saved-events" as Href)}
          />
          <RowItem
            icon={SAVED_CLIPS_ICON}
            title={t('profile.savedClips')}
            onPress={() => router.push("/profile/saved-clips" as Href)}
          />
          <RowItem
            icon={PAYMENT_HISTORY_ICON}
            title={t('profile.paymentHistory')}
            onPress={() => router.push('/profile/payment-history')}
          />
          <RowItem
            icon={PAYMENT_METHODS_ICON}
            title={t('profile.paymentMethods')}
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
        <SectionHeader title={t('profile.sectionNotifications')} />
        <Notifications onEnablePress={onPressNotifications} />
        <View className="flex-col">
          <RowItem
            icon={PRAYER_ALERTS_ICON}
            title={t('profile.prayerAlerts')}
            onPress={() => router.push("/profile/notification-center" as Href)}
          />
          <RowItem
            icon={PROGRAMS_ICON}
            title={t('profile.programs')}
            onPress={() =>
              router.push("/profile/notification-center?tab=Programs" as Href)
            }
          />
          <RowItem
            icon={EVENTS_ICON}
            title={t('profile.events')}
            onPress={() =>
              router.push("/profile/notification-center?tab=Events" as Href)
            }
          />
        </View>
        <SectionRule />
      </View>

      {/* APP */}
      <View className="flex-col">
        <SectionHeader title={t('profile.sectionApp')} />
        <View>
          <LanguageRow />
          {updates.isReady ? (
            <RowItem
              icon={APPLICATION_ICON}
              title={t('profile.restartToApplyUpdate')}
              onPress={() => {
                updates.reloadNow().catch(() => {});
              }}
            />
          ) : (
            <RowItem
              icon={CHECK_STATUS_ICON}
              title={updates.isDownloading ? t('profile.downloadingUpdate') : t('profile.checkForUpdates')}
              onPress={() => {
                if (updates.isChecking || updates.isDownloading) return;
                checkAndNotify();
              }}
            />
          )}
        </View>
        <View className="px-4 pb-2 pt-1">
          <Text
            className="text-foreground/40"
            style={{
              fontFamily: fonts.body,
              fontSize: 11,
              lineHeight: 16,
            }}
          >
            {t('profile.appVersion', { version: appVersion })}
            {__DEV__ && updates.channel ? ` · ${updates.channel}` : ''}
          </Text>
        </View>
        <SectionRule />
      </View>

      {/* MAS SHOP */}
      <View className="flex-col">
        <SectionHeader title={t('profile.sectionShop')} />
        <View>
          <RowItem
            icon={MAS_BAG_ICON}
            title={t('profile.programsEventsShop')}
            onPress={() => {}}
          />
        </View>
        <SectionRule />
      </View>

      {/* BUSINESS ADS */}
      <View className="flex-col">
        <SectionHeader title={t('profile.sectionBusinessAds')} />
        <View>
          <RowItem
            icon={APPLICATION_ICON}
            title={t('profile.startAnApplication')}
            onPress={() => router.push("/advertise" as Href)}
          />
          <RowItem
            icon={CHECK_STATUS_ICON}
            title={t('profile.checkTheStatus')}
            onPress={() => router.push("/advertise-status" as Href)}
          />
          <RowItem
            icon={MANAGE_SUBS_ICON}
            title={t('profile.manageSubscriptions')}
            onPress={() => router.push("/advertise-status" as Href)}
          />
        </View>
        <SectionRule />
      </View>

      {/* LEAVE A COMMENT */}
      <View className="flex-col">
        <SectionHeader title={t('profile.sectionLeaveAComment')} />
        <View>
          <RowItem
            icon={FEEDBACK_ICON}
            title={t('profile.sendFeedback')}
            onPress={() => setFeedbackOpen(true)}
          />
        </View>
        <SectionRule />
      </View>

      {/* ADMIN */}
      {isAdmin && (
        <View className="flex-col">
          <SectionHeader title={t('profile.sectionAdmin')} />
          <View>
            <RowItem
              icon={ADMIN_ICON}
              title={t('profile.adminPortal')}
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

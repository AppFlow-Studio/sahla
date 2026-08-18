import { useAuth } from "@clerk/clerk-expo";
import { Image } from "expo-image";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRequireAccount } from "@/src/components/auth/sign-in-prompt";
import { Icon } from "@/src/components/ui/icon";
import SpeakerInfoModal from "@/components/Discover/SpeakerInfoModal";
import { ContentNotificationSettingsSheet } from "@/components/content/ContentNotificationSettingsSheet";
import {
  useIsNotifOptedIn,
  useToggleContentNotif,
} from "@/src/hooks/use-content-notification-opt-in";
import { useContentNotifSettings } from "@/src/hooks/use-content-notification-settings";
import { useIsSaved, useToggleSave } from "@/src/hooks/use-saved-content";
import { useSupabase } from "@/src/hooks/use-supabase";
import { useFontFamily } from "@/src/hooks/use-font-family";
import { useMasjidConfig } from "@/src/hooks/use-masjid-config";
import { useConfigStore } from "@/src/stores/config-store";
import { useIsRTL } from "@/src/hooks/use-is-rtl";

// Layout constants from Figma `program-bottomsheet-v2` (node 365:3818, 402×874).
// v2 floats the sheet inside the screen instead of running it full-bleed off the
// bottom edge, so all four corners are rounded and the dimmed home screen shows
// around it.
const SHEET_RADIUS = 48; //     Rectangle 4231 corner radius
const SHEET_INSET_X = 9; //     sheet left/right gap (9 → 385 wide in a 402 frame)
const SHEET_BOTTOM = 13; //     874 - 23 - 838
const CONTENT_PAD = 25; //      Frame 69 starts at x=34, sheet at x=9
const COVER_RATIO = 385 / 259; // Mask group is 384×259 across the sheet width
const SAVE_HEIGHT = 43; //      div.donate-banner
const SAVE_RADIUS = 20;
const SAVE_GAP = 12; //         --item-spacing/12 between the heart and the label

// Colors come from the active masjid theme (`useMasjidConfig().colors`), which
// stores each value as a `"R G B"` triplet. These helpers turn a triplet into a
// usable CSS color so the screen re-themes per tenant instead of shipping a
// fixed green/gold palette.
const rgb = (triplet: string) => `rgb(${triplet.replace(/ /g, ",")})`;
const rgba = (triplet: string, alpha: number) =>
  `rgba(${triplet.replace(/ /g, ",")},${alpha})`;

type Detail = {
  content_id: string;
  name: string | null;
  description: string | null;
  image: string | null;
  type: string | null;
  start_date: string | null;
  start_time: string | null;
  speakers: string[] | null;
};

function SkeletonPulse({ width, height, borderRadius = 8, style, color }: { width: number | string; height: number; borderRadius?: number; style?: any; color: string }) {
  const opacity = useSharedValue(0.35);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.8, { duration: 900 }), -1, true);
  }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: color }, animStyle, style]}
    />
  );
}

/** Loading placeholder — mirrors the v2 body order: cover, title, hairline,
 *  speaker line, description lines. */
function ContentSkeleton({ pulseColor }: { pulseColor: string }) {
  const sheetWidth = Dimensions.get("window").width - SHEET_INSET_X * 2;
  return (
    <View style={{ flex: 1 }}>
      <SkeletonPulse
        color={pulseColor}
        width="100%"
        height={sheetWidth / COVER_RATIO}
        borderRadius={0}
        style={{ borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS }}
      />

      <View style={{ paddingHorizontal: CONTENT_PAD, paddingTop: 28 }}>
        {/* Title */}
        <SkeletonPulse color={pulseColor} width="70%" height={20} borderRadius={6} style={{ marginBottom: 10 }} />
        {/* Hairline */}
        <SkeletonPulse color={pulseColor} width="100%" height={1} borderRadius={0} style={{ marginBottom: 11 }} />
        {/* Speaker line */}
        <SkeletonPulse color={pulseColor} width={150} height={18} borderRadius={4} style={{ marginBottom: 22 }} />

        {/* Description */}
        <SkeletonPulse color={pulseColor} width="100%" height={12} borderRadius={4} style={{ marginBottom: 8 }} />
        <SkeletonPulse color={pulseColor} width="100%" height={12} borderRadius={4} style={{ marginBottom: 8 }} />
        <SkeletonPulse color={pulseColor} width="90%" height={12} borderRadius={4} style={{ marginBottom: 8 }} />
        <SkeletonPulse color={pulseColor} width="60%" height={12} borderRadius={4} />
      </View>
    </View>
  );
}

function CircleButton({
  children,
  onPress,
  accessibilityLabel,
  disabled,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      className="h-10 w-10 items-center justify-center rounded-full active:opacity-80"
      style={{
        backgroundColor: "rgba(255,255,255,0.5)",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </Pressable>
  );
}

export default function ContentDetailScreen() {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const { id } = useLocalSearchParams<{ id: string }>();
  const supabase = useSupabase();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const fonts = useFontFamily();
  const { colors } = useMasjidConfig();
  const toastBg = rgb(colors.foreground);
  const toastText = rgb(colors.background);

  // Themed palette (was a hardcoded green/gold set). Each maps to a theme token
  // so the screen follows the active masjid's branding. The v2 Figma palette maps
  // 1:1 onto these tokens: #0A261E → foreground, #FFFBF2 → background,
  // #B8922A → accent, so nothing needs hardcoding.
  const BUSH = rgb(colors.foreground); //     title text + save-button fill
  const SURFACE = rgb(colors.muted); //       image placeholder / skeleton pulses
  const TRAY_BG = SURFACE;
  const SHEET_BG = rgb(colors.background); // #FFFBF2 sheet + save-button label
  const ACCENT = rgb(colors.accent); //       #B8922A speaker name + save heart
  const DIVIDER = rgba(colors.foreground, 0.12); // hairline under the title
  const BODY_TEXT = rgba(colors.foreground, 0.6); // description (Figma 0.6 alpha)
  const MUTED = rgba(colors.foreground, 0.55); // muted/secondary text
  const [detail, setDetail] = useState<Detail | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [speakerModalOpen, setSpeakerModalOpen] = useState(false);

  const { data: isSaved = false } = useIsSaved(id);
  const requireAccount = useRequireAccount();
  const toggleSave = useToggleSave(id, mosqueUuid);
  const saveDisabled = !userId || !mosqueUuid || toggleSave.isPending;

  const { data: isNotifOptedIn = false } = useIsNotifOptedIn(id);
  const toggleNotif = useToggleContentNotif(id, mosqueUuid);

  const isPast = (() => {
    if (!detail?.start_date) return false;
    const t = Date.parse(detail.start_date);
    if (Number.isNaN(t)) return false;
    return t < Date.now();
  })();
  const notifDisabled =
    !userId || !mosqueUuid || isPast || toggleNotif.isPending;

  const [showOptInToast, setShowOptInToast] = useState(false);
  // 0 = hidden above the screen, 1 = resting in view. Drives a notification-style
  // slide-down from the top + fade.
  const toastAnim = useSharedValue(0);
  useEffect(() => {
    if (!showOptInToast) return;
    toastAnim.value = withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) });
    const tid = setTimeout(() => {
      toastAnim.value = withTiming(
        0,
        { duration: 280, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(setShowOptInToast)(false);
        },
      );
    }, 2600);
    return () => clearTimeout(tid);
  }, [showOptInToast, toastAnim]);
  const toastStyle = useAnimatedStyle(() => ({
    opacity: toastAnim.value,
    transform: [{ translateY: (toastAnim.value - 1) * 140 }],
  }));

  const handleToggleNotif = () => {
    const willOptIn = !isNotifOptedIn;
    toggleNotif.mutate(isNotifOptedIn);
    if (willOptIn) setShowOptInToast(true);
  };

  // This screen is a transparentModal (sheet). Replace it with a root-level
  // full-screen route so the destination shows as a real page (not a stacked
  // sheet) and never deep-links into — and gets stuck in — the Profile tab.
  const goToPage = (href: Href) => {
    router.replace(href);
  };

  // Tapping the confirmation toast takes the user to their reminder settings.
  const handleOpenReminders = () => {
    setShowOptInToast(false);
    goToPage("/reminders-settings" as Href);
  };

  // Save-to-library confirmation toast (mirrors the reminder toast).
  const [showSaveToast, setShowSaveToast] = useState(false);
  const saveToastAnim = useSharedValue(0);
  useEffect(() => {
    if (!showSaveToast) return;
    saveToastAnim.value = withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) });
    const tid = setTimeout(() => {
      saveToastAnim.value = withTiming(
        0,
        { duration: 280, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(setShowSaveToast)(false);
        },
      );
    }, 2600);
    return () => clearTimeout(tid);
  }, [showSaveToast, saveToastAnim]);
  const saveToastStyle = useAnimatedStyle(() => ({
    opacity: saveToastAnim.value,
    transform: [{ translateY: (saveToastAnim.value - 1) * 140 }],
  }));

  const handleToggleSave = () => {
    if (!requireAccount('save')) return;
    const willSave = !isSaved;
    toggleSave.mutate(isSaved);
    if (willSave) setShowSaveToast(true);
  };

  const handleOpenLibrary = () => {
    setShowSaveToast(false);
    goToPage("/saved-library" as Href);
  };

  const { data: notifSettings = null } = useContentNotifSettings(id);
  const hasCustomTimings = (notifSettings?.length ?? 0) > 0;
  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);

  // Toast copy reflects the actual reminder timing: the user's custom offsets
  // when set, otherwise the masjid default (which the client doesn't know the
  // exact value of, so we stay generic instead of hardcoding "30 minutes").
  const reminderEventName = detail?.name ?? t("content.thisEvent");
  const reminderMessage = hasCustomTimings
    ? `${t("content.remindYou", {
        timing: (notifSettings ?? [])
          .map((o) => (o === "At start time" ? "at start time" : o.toLowerCase()))
          .join(` ${t("content.and")} `),
      })} · ${reminderEventName}`
    : t("content.remindYouBefore", { event: reminderEventName });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Demo-day workaround: routed through ct02-actions edge function while
      // the Clerk → Supabase JWT bridge is unverified. Direct content_items
      // reads come back null under the new F-RLS-01 org_select policy.
      const { data, error: qError } = await supabase.functions.invoke<{
        row: Detail | null;
        error?: string;
      }>("ct02-actions", {
        body: { action: "get_detail", content_id: id },
      });

      if (cancelled) return;
      if (qError) {
        setError(qError.message);
        setStatus("error");
        return;
      }
      if (data?.error) {
        setError(data.error);
        setStatus("error");
        return;
      }
      if (!data?.row) {
        setError(t("content.contentNotFound"));
        setStatus("error");
        return;
      }
      setDetail(data.row);
      setStatus("success");
    })();

    return () => {
      cancelled = true;
    };
  }, [id, supabase, t]);

  const firstSpeaker = detail?.speakers?.[0];
  const screenHeight = Dimensions.get("window").height;
  const translateY = useSharedValue(screenHeight);
  const DISMISS_DISTANCE = 120;
  const DISMISS_VELOCITY = 800;
  const OPEN_CLOSE_DURATION = 280;

  useEffect(() => {
    translateY.value = withTiming(0, { duration: OPEN_CLOSE_DURATION });
  }, [translateY]);

  const finishClose = () => router.back();

  const dismiss = () => {
    translateY.value = withTiming(
      screenHeight,
      { duration: OPEN_CLOSE_DURATION },
      (finished) => {
        if (finished) runOnJS(finishClose)();
      },
    );
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (
        e.translationY > DISMISS_DISTANCE ||
        e.velocityY > DISMISS_VELOCITY
      ) {
        translateY.value = withTiming(
          screenHeight,
          { duration: OPEN_CLOSE_DURATION },
          (finished) => {
            if (finished) runOnJS(finishClose)();
          },
        );
      } else {
        translateY.value = withTiming(0, { duration: 180 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => {
    const opacity = Math.max(0, 1 - translateY.value / screenHeight);
    return { opacity };
  });

  return (
    <View className="flex-1">
      <Animated.View
        style={[
          { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.45)" },
          backdropStyle,
        ]}
      />
      <Pressable
        onPress={dismiss}
        className="absolute inset-0"
        accessibilityLabel={t("common.close")}
      />

      <Animated.View
        className="flex-1"
        style={[
          {
            // v2 floats the sheet: inset on all four sides, fully rounded, with
            // a fixed height that fills what's left between the safe area and
            // the bottom gap. Figma's literal 23px top would tuck the cover (and
            // the close button) under the status bar and dynamic island, so the
            // top offset follows the safe area the way the previous sheet did.
            marginTop: Math.max(insets.top, 24) + 12,
            marginHorizontal: SHEET_INSET_X,
            marginBottom: SHEET_BOTTOM,
            borderRadius: SHEET_RADIUS,
            backgroundColor: SHEET_BG,
            overflow: "hidden",
          },
          sheetStyle,
        ]}
      >
        {status === "loading" ? (
          <ContentSkeleton pulseColor={rgba(colors.foreground, 0.1)} />
        ) : status === "error" || !detail ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text style={{ color: BUSH, textAlign: "center" }}>
              {error ?? t("content.notFound")}
            </Text>
          </View>
        ) : (
          <>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              <GestureDetector gesture={panGesture}>
              <Animated.View style={{ position: "relative" }}>
                <View
                  style={{
                    width: "100%",
                    aspectRatio: COVER_RATIO,
                    backgroundColor: TRAY_BG,
                    borderTopLeftRadius: SHEET_RADIUS,
                    borderTopRightRadius: SHEET_RADIUS,
                    overflow: "hidden",
                  }}
                >
                  {detail.image ? (
                    <Image
                      source={{ uri: detail.image }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  ) : null}
                </View>

                {/* v2 draws a bare `x` glyph here. Kept on the translucent disc:
                    a bare glyph is unreadable over arbitrary cover art, and the
                    disc preserves the 40pt tap target for the reminder controls
                    the mock omits. */}
                <View
                  style={{
                    position: "absolute",
                    top: 18,
                    left: 16,
                    right: 16,
                  }}
                  className="flex-row items-center justify-between"
                >
                  <CircleButton
                    onPress={dismiss}
                    accessibilityLabel={t("common.close")}
                  >
                    <Icon name="close" size={16} color={BUSH} />
                  </CircleButton>
                  <View className="flex-row items-center" style={{ gap: 8 }}>
                    {isNotifOptedIn && !isPast ? (
                      <Pressable
                        onPress={() => setSettingsSheetOpen(true)}
                        hitSlop={8}
                        className="flex-row items-center rounded-full px-3 active:opacity-80"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.85)",
                          height: 28,
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={t("content.customizeReminderTiming")}
                      >
                        <Text
                          style={{
                            fontFamily: fonts.bodySemibold,
                            fontSize: 12,
                            fontWeight: "600",
                            color: BUSH,
                          }}
                        >
                          {t("content.customize")}
                        </Text>
                      </Pressable>
                    ) : null}
                    {/* No reminder bell once the program/event has passed. */}
                    {!isPast ? (
                      <View>
                        <CircleButton
                          onPress={notifDisabled ? undefined : handleToggleNotif}
                          disabled={notifDisabled}
                          accessibilityLabel={
                            isNotifOptedIn
                              ? t("content.turnOffReminders")
                              : t("content.turnOnReminders")
                          }
                        >
                          <Icon
                            name={isNotifOptedIn ? "notifications" : "notifications-outline"}
                            size={16}
                            color={BUSH}
                            fill={isNotifOptedIn ? BUSH : "none"}
                          />
                        </CircleButton>
                        {hasCustomTimings && isNotifOptedIn ? (
                          <View
                            pointerEvents="none"
                            style={{
                              position: "absolute",
                              top: 0,
                              right: 0,
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: BUSH,
                              borderWidth: 1.5,
                              borderColor: "#FFFFFF",
                            }}
                          />
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                </View>
              </Animated.View>
              </GestureDetector>

              {/* v2 body: title → hairline → accent speaker line → plain
                  description. The old "ABOUT" card wrapper is gone. */}
              <View style={{ paddingHorizontal: CONTENT_PAD, paddingTop: 28 }}>
                <Text
                  style={{
                    fontFamily: fonts.displayRegular,
                    fontSize: 20,
                    lineHeight: 26,
                    color: BUSH,
                  }}
                >
                  {detail.name ?? t("content.untitled")}
                </Text>

                <View
                  style={{ height: 1, marginTop: 10, backgroundColor: DIVIDER }}
                />

                {firstSpeaker ? (
                  <Pressable
                    onPress={() => setSpeakerModalOpen(true)}
                    accessibilityRole="button"
                    accessibilityLabel={t("content.viewBioFor", { name: firstSpeaker })}
                    hitSlop={8}
                    className="flex-row items-center self-start active:opacity-70"
                    style={{ marginTop: 11 }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.bodySemibold,
                        fontSize: 13,
                        lineHeight: 18,
                        fontWeight: "600",
                        color: ACCENT,
                      }}
                    >
                      {firstSpeaker}
                    </Text>
                    <Icon
                      name={isRTL ? "chevron-back" : "right"}
                      size={9}
                      color={ACCENT}
                      style={{ marginStart: 8 }}
                    />
                  </Pressable>
                ) : null}

                {isPast ? (
                  <Text
                    style={{
                      marginTop: 12,
                      fontSize: 13,
                      color: MUTED,
                      fontFamily: fonts.body,
                    }}
                  >
                    {t("content.alreadyHappened")}
                  </Text>
                ) : null}

                {detail.description ? (
                  <Text
                    style={{
                      marginTop: 22,
                      fontFamily: fonts.body,
                      fontSize: 12,
                      lineHeight: 20,
                      color: BODY_TEXT,
                    }}
                  >
                    {detail.description}
                  </Text>
                ) : null}
              </View>
            </ScrollView>

            {/* v2 pins a dark accent-hearted pill inside the sheet — no footer
                bar, no divider, sitting on the sheet's own background. */}
            <View
              style={{
                paddingHorizontal: CONTENT_PAD,
                paddingTop: 12,
                paddingBottom: 27,
                backgroundColor: SHEET_BG,
              }}
            >
              <Pressable
                onPress={handleToggleSave}
                disabled={saveDisabled}
                className="flex-row items-center justify-center active:opacity-80"
                style={{
                  height: SAVE_HEIGHT,
                  borderRadius: SAVE_RADIUS,
                  backgroundColor: BUSH,
                  opacity: saveDisabled ? 0.6 : 1,
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: isSaved, disabled: saveDisabled }}
                accessibilityLabel={isSaved ? t("content.removeFromLibrary") : t("content.saveToLibrary")}
              >
                <Icon
                  name={isSaved ? "heart" : "heart-outline"}
                  size={17}
                  color={ACCENT}
                  fill={isSaved ? ACCENT : "none"}
                />
                <Text
                  style={{
                    marginStart: SAVE_GAP,
                    fontFamily: fonts.bodySemibold,
                    fontSize: 14,
                    fontWeight: "600",
                    color: SHEET_BG,
                  }}
                >
                  {isSaved ? t("content.savedToLibrary") : t("content.saveToLibrary")}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </Animated.View>

      {showOptInToast ? (
        <Animated.View
          style={[
            {
              position: "absolute",
              top: insets.top + 8,
              left: 12,
              right: 12,
              zIndex: 50,
              backgroundColor: toastBg,
              borderRadius: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.18,
              shadowRadius: 16,
              elevation: 8,
            },
            toastStyle,
          ]}
        >
          <Pressable
            onPress={handleOpenReminders}
            accessibilityRole="button"
            accessibilityLabel={t("content.reminderSetA11y")}
            className="flex-row items-center active:opacity-80"
            style={{ paddingVertical: 14, paddingHorizontal: 16 }}
          >
            <Icon name="checkmark-circle" size={20} color={toastText} />
            <View style={{ flex: 1, marginStart: 10, marginEnd: 8 }}>
              <Text
                style={{
                  color: toastText,
                  fontSize: 14,
                  fontWeight: "700",
                  fontFamily: fonts.bodySemibold,
                }}
              >
                {t("content.reminderSet")}
              </Text>
              <Text
                style={{
                  color: toastText,
                  opacity: 0.75,
                  fontSize: 12,
                  fontFamily: fonts.body,
                  marginTop: 1,
                }}
              >
                {reminderMessage}
              </Text>
            </View>
            <Icon
              name={isRTL ? "chevron-back" : "chevron-forward"}
              size={16}
              color={toastText}
              style={{ opacity: 0.7 }}
            />
          </Pressable>
        </Animated.View>
      ) : null}

      {showSaveToast ? (
        <Animated.View
          style={[
            {
              position: "absolute",
              top: insets.top + 8,
              left: 12,
              right: 12,
              zIndex: 50,
              backgroundColor: toastBg,
              borderRadius: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.18,
              shadowRadius: 16,
              elevation: 8,
            },
            saveToastStyle,
          ]}
        >
          <Pressable
            onPress={handleOpenLibrary}
            accessibilityRole="button"
            accessibilityLabel={t("content.savedToLibraryA11y")}
            className="flex-row items-center active:opacity-80"
            style={{ paddingVertical: 14, paddingHorizontal: 16 }}
          >
            <Icon name="heart" size={20} color={toastText} fill={toastText} />
            <View style={{ flex: 1, marginStart: 10, marginEnd: 8 }}>
              <Text
                style={{
                  color: toastText,
                  fontSize: 14,
                  fontWeight: "700",
                  fontFamily: fonts.bodySemibold,
                }}
              >
                {t("content.savedToLibraryToast")}
              </Text>
              <Text
                style={{
                  color: toastText,
                  opacity: 0.75,
                  fontSize: 12,
                  fontFamily: fonts.body,
                  marginTop: 1,
                }}
              >
                {t("content.itemInLibrary", { item: detail?.name ?? t("content.thisItem") })}
              </Text>
            </View>
            <Icon
              name={isRTL ? "chevron-back" : "chevron-forward"}
              size={16}
              color={toastText}
              style={{ opacity: 0.7 }}
            />
          </Pressable>
        </Animated.View>
      ) : null}

      <SpeakerInfoModal
        visible={speakerModalOpen}
        speakerName={firstSpeaker ?? null}
        mosqueUuid={mosqueUuid}
        onClose={() => setSpeakerModalOpen(false)}
      />
      <ContentNotificationSettingsSheet
        visible={settingsSheetOpen}
        onClose={() => setSettingsSheetOpen(false)}
        contentId={id}
        mosqueId={mosqueUuid}
        initialOffsets={notifSettings}
      />
    </View>
  );
}

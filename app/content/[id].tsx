import { useAuth } from "@clerk/clerk-expo";
import { Image } from "expo-image";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Platform,
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
import { useMasjidConfig } from "@/src/hooks/use-masjid-config";
import { useConfigStore } from "@/src/stores/config-store";

const SHEET_RADIUS = 40;

// Colors come from the active masjid theme (`useMasjidConfig().colors`), which
// stores each value as a `"R G B"` triplet. These helpers turn a triplet into a
// usable CSS color so the screen re-themes per tenant instead of shipping a
// fixed green/gold palette.
const rgb = (triplet: string) => `rgb(${triplet.replace(/ /g, ",")})`;
const rgba = (triplet: string, alpha: number) =>
  `rgba(${triplet.replace(/ /g, ",")},${alpha})`;

const platformTitleFont = Platform.select({
  ios: "SF Pro Display",
  android: "Roboto",
  default: "system-ui",
});
const platformUiFont = Platform.select({
  ios: "SF Pro Text",
  android: "Roboto",
  default: "system-ui",
});

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

function ContentSkeleton({ cardBg, pulseColor }: { cardBg: string; pulseColor: string }) {
  const screenWidth = Dimensions.get("window").width;
  return (
    <View style={{ flex: 1 }}>
      {/* Image placeholder — 16:9 to match the banner cover crop */}
      <SkeletonPulse color={pulseColor} width="100%" height={screenWidth * 9 / 16} borderRadius={0} style={{ borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS }} />

      <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
        {/* Title */}
        <SkeletonPulse color={pulseColor} width="75%" height={28} borderRadius={6} style={{ marginBottom: 10 }} />
        <SkeletonPulse color={pulseColor} width="50%" height={28} borderRadius={6} style={{ marginBottom: 20 }} />

        {/* Speaker chip */}
        <SkeletonPulse color={pulseColor} width={140} height={36} borderRadius={18} style={{ marginBottom: 24 }} />

        {/* Description card */}
        <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16 }}>
          <SkeletonPulse color={pulseColor} width={60} height={10} borderRadius={4} style={{ marginBottom: 14 }} />
          <SkeletonPulse color={pulseColor} width="100%" height={12} borderRadius={4} style={{ marginBottom: 8 }} />
          <SkeletonPulse color={pulseColor} width="100%" height={12} borderRadius={4} style={{ marginBottom: 8 }} />
          <SkeletonPulse color={pulseColor} width="90%" height={12} borderRadius={4} style={{ marginBottom: 8 }} />
          <SkeletonPulse color={pulseColor} width="60%" height={12} borderRadius={4} />
        </View>
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const supabase = useSupabase();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const { colors } = useMasjidConfig();
  const toastBg = rgb(colors.foreground);
  const toastText = rgb(colors.background);

  // Themed palette (was a hardcoded green/gold set). Each maps to a theme token
  // so the screen follows the active masjid's branding.
  const BUSH = rgb(colors.foreground); //     primary text, icons, "Save to Library"
  const SURFACE = rgb(colors.muted); //       image placeholder + card/button backgrounds
  const CARD_BG = SURFACE;
  const TRAY_BG = SURFACE;
  const CHIP_BG = rgba(colors.accent, 0.16); // pale accent fill behind the speaker chip
  const CHIP_TEXT = rgb(colors.accent); //     accent-colored speaker name
  const MUTED = rgba(colors.foreground, 0.55); // muted/secondary text
  const [detail, setDetail] = useState<Detail | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [speakerModalOpen, setSpeakerModalOpen] = useState(false);

  const { data: isSaved = false } = useIsSaved(id);
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
  const reminderEventName = detail?.name ?? "this event";
  const reminderMessage = hasCustomTimings
    ? `We'll remind you ${(notifSettings ?? [])
        .map((o) => (o === "At start time" ? "at start time" : o.toLowerCase()))
        .join(" and ")} · ${reminderEventName}`
    : `We'll remind you before ${reminderEventName} starts`;

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
        setError("Content not found");
        setStatus("error");
        return;
      }
      setDetail(data.row);
      setStatus("success");
    })();

    return () => {
      cancelled = true;
    };
  }, [id, supabase]);

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
        accessibilityLabel="Close"
      />

      <Animated.View
        className="flex-1"
        style={[
          {
            marginTop: Math.max(insets.top, 24) + 12,
            borderTopLeftRadius: SHEET_RADIUS,
            borderTopRightRadius: SHEET_RADIUS,
            backgroundColor: "#FFFFFF",
            overflow: "hidden",
          },
          sheetStyle,
        ]}
      >
        {status === "loading" ? (
          <ContentSkeleton cardBg={CARD_BG} pulseColor={rgba(colors.foreground, 0.1)} />
        ) : status === "error" || !detail ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text style={{ color: BUSH }}>{error ?? "Not found"}</Text>
          </View>
        ) : (
          <>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              <GestureDetector gesture={panGesture}>
              <Animated.View style={{ position: "relative" }}>
                <View
                  style={{
                    width: "100%",
                    aspectRatio: 16 / 9,
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

                <View
                  style={{
                    position: "absolute",
                    top: 28,
                    left: 16,
                    right: 16,
                  }}
                  className="flex-row items-center justify-between"
                >
                  <CircleButton
                    onPress={dismiss}
                    accessibilityLabel="Close"
                  >
                    <Icon name="close" size={16} color="#1A1A1A" />
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
                        accessibilityLabel="Customize reminder timing"
                      >
                        <Text
                          style={{
                            fontFamily: platformUiFont,
                            fontSize: 12,
                            fontWeight: "600",
                            color: BUSH,
                          }}
                        >
                          Customize
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
                            isNotifOptedIn ? "Turn off reminders" : "Turn on reminders"
                          }
                        >
                          <Icon
                            name={isNotifOptedIn ? "notifications" : "notifications-outline"}
                            size={16}
                            color="#1A1A1A"
                            fill={isNotifOptedIn ? "#1A1A1A" : "none"}
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

              <View className="px-5 pt-6">
                <Text
                  style={{
                    fontFamily: platformTitleFont,
                    fontSize: 19,
                    lineHeight: 24,
                    fontWeight: "700",
                    color: BUSH,
                  }}
                >
                  {detail.name ?? "Untitled"}
                </Text>

                {firstSpeaker ? (
                  <Pressable
                    onPress={() => setSpeakerModalOpen(true)}
                    accessibilityRole="button"
                    accessibilityLabel={`View bio for ${firstSpeaker}`}
                    className="mt-4 flex-row items-center self-start rounded-full px-4 py-2"
                    style={{ backgroundColor: CHIP_BG }}
                  >
                    <Icon name="user" size={14} color={CHIP_TEXT} />
                    <Text
                      style={{
                        marginLeft: 8,
                        fontFamily: platformUiFont,
                        fontSize: 13,
                        fontWeight: "700",
                        color: CHIP_TEXT,
                      }}
                    >
                      {firstSpeaker}
                    </Text>
                    <Icon
                      name="right"
                      size={12}
                      color={CHIP_TEXT}
                      style={{ marginLeft: 6 }}
                    />
                  </Pressable>
                ) : null}

                {isPast ? (
                  <Text
                    style={{
                      marginTop: 12,
                      fontSize: 13,
                      color: MUTED,
                      fontFamily: platformUiFont,
                    }}
                  >
                    This already happened
                  </Text>
                ) : null}

                {detail.description ? (
                  <View
                    className="mt-5 rounded-2xl p-4"
                    style={{ backgroundColor: CARD_BG }}
                  >
                    <Text
                      style={{
                        fontFamily: platformUiFont,
                        fontSize: 11,
                        fontWeight: "700",
                        letterSpacing: 1.4,
                        textTransform: "uppercase",
                        color: MUTED,
                      }}
                    >
                      About
                    </Text>
                    <Text
                      style={{
                        marginTop: 10,
                        fontFamily: platformUiFont,
                        fontSize: 12,
                        lineHeight: 18,
                        color: BUSH,
                      }}
                    >
                      {detail.description}
                    </Text>
                  </View>
                ) : null}
              </View>
            </ScrollView>

            <View
              style={{
                paddingHorizontal: 16,
                paddingTop: 12,
                paddingBottom: Math.max(insets.bottom - 8, 12),
                backgroundColor: "#FFFFFF",
                borderTopWidth: 1,
                borderTopColor: rgba(colors.foreground, 0.08),
              }}
            >
              <Pressable
                onPress={handleToggleSave}
                disabled={saveDisabled}
                className="flex-row items-center justify-center rounded-2xl py-4 active:opacity-80"
                style={{ backgroundColor: CARD_BG, opacity: saveDisabled ? 0.6 : 1 }}
                accessibilityRole="button"
                accessibilityState={{ selected: isSaved, disabled: saveDisabled }}
                accessibilityLabel={isSaved ? "Remove from Library" : "Save to Library"}
              >
                <Icon
                  name={isSaved ? "heart" : "heart-outline"}
                  size={18}
                  color={BUSH}
                  fill={isSaved ? BUSH : "none"}
                />
                <Text
                  style={{
                    marginLeft: 8,
                    fontFamily: platformUiFont,
                    fontSize: 16,
                    fontWeight: "700",
                    color: BUSH,
                  }}
                >
                  {isSaved ? "Saved to Library" : "Save to Library"}
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
            accessibilityLabel="Reminder set. View your reminders."
            className="flex-row items-center active:opacity-80"
            style={{ paddingVertical: 14, paddingHorizontal: 16 }}
          >
            <Icon name="checkmark-circle" size={20} color={toastText} />
            <View style={{ flex: 1, marginLeft: 10, marginRight: 8 }}>
              <Text
                style={{
                  color: toastText,
                  fontSize: 14,
                  fontWeight: "700",
                  fontFamily: platformUiFont,
                }}
              >
                Reminder set
              </Text>
              <Text
                style={{
                  color: toastText,
                  opacity: 0.75,
                  fontSize: 12,
                  fontFamily: platformUiFont,
                  marginTop: 1,
                }}
              >
                {reminderMessage}
              </Text>
            </View>
            <Icon
              name="chevron-forward"
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
            accessibilityLabel="Saved to library. View your library."
            className="flex-row items-center active:opacity-80"
            style={{ paddingVertical: 14, paddingHorizontal: 16 }}
          >
            <Icon name="heart" size={20} color={toastText} fill={toastText} />
            <View style={{ flex: 1, marginLeft: 10, marginRight: 8 }}>
              <Text
                style={{
                  color: toastText,
                  fontSize: 14,
                  fontWeight: "700",
                  fontFamily: platformUiFont,
                }}
              >
                Saved to library
              </Text>
              <Text
                style={{
                  color: toastText,
                  opacity: 0.75,
                  fontSize: 12,
                  fontFamily: platformUiFont,
                  marginTop: 1,
                }}
              >
                {detail?.name ?? "This"} is in your library
              </Text>
            </View>
            <Icon
              name="chevron-forward"
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

import { useAuth } from "@clerk/clerk-expo";
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import SpeakerInfoModal from "@/components/Discover/SpeakerInfoModal";
import { ContentNotificationSettingsSheet } from "@/components/content/ContentNotificationSettingsSheet";
import {
  useIsNotifOptedIn,
  useToggleContentNotif,
} from "@/src/hooks/use-content-notification-opt-in";
import { useContentNotifSettings } from "@/src/hooks/use-content-notification-settings";
import { useIsSaved, useToggleSave } from "@/src/hooks/use-saved-content";
import { useSupabase } from "@/src/hooks/use-supabase";
import { useConfigStore } from "@/src/stores/config-store";

const BUSH = "#0A261E";
const TRAY_BG = "#EFEDE6";
const CARD_BG = "#F5F3EE";
const CHIP_BG = "#F3EBD2";
const CHIP_TEXT = "#8B6F1A";
const MUTED = "rgba(10,38,30,0.55)";
const SHEET_RADIUS = 40;

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
  const toastOpacity = useSharedValue(0);
  useEffect(() => {
    if (!showOptInToast) return;
    toastOpacity.value = withTiming(1, { duration: 200 });
    const tid = setTimeout(() => {
      toastOpacity.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) runOnJS(setShowOptInToast)(false);
      });
    }, 2400);
    return () => clearTimeout(tid);
  }, [showOptInToast, toastOpacity]);
  const toastStyle = useAnimatedStyle(() => ({ opacity: toastOpacity.value }));

  const handleToggleNotif = () => {
    const willOptIn = !isNotifOptedIn;
    toggleNotif.mutate(isNotifOptedIn);
    if (willOptIn) setShowOptInToast(true);
  };

  const { data: notifSettings = null } = useContentNotifSettings(id);
  const hasCustomTimings = (notifSettings?.length ?? 0) > 0;
  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);

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
  const [imageAspect, setImageAspect] = useState(1);
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
      {showOptInToast ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: insets.top + 12,
              left: 24,
              right: 24,
              zIndex: 10,
              backgroundColor: BUSH,
              borderRadius: 14,
              paddingVertical: 10,
              paddingHorizontal: 14,
            },
            toastStyle,
          ]}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: "600",
              fontFamily: platformUiFont,
              textAlign: "center",
            }}
          >
            We&rsquo;ll remind you 30 minutes before {detail?.name ?? "this event"}
          </Text>
        </Animated.View>
      ) : null}

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
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={BUSH} />
          </View>
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
                    aspectRatio: imageAspect,
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
                      onLoad={(e) => {
                        const w = e.source?.width;
                        const h = e.source?.height;
                        if (w && h) setImageAspect(w / h);
                      }}
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
                    <AntDesign name="close" size={16} color="#1A1A1A" />
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
                    <View>
                      <CircleButton
                        onPress={notifDisabled ? undefined : handleToggleNotif}
                        disabled={notifDisabled}
                        accessibilityLabel={
                          isPast
                            ? "Notifications unavailable, event has passed"
                            : isNotifOptedIn
                              ? "Turn off reminders"
                              : "Turn on reminders"
                        }
                      >
                        <Ionicons
                          name={isNotifOptedIn ? "notifications" : "notifications-outline"}
                          size={16}
                          color="#1A1A1A"
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
                  </View>
                </View>
              </Animated.View>
              </GestureDetector>

              <View className="px-5 pt-6">
                <Text
                  style={{
                    fontFamily: platformTitleFont,
                    fontSize: 28,
                    lineHeight: 34,
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
                    <Feather name="user" size={14} color={CHIP_TEXT} />
                    <Text
                      style={{
                        marginLeft: 8,
                        fontFamily: platformUiFont,
                        fontSize: 14,
                        fontWeight: "700",
                        color: CHIP_TEXT,
                      }}
                    >
                      {firstSpeaker}
                    </Text>
                    <AntDesign
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
                        fontSize: 15,
                        lineHeight: 22,
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
                borderTopColor: "rgba(10,38,30,0.08)",
              }}
            >
              <Pressable
                onPress={() => toggleSave.mutate(isSaved)}
                disabled={saveDisabled}
                className="flex-row items-center justify-center rounded-2xl py-4 active:opacity-80"
                style={{ backgroundColor: CARD_BG, opacity: saveDisabled ? 0.6 : 1 }}
                accessibilityRole="button"
                accessibilityState={{ selected: isSaved, disabled: saveDisabled }}
                accessibilityLabel={isSaved ? "Remove from Library" : "Save to Library"}
              >
                <Ionicons
                  name={isSaved ? "heart" : "heart-outline"}
                  size={18}
                  color={BUSH}
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

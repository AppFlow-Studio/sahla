import { useAuth } from "@clerk/clerk-expo";
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
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
}: {
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="h-9 w-9 items-center justify-center rounded-full"
      style={{ backgroundColor: "#FFFFFF" }}
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
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [speakerModalOpen, setSpeakerModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: qError } = await supabase
        .from("content_items")
        .select(
          "content_id, name, description, image, type, start_date, start_time, speakers",
        )
        .eq("content_id", id)
        .maybeSingle();

      if (cancelled) return;
      if (qError) {
        setError(qError.message);
        setStatus("error");
        return;
      }
      if (!data) {
        setError("Content not found");
        setStatus("error");
        return;
      }
      setDetail(data as Detail);
      setStatus("success");
    })();

    return () => {
      cancelled = true;
    };
  }, [id, supabase]);

  useEffect(() => {
    if (!userId || !id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("saved_content")
        .select("content_id")
        .eq("user_id", userId)
        .eq("content_id", id)
        .maybeSingle();
      if (cancelled) return;
      setIsSaved(!!data);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, supabase, userId]);

  const toggleSave = async () => {
    if (!userId || !mosqueUuid || !detail?.content_id || isSaving) return;
    setIsSaving(true);
    const wasSaved = isSaved;
    setIsSaved(!wasSaved);
    try {
      if (wasSaved) {
        const { error: delErr } = await supabase
          .from("saved_content")
          .delete()
          .eq("user_id", userId)
          .eq("content_id", detail.content_id);
        if (delErr) throw delErr;
      } else {
        const { error: insErr } = await supabase.from("saved_content").upsert(
          {
            user_id: userId,
            content_id: detail.content_id,
            mosque_id: mosqueUuid,
          },
          { onConflict: "user_id,content_id" },
        );
        if (insErr) throw insErr;
      }
    } catch (err) {
      console.warn("[ContentDetail] save toggle failed", err);
      setIsSaved(wasSaved);
    } finally {
      setIsSaving(false);
    }
  };

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
      <Animated.View
        className="flex-1"
        style={[
          {
            marginHorizontal: 12,
            marginTop: Math.max(insets.top, 24) + 12,
            marginBottom: 12,
            borderRadius: SHEET_RADIUS,
            backgroundColor: "#FFFFFF",
            overflow: "hidden",
          },
          sheetStyle,
        ]}
      >
        <GestureDetector gesture={panGesture}>
          <View className="items-center pt-3 pb-2">
            <View
              style={{
                width: 40,
                height: 5,
                borderRadius: 999,
                backgroundColor: "rgba(10,38,30,0.18)",
              }}
            />
          </View>
        </GestureDetector>

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
              <View
                style={{
                  paddingTop: 8,
                  paddingBottom: 16,
                }}
              >
                <View className="flex-row items-center justify-between px-4">
                  <CircleButton
                    onPress={dismiss}
                    accessibilityLabel="Close"
                  >
                    <AntDesign name="close" size={16} color="#1A1A1A" />
                  </CircleButton>
                  <CircleButton accessibilityLabel="Notifications">
                    <Feather name="bell" size={16} color="#1A1A1A" />
                  </CircleButton>
                </View>

                <View className="mt-4 items-center px-4">
                  <View
                    className="overflow-hidden rounded-2xl"
                    style={{
                      width: "100%",
                      backgroundColor: TRAY_BG,
                      padding: 16,
                    }}
                  >
                    <View
                      className="overflow-hidden rounded-xl"
                      style={{ aspectRatio: imageAspect }}
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
                  </View>
                </View>
              </View>

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
                onPress={toggleSave}
                disabled={isSaving || !userId || !mosqueUuid}
                className="flex-row items-center justify-center rounded-2xl py-4"
                style={{
                  backgroundColor: CARD_BG,
                  opacity: isSaving ? 0.6 : 1,
                }}
              >
                <Feather
                  name="heart"
                  size={18}
                  color={isSaved ? "#C03A3A" : BUSH}
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
    </View>
  );
}

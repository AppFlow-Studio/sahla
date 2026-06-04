import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Platform,
  Pressable,
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

import { useMasjidConfig } from "@/src/hooks/use-masjid-config";
import { useSupabase } from "@/src/hooks/use-supabase";

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

function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

type SpeakerRow = {
  speaker_name: string | null;
  speaker_img: string | null;
  speaker_creds: string[] | null;
};

type Props = {
  visible: boolean;
  speakerName: string | null;
  mosqueUuid: string | null;
  onClose: () => void;
};

export default function SpeakerInfoModal({
  visible,
  speakerName,
  mosqueUuid,
  onClose,
}: Props) {
  const { colors } = useMasjidConfig();
  const fg = colors.foreground.replace(/ /g, ",");
  const fgRgb = `rgb(${fg})`;
  const mutedFgRgb = `rgb(${colors.mutedForeground.replace(/ /g, ",")})`;
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ",")})`;
  const mutedRgb = `rgb(${colors.muted.replace(/ /g, ",")})`;
  const handleColor = `rgba(${fg}, 0.22)`;
  const sublabelColor = `rgba(${fg}, 0.55)`;

  const screenHeight = Dimensions.get("window").height;
  const translateY = useSharedValue(screenHeight);
  const DISMISS_DISTANCE = 120;
  const DISMISS_VELOCITY = 800;

  useEffect(() => {
    if (visible) {
      translateY.value = screenHeight;
      translateY.value = withTiming(0, { duration: 280 });
    }
  }, [visible, screenHeight, translateY]);

  const animateClose = () => {
    translateY.value = withTiming(screenHeight, { duration: 280 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
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
        translateY.value = withTiming(screenHeight, { duration: 280 }, (finished) => {
          if (finished) runOnJS(onClose)();
        });
      } else {
        translateY.value = withTiming(0, { duration: 180 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const supabase = useSupabase();
  const [data, setData] = useState<SpeakerRow | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );

  useEffect(() => {
    if (!visible || !speakerName) return;
    let cancelled = false;
    setStatus("loading");
    setData(null);
    (async () => {
      let query = supabase
        .from("speaker_data")
        .select("speaker_name, speaker_img, speaker_creds")
        .eq("speaker_name", speakerName);
      if (mosqueUuid) query = query.eq("mosque_id", mosqueUuid);
      const { data: row, error } = await query.maybeSingle();
      if (cancelled) return;
      if (error) {
        setStatus("error");
        return;
      }
      setData(
        (row as SpeakerRow | null) ?? {
          speaker_name: speakerName,
          speaker_img: null,
          speaker_creds: null,
        },
      );
      setStatus("success");
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, speakerName, mosqueUuid, supabase]);

  const credentials = (data?.speaker_creds ?? []).flatMap(splitIntoSentences);
  const displayName = data?.speaker_name ?? speakerName ?? "";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        onPress={animateClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.55)",
          justifyContent: "flex-end",
          paddingHorizontal: 12,
          paddingBottom: 16,
        }}
      >
        <Pressable onPress={() => {}}>
          <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              {
                backgroundColor: mutedRgb,
                borderRadius: 48,
                paddingTop: 12,
                paddingBottom: 28,
                paddingHorizontal: 24,
                minHeight: 500,
                overflow: "hidden",
              },
              sheetStyle,
            ]}
          >
            <View
              style={{
                alignSelf: "center",
                width: 44,
                height: 4,
                borderRadius: 2,
                backgroundColor: handleColor,
                marginBottom: 6,
              }}
            />

            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <Pressable
                onPress={animateClose}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Close speaker info"
                style={{ padding: 4 }}
              >
                <Text
                  style={{
                    fontFamily: platformUiFont,
                    fontSize: 22,
                    fontWeight: "400",
                    color: fgRgb,
                    lineHeight: 22,
                  }}
                >
                  {"\u00d7"}
                </Text>
              </Pressable>
            </View>

            <Text
              style={{
                fontFamily: platformUiFont,
                fontSize: 13,
                fontWeight: "600",
                color: fgRgb,
                marginTop: 14,
              }}
            >
              SPEAKER
            </Text>
            <View
              style={{
                height: 1,
                backgroundColor: fgRgb,
                marginTop: 10,
                marginBottom: 22,
              }}
            />

            {status === "loading" ? (
              <View style={{ paddingVertical: 36, alignItems: "center" }}>
                <ActivityIndicator color={fgRgb} />
              </View>
            ) : (
              <>
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 12,
                    backgroundColor: mutedRgb,
                    overflow: "hidden",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                  }}
                >
                  {data?.speaker_img ? (
                    <Image
                      source={{ uri: data.speaker_img }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  ) : (
                    <Feather name="user" size={28} color={fgRgb} />
                  )}
                </View>

                <Text
                  style={{
                    fontFamily: platformUiFont,
                    fontSize: 11,
                    lineHeight: 18,
                    fontWeight: "600",
                    color: fgRgb,
                    marginBottom: 8,
                  }}
                >
                  {displayName}
                </Text>

                {credentials.length > 0 ? (
                  <View>
                    {credentials.map((cred, idx) => (
                      <View
                        key={`${cred}-${idx}`}
                        style={{
                          flexDirection: "row",
                          marginBottom: idx === credentials.length - 1 ? 0 : 16,
                          paddingRight: 8,
                        }}
                      >
                        <View
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: accentRgb,
                            marginTop: 7,
                            marginRight: 8,
                          }}
                        />
                        <Text
                          style={{
                            flex: 1,
                            fontFamily: platformUiFont,
                            fontSize: 11,
                            lineHeight: 18,
                            fontWeight: "400",
                            color: mutedFgRgb,
                          }}
                        >
                          {cred}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text
                    style={{
                      fontFamily: platformUiFont,
                      fontSize: 14,
                      lineHeight: 22,
                      color: sublabelColor,
                    }}
                  >
                    No credentials available.
                  </Text>
                )}
              </>
            )}
          </Animated.View>
          </GestureDetector>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

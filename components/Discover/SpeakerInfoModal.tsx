import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";

import { useSupabase } from "@/src/hooks/use-supabase";

const BUSH = "#0A261E";
const SHEET_BG = "#F4EFE2";
const AVATAR_BG = "#E8E3D2";
const DIVIDER = "#0A261E";
const SUBLABEL = "rgba(10,38,30,0.55)";
const BULLET_GOLD = "#C9A227";
const HANDLE = "rgba(10,38,30,0.22)";

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
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.55)",
          justifyContent: "flex-end",
          paddingHorizontal: 12,
          paddingBottom: 16,
        }}
      >
        <Pressable onPress={() => {}}>
          <View
            style={{
              backgroundColor: SHEET_BG,
              borderRadius: 28,
              paddingTop: 12,
              paddingBottom: 28,
              paddingHorizontal: 24,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                alignSelf: "center",
                width: 44,
                height: 4,
                borderRadius: 2,
                backgroundColor: HANDLE,
                marginBottom: 6,
              }}
            />

            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Close speaker info"
                style={{ padding: 4 }}
              >
                <AntDesign name="close" size={22} color={BUSH} />
              </Pressable>
            </View>

            <Text
              style={{
                fontFamily: "SF Pro",
                fontSize: 16,
                fontStyle: "normal",
                fontWeight: "600",
                color: BUSH,
                marginTop: 4,
              }}
            >
              SPEAKER
            </Text>
            <View
              style={{
                height: 1,
                backgroundColor: DIVIDER,
                marginTop: 10,
                marginBottom: 22,
              }}
            />

            {status === "loading" ? (
              <View style={{ paddingVertical: 36, alignItems: "center" }}>
                <ActivityIndicator color={BUSH} />
              </View>
            ) : (
              <>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: AVATAR_BG,
                    overflow: "hidden",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 14,
                  }}
                >
                  {data?.speaker_img ? (
                    <Image
                      source={{ uri: data.speaker_img }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  ) : (
                    <Feather name="user" size={28} color={BUSH} />
                  )}
                </View>

                <Text
                  style={{
                    fontFamily: platformTitleFont,
                    fontSize: 19,
                    lineHeight: 24,
                    fontWeight: "700",
                    color: BUSH,
                    marginBottom: 22,
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
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: BULLET_GOLD,
                            marginTop: 9,
                            marginRight: 14,
                          }}
                        />
                        <Text
                          style={{
                            flex: 1,
                            fontFamily: platformUiFont,
                            fontSize: 15,
                            lineHeight: 22,
                            color: BUSH,
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
                      color: SUBLABEL,
                    }}
                  >
                    No credentials available.
                  </Text>
                )}
              </>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

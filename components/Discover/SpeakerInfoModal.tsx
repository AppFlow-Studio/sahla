import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { useSupabase } from "@/src/hooks/use-supabase";

const BUSH = "#0A261E";
const SHEET_BG = "#FFFFFF";
const TRAY_BG = "#EFEDE6";
const DIVIDER = "rgba(10,38,30,0.10)";
const SUBLABEL = "rgba(10,38,30,0.55)";
const CHIP_GOLD = "#8B6F1A";

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

  const credentials = data?.speaker_creds ?? [];
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
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.85)",
          justifyContent: "center",
          paddingHorizontal: 20,
        }}
      >
        <Pressable onPress={() => {}}>
          <View>
            <View
              className="flex-row items-center justify-between"
              style={{ marginBottom: 14 }}
            >
              <Pressable
                onPress={onClose}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Close speaker info"
                className="h-9 w-9 items-center justify-center rounded-full"
                style={{ backgroundColor: "#FFFFFF" }}
              >
                <AntDesign name="close" size={16} color="#1A1A1A" />
              </Pressable>
              <Pressable
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Notifications"
                className="h-9 w-9 items-center justify-center rounded-full"
                style={{ backgroundColor: "#FFFFFF" }}
              >
                <Feather name="bell" size={16} color="#1A1A1A" />
              </Pressable>
            </View>

            <View
              style={{
                backgroundColor: SHEET_BG,
                borderRadius: 24,
                padding: 20,
                overflow: "hidden",
              }}
            >
              {status === "loading" ? (
                <View style={{ paddingVertical: 36, alignItems: "center" }}>
                  <ActivityIndicator color={BUSH} />
                </View>
              ) : (
                <>
                  <View className="flex-row items-center">
                    <View
                      style={{
                        width: 76,
                        height: 76,
                        borderRadius: 38,
                        backgroundColor: TRAY_BG,
                        overflow: "hidden",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {data?.speaker_img ? (
                        <Image
                          source={{ uri: data.speaker_img }}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                        />
                      ) : (
                        <Feather name="user" size={32} color={BUSH} />
                      )}
                    </View>

                    <View
                      style={{
                        flex: 1,
                        marginLeft: 16,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: platformUiFont,
                          fontSize: 11,
                          fontWeight: "700",
                          letterSpacing: 1.6,
                          textTransform: "uppercase",
                          color: SUBLABEL,
                        }}
                      >
                        Speaker
                      </Text>
                      <Text
                        style={{
                          marginTop: 4,
                          fontFamily: platformTitleFont,
                          fontSize: 22,
                          lineHeight: 28,
                          fontWeight: "700",
                          color: BUSH,
                        }}
                      >
                        {displayName}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      height: 1,
                      backgroundColor: DIVIDER,
                      marginTop: 18,
                      marginBottom: 16,
                    }}
                  />

                  <Text
                    style={{
                      fontFamily: platformUiFont,
                      fontSize: 15,
                      fontWeight: "700",
                      color: BUSH,
                      marginBottom: 12,
                    }}
                  >
                    Credentials
                  </Text>

                  {credentials.length > 0 ? (
                    <ScrollView
                      style={{ maxHeight: 260 }}
                      showsVerticalScrollIndicator={false}
                    >
                      {credentials.map((cred, idx) => (
                        <View
                          key={`${cred}-${idx}`}
                          className="flex-row"
                          style={{ marginBottom: 10 }}
                        >
                          <Text
                            style={{
                              color: CHIP_GOLD,
                              fontSize: 12,
                              lineHeight: 22,
                              marginRight: 10,
                            }}
                          >
                            {"◆"}
                          </Text>
                          <Text
                            style={{
                              flex: 1,
                              fontFamily: platformUiFont,
                              fontSize: 14,
                              lineHeight: 22,
                              color: BUSH,
                            }}
                          >
                            {cred}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
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
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

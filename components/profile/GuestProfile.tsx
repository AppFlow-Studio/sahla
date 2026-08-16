import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/ui/icon";
import { Tappable } from "@/src/components/ui/tappable";
import { useFontFamily } from "@/src/hooks/use-font-family";
import { useMasjidConfig } from "@/src/hooks/use-masjid-config";
import { useGuestStore } from "@/src/stores/guest-store";

/** What an account unlocks, in the order the app surfaces them. */
const PERKS = [
  { icon: "bookmark-outline", key: "perkSave" },
  { icon: "bell-outline", key: "perkRemind" },
  { icon: "heart-outline", key: "perkPersonalize" },
] as const;

/**
 * The Profile tab for someone browsing without an account.
 *
 * Rather than an empty or broken profile, this explains what signing in adds
 * and offers the way in. Leaving guest mode is all it takes — the root
 * navigator's guard swaps back to the auth group on its own.
 */
export default function GuestProfile() {
  const { t } = useTranslation();
  const fonts = useFontFamily();
  const insets = useSafeAreaInsets();
  const { colors, displayName } = useMasjidConfig();
  const exitGuest = useGuestStore((s) => s.exitGuest);

  const fg = colors.foreground.replace(/ /g, ",");
  const fgRgb = `rgb(${fg})`;
  const bgRgb = `rgb(${colors.background.replace(/ /g, ",")})`;
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ",")})`;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bgRgb }}
      contentContainerStyle={{
        paddingTop: insets.top + 48,
        paddingHorizontal: 28,
        paddingBottom: 140,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ alignItems: "center" }}>
        <View
          style={{
            width: 76,
            height: 76,
            borderRadius: 38,
            backgroundColor: `rgba(${fg},0.06)`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="person-outline" size={32} color={fgRgb} />
        </View>

        <Text
          style={{
            marginTop: 20,
            fontSize: 24,
            lineHeight: 31,
            textAlign: "center",
            color: fgRgb,
            fontFamily: fonts.displayRegular,
          }}
        >
          {t("auth.gate.guestBanner")}
        </Text>
        <Text
          style={{
            marginTop: 8,
            fontSize: 14,
            lineHeight: 21,
            textAlign: "center",
            color: `rgba(${fg},0.55)`,
          }}
        >
          {t("profile.guestSubtitle", { masjid: displayName })}
        </Text>
      </View>

      <View style={{ marginTop: 32, gap: 18 }}>
        {PERKS.map((perk) => (
          <View key={perk.key} style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: `rgba(${fg},0.05)`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={perk.icon} size={18} color={fgRgb} />
            </View>
            <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: `rgba(${fg},0.75)` }}>
              {t(`profile.${perk.key}`)}
            </Text>
          </View>
        ))}
      </View>

      <Tappable
        onPress={exitGuest}
        style={{
          marginTop: 36,
          height: 50,
          borderRadius: 25,
          backgroundColor: accentRgb,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: "600", color: bgRgb }}>
          {t("auth.gate.signIn")}
        </Text>
      </Tappable>

      <Text
        style={{
          marginTop: 16,
          fontSize: 12,
          lineHeight: 18,
          textAlign: "center",
          color: `rgba(${fg},0.4)`,
        }}
      >
        {t("profile.guestKeepBrowsing")}
      </Text>
    </ScrollView>
  );
}

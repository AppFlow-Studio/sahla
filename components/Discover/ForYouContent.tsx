import AntDesign from "@expo/vector-icons/AntDesign";
import { Icon } from "@/src/components/ui/icon";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { useFontFamily } from "@/src/hooks/use-font-family";
import { useIsRTL } from "@/src/hooks/use-is-rtl";
import { useMasjidConfig } from "@/src/hooks/use-masjid-config";
import { useUserPreferences } from "@/src/hooks/use-user-preferences";

export type ForYouRowItem = {
  id: string;
  title: string;
  speaker: string | null;
  category: string | null;
  image?: { uri: string } | number;
};

type Props = {
  events: ForYouRowItem[];
  programs: ForYouRowItem[];
  onPressItem: (id: string) => void;
  onPressEdit?: () => void;
};

type PrefState = "none" | "started" | "complete";

function CustomizedPill({
  onPress,
  prefState,
}: {
  onPress?: () => void;
  prefState: PrefState;
}) {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const fonts = useFontFamily();
  const { colors } = useMasjidConfig();
  const fg = colors.foreground.replace(/ /g, ",");
  const fgRgb = `rgb(${fg})`;
  const mutedFgRgb = `rgb(${colors.mutedForeground.replace(/ /g, ",")})`;
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ",")})`;
  const accent = colors.accent.replace(/ /g, ",");
  const pillBg = `rgba(${accent}, 0.2)`;

  const copy = {
    complete: {
      action: t("discover.prefCompleteAction"),
      title: t("discover.prefCompleteTitle"),
      subtitle: t("discover.prefCompleteSubtitle"),
      a11y: t("discover.prefCompleteA11y"),
    },
    started: {
      action: t("discover.prefStartedAction"),
      title: t("discover.prefStartedTitle"),
      subtitle: t("discover.prefStartedSubtitle"),
      a11y: t("discover.prefStartedA11y"),
    },
    none: {
      action: t("discover.prefNoneAction"),
      title: t("discover.prefNoneTitle"),
      subtitle: t("discover.prefNoneSubtitle"),
      a11y: t("discover.prefNoneA11y"),
    },
  }[prefState];

  const { action: actionLabel, title, subtitle } = copy;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={copy.a11y}
      className="flex-row items-center rounded-full px-4 py-3"
      style={{ backgroundColor: pillBg }}
    >
      <Icon name="fingerprint" size={18} color={accentRgb} />
      <View className="ms-3 flex-1">
        <Text
          style={{
            fontFamily: fonts.bodySemibold,
            fontSize: 12,
            fontWeight: "600",
            color: fgRgb,
            lineHeight: 16,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 11,
            color: mutedFgRgb,
            lineHeight: 14,
            marginTop: 2,
          }}
        >
          {subtitle}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: 12,
          color: accentRgb,
          marginEnd: 4,
        }}
      >
        {actionLabel}
      </Text>
      <AntDesign
        name={isRTL ? "left" : "right"}
        size={10}
        color={accentRgb}
      />
    </Pressable>
  );
}

function SectionHeading({ label }: { label: string }) {
  const fonts = useFontFamily();
  const { colors } = useMasjidConfig();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ",")})`;

  return (
    <View className="px-6">
      <Text
        style={{
          fontFamily: fonts.bodySemibold,
          fontSize: 13,
          fontWeight: "700",
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: fgRgb,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <View style={{ height: 1, backgroundColor: fgRgb }} />
    </View>
  );
}

function Row({
  item,
  onPress,
  showDivider,
}: {
  item: ForYouRowItem;
  onPress: () => void;
  showDivider: boolean;
}) {
  const isRTL = useIsRTL();
  const fonts = useFontFamily();
  const { colors } = useMasjidConfig();
  const fg = colors.foreground.replace(/ /g, ",");
  const fgRgb = `rgb(${fg})`;
  const mutedFgRgb = `rgb(${colors.mutedForeground.replace(/ /g, ",")})`;
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ",")})`;
  const mutedRgb = `rgb(${colors.muted.replace(/ /g, ",")})`;
  const rowDivider = `rgba(${fg}, 0.1)`;

  return (
    <View>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={item.title}
        className="flex-row items-center px-6"
        style={{ paddingVertical: 14 }}
      >
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 10,
            overflow: "hidden",
            backgroundColor: mutedRgb,
          }}
        >
          {item.image ? (
            <Image
              source={item.image}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : null}
        </View>

        <View className="ms-3 flex-1">
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fonts.bodySemibold,
              fontSize: 13,
              fontWeight: "600",
              color: fgRgb,
              lineHeight: 16,
            }}
          >
            {item.title}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fonts.body,
              fontSize: 11,
              lineHeight: 16,
              marginTop: 2,
            }}
          >
            {item.speaker ? (
              <Text style={{ color: mutedFgRgb }}>{item.speaker}</Text>
            ) : null}
            {item.speaker && item.category ? (
              <Text style={{ color: mutedFgRgb }}> {"\u2022"} </Text>
            ) : null}
            {item.category ? (
              <Text style={{ color: accentRgb, fontWeight: "500" }}>
                {item.category}
              </Text>
            ) : null}
          </Text>
        </View>

        <AntDesign
          name={isRTL ? "left" : "right"}
          size={12}
          color={mutedFgRgb}
        />
      </Pressable>

      {showDivider ? (
        <View
          style={{
            height: 1,
            backgroundColor: rowDivider,
            marginHorizontal: 24,
          }}
        />
      ) : null}
    </View>
  );
}

export default function ForYouContent({
  events,
  programs,
  onPressItem,
  onPressEdit,
}: Props) {
  const { t } = useTranslation();
  const { preferences } = useUserPreferences();

  // Three states for the banner:
  //  - complete : finished the flow (reached all-set) → "Edit"
  //  - started  : saved at least one step but didn't finish → "Continue"
  //  - none     : nothing yet → "Get started"
  // "started" reads only personalization-exclusive columns so a user who did
  // the initial onboarding (which writes knowledge level / demographics) isn't
  // mistaken for having started this flow.
  const completed = !!preferences?.personalization_completed_at;
  const started =
    !!preferences &&
    ((preferences.attendance_reasons?.length ?? 0) > 0 ||
      (preferences.programs_for?.length ?? 0) > 0 ||
      (preferences.attendance_windows?.length ?? 0) > 0 ||
      (preferences.additional_preferences?.length ?? 0) > 0);

  const prefState: PrefState = completed
    ? "complete"
    : started
      ? "started"
      : "none";

  return (
    <View>
      <View className="px-6" style={{ marginTop: 33 }}>
        <CustomizedPill onPress={onPressEdit} prefState={prefState} />
      </View>

      {events.length > 0 ? (
        <View className="mt-7">
          <SectionHeading label={t("discover.eventsForYou")} />
          <View className="mt-2">
            {events.map((item, idx) => (
              <Row
                key={item.id}
                item={item}
                onPress={() => onPressItem(item.id)}
                showDivider={idx < events.length - 1}
              />
            ))}
          </View>
        </View>
      ) : null}

      {programs.length > 0 ? (
        <View className="mt-7">
          <SectionHeading label={t("discover.programsForYou")} />
          <View className="mt-2">
            {programs.map((item, idx) => (
              <Row
                key={item.id}
                item={item}
                onPress={() => onPressItem(item.id)}
                showDivider={idx < programs.length - 1}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

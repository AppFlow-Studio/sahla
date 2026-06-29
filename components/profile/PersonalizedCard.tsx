import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Icon } from "@/src/components/ui/icon";
import { PersonalizeIcon } from "@/src/components/ui/personalize-icon";
import { useMasjidConfig } from "@/src/hooks/use-masjid-config";
import { useFontFamily } from '@/src/hooks/use-font-family';
import { useIsRTL } from '@/src/hooks/use-is-rtl';
import { IncompleteBadge } from '@/src/components/profile/IncompleteBadge';

type Props = {
    onPress: () => void;
    /** Show the red "1" pill — set by useSetupCompleteness when personalization is incomplete. */
    incomplete?: boolean;
}

export default function PersonalizedCard({ onPress, incomplete }: Props) {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const { colors } = useMasjidConfig();
  const fonts = useFontFamily();
  const fg = `rgb(${colors.foreground.replace(/ /g, ",")})`;
  const fg40 = `rgba(${colors.foreground.replace(/ /g, ",")},0.4)`;
  const accent = `rgb(${colors.accent.replace(/ /g, ",")})`;
  return (
    <Pressable className="w-full flex-row justify-between items-center bg-accent/20 rounded-[30px] px-5"
    style={{ minHeight: 53, paddingVertical: 12 }}
    onPress={onPress}
    >
        <View className="flex-row items-center gap-1">
            {/* Themed personalization emblem (from Figma) — follows the masjid palette. */}
            <PersonalizeIcon size={24} color={accent} />
            <View className="flex-col ms-2">
                <Text
                className="text-foreground"
                style = {{
                    fontFamily: fonts.bodySemibold,
                    fontWeight: "600",
                    fontSize: 11,
                    lineHeight: 18,
                    letterSpacing: 0,
                }}
                >
                {t('profile.personalizePreferences')}
                </Text>
                <Text
                className="text-foreground/60"
                style = {{
                    fontFamily: fonts.body,
                    fontWeight: "400",
                    fontSize: 10,
                    lineHeight: 18,
                    letterSpacing: 0,
                }}
                >
                    {t('profile.personalizeSubtitle')}
                </Text>
            </View>
        </View>

        <View className="flex-row items-center gap-2">
          {incomplete ? <IncompleteBadge /> : null}
          <Icon name={isRTL ? 'chevron-left' : 'chevron-right'} size={14} color={fg40} />
        </View>
    </Pressable>
  )
}

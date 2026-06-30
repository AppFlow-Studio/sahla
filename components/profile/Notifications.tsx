import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "@/src/components/ui/icon";
import { useMasjidConfig } from "@/src/hooks/use-masjid-config";
import { useFontFamily } from '@/src/hooks/use-font-family';
import { useIsRTL } from '@/src/hooks/use-is-rtl';
import { IncompleteBadge } from '@/src/components/profile/IncompleteBadge';

type Props = {
  onEnablePress: () => void;
  /** Show the red "1" pill — set by useSetupCompleteness when notifications are off. */
  incomplete?: boolean;
};

export default function Notifications({ onEnablePress, incomplete }: Props) {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const { colors } = useMasjidConfig();
  const fonts = useFontFamily();
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;

  return (
    <View
      className="mb-1 w-full flex-row items-center justify-between rounded-[14px] bg-accent/20 px-5"
      style={{
        minHeight: 49,
        paddingVertical: 14,
        borderWidth: 0.5,
        borderColor: `rgba(${colors.accent.replace(/ /g, ',')}, 0.2)`,
        borderStyle: 'dashed',
      }}
    >
      <View className="min-w-0 flex-1 flex-row items-center gap-2 pe-2">
        <Icon name="bell" size={14} color={accentRgb} fill={accentRgb} />
        <Text
          numberOfLines={1}
          style={{
            fontFamily: fonts.bodyMedium,
            fontWeight: "500",
            fontSize: 11,
            lineHeight: 15,
            color: accentRgb,
          }}
        >
          {t('profile.pushNotificationsOff')}
        </Text>
      </View>
      <Pressable
        onPress={onEnablePress}
        accessibilityRole="button"
        accessibilityLabel={t('profile.enablePushNotifications')}
        className="shrink-0 flex-row items-center gap-1.5"
        hitSlop={8}
      >
        {incomplete ? <IncompleteBadge /> : null}
        <Text
          style={{
            fontFamily: fonts.body,
            fontWeight: "400",
            fontSize: 11,
            lineHeight: 15,
            color: accentRgb,
          }}
        >
          {t('profile.enable')}
        </Text>
        <Icon name={isRTL ? 'chevron-left' : 'chevron-right'} size={14} color={accentRgb} />
      </Pressable>
    </View>
  );
}

import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/src/components/ui/icon';
import { useFontFamily } from '@/src/hooks/use-font-family';
import { useIsRTL } from '@/src/hooks/use-is-rtl';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { IncompleteBadge } from '@/src/components/profile/IncompleteBadge';

type Props = {
  onPress: () => void;
};

/**
 * "Complete your profile" affordance in the Profile tab. Renders only when
 * the profile-fields portion of the setup-completeness signal is incomplete
 * — required name / phone / photo missing. Mirrors the visual treatment of
 * `PersonalizedCard` so the three setup affordances read as a coherent set.
 */
export default function ProfileSetupRow({ onPress }: Props) {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const { colors } = useMasjidConfig();
  const fonts = useFontFamily();
  const fg40 = `rgba(${colors.foreground.replace(/ /g, ',')},0.4)`;
  const accent = `rgb(${colors.accent.replace(/ /g, ',')})`;

  return (
    <Pressable
      className="w-full flex-row justify-between items-center bg-accent/20 rounded-[30px] px-5"
      style={{ minHeight: 53, paddingVertical: 12 }}
      onPress={onPress}
    >
      <View className="flex-row items-center gap-1">
        <Icon name="user" size={21} color={accent} />
        <View className="flex-col ms-2">
          <Text
            className="text-foreground"
            style={{
              fontFamily: fonts.bodySemibold,
              fontWeight: '600',
              fontSize: 11,
              lineHeight: 18,
              letterSpacing: 0,
            }}
          >
            {t('profile.completeYourProfile', 'Complete your profile')}
          </Text>
          <Text
            className="text-foreground/60"
            style={{
              fontFamily: fonts.body,
              fontWeight: '400',
              fontSize: 10,
              lineHeight: 18,
              letterSpacing: 0,
            }}
          >
            {t('profile.completeYourProfileSubtitle', 'Add your name, photo, and contact details')}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        <IncompleteBadge />
        <Icon name={isRTL ? 'chevron-left' : 'chevron-right'} size={14} color={fg40} />
      </View>
    </Pressable>
  );
}

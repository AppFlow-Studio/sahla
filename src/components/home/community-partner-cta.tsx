import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useIsRTL } from '@/src/hooks/use-is-rtl';

export function CommunityPartnerCta() {
  const router = useRouter();
  const { t } = useTranslation();
  const isRTL = useIsRTL();

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/advertise')}>
      <View className="items-center rounded-full bg-primary px-5 py-3">
        <Text className="text-[14px] text-primary-foreground">
          {t('home.becomeCommunityPartner')} {isRTL ? '←' : '→'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useDonation } from '@/src/providers/donation-provider';
import { useIsRTL } from '@/src/hooks/use-is-rtl';

export function DonateBanner() {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const { colors } = useMasjidConfig();
  const { open } = useDonation();
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;
  // Subtle dark container so it reads on any masjid palette and never blows out
  // to white like liquid glass did.
  const containerBg = 'rgba(0, 0, 0, 0.18)';

  return (
    <View className="flex-row items-center justify-between rounded-full bg-primary px-4 py-3">
      <View className="flex-row items-center gap-3">
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: containerBg,
          }}
        >
          <MaterialCommunityIcons name="heart" size={20} color={accentRgb} />
        </View>
        <View>
          <Text className="text-[14px] font-bold text-primary-foreground">
            {t('home.supportYourMasjid')}
          </Text>
          <Text className="text-[11px] text-primary-foreground/55">{t('home.donate')}</Text>
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.8} onPress={open}>
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 999,
            backgroundColor: containerBg,
          }}
        >
          <Text style={{ color: accentRgb, fontSize: 11, fontWeight: '800' }}>
            {t('home.donateCta')} {isRTL ? '←' : '→'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

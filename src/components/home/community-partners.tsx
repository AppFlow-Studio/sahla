import { Text, View } from 'react-native';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useCommunityPartners } from '@/src/hooks/use-community-partners';
import { CommunityPartnersCarousel } from '@/src/components/community-partners-carousel';

export function CommunityPartners() {
  const { data } = useCommunityPartners();
  const { colors } = useMasjidConfig();
  const partners = data ?? [];

  // Nothing approved yet → hide the section entirely.
  if (partners.length === 0) return null;

  const fg = colors.foreground.replace(/ /g, ',');

  return (
    <View>
      <View className="pb-3">
        <Text className="text-[13px] font-semibold uppercase tracking-[1px] text-foreground">
          Community partners
        </Text>
      </View>

      <View className="border-t border-foreground pt-4">
        <CommunityPartnersCarousel
          partners={partners}
          colors={{
            text: `rgb(${fg})`,
            cardBg: `rgb(${colors.muted.replace(/ /g, ',')})`,
            fallbackBg: `rgb(${colors.primary.replace(/ /g, ',')} / 0.1)`,
            border: `rgb(${fg} / 0.2)`,
          }}
        />
      </View>
    </View>
  );
}

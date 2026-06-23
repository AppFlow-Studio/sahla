import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/src/components/ui/icon';
import type { IconName } from '@/src/components/ui/icon';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useDonation } from '@/src/providers/donation-provider';

const QUICK_ACTIONS = [
  { id: 'donate', icon: 'heart' },
  { id: 'volunteer', icon: 'account-group' },
  { id: 'advertise', icon: 'bullhorn' },
  { id: 'prayers', icon: 'clock' },
  { id: 'quran', icon: 'book-open-variant' },
] as const;

export function QuickActions() {
  const { t } = useTranslation();
  const { colors } = useMasjidConfig();
  const { open: openDonation } = useDonation();
  const router = useRouter();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ',')})`;
  const primaryRgb = `rgb(${colors.primary.replace(/ /g, ',')})`;

  const handlePress = (id: string) => {
    if (id === 'donate') openDonation();
    else if (id === 'prayers') router.push('/prayer');
    else if (id === 'advertise') router.push('/advertise');
    else if (id === 'quran') router.push('/quran');
  };

  return (
    <View className="flex-row justify-between">
      {QUICK_ACTIONS.map((action) => (
        <TouchableOpacity
          key={action.id}
          className="flex-1 items-center"
          activeOpacity={0.7}
          onPress={() => handlePress(action.id)}
        >
          <View
            className="mb-2 items-center justify-center rounded-[20px] border border-foreground/10 bg-muted"
            style={{
              height: 60,
              width: 60,
              shadowColor: fgRgb,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.02,
              shadowRadius: 14,
              elevation: 1,
            }}
          >
            <Icon
              name={action.icon as IconName}
              size={24}
              color={primaryRgb}
            />
          </View>
          <Text className="text-[8px] font-bold uppercase tracking-[1px] text-foreground/60">
            {t(`quickActions.${action.id}`)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

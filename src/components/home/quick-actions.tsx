import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

import { Icon } from '@/src/components/ui/icon';
import type { IconName } from '@/src/components/ui/icon';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useDonation } from '@/src/providers/donation-provider';

const QUICK_ACTIONS = [
  { id: 'donate', icon: 'heart', label: 'DONATE' },
  { id: 'volunteer', icon: 'account-group', label: 'VOLUNTEER' },
  { id: 'advertise', icon: 'bullhorn', label: 'ADVERTISE' },
  { id: 'prayers', icon: 'clock', label: 'PRAYERS' },
] as const;

export function QuickActions() {
  const { colors } = useMasjidConfig();
  const { open: openDonation } = useDonation();
  const router = useRouter();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ',')})`;
  const primaryRgb = `rgb(${colors.primary.replace(/ /g, ',')})`;

  const handlePress = (id: string) => {
    if (id === 'donate') openDonation();
    else if (id === 'prayers') router.push('/prayer');
    else if (id === 'advertise') router.push('/advertise');
  };

  return (
    <View className="flex-row justify-center gap-4">
      {QUICK_ACTIONS.map((action) => (
        <TouchableOpacity
          key={action.id}
          className="items-center"
          activeOpacity={0.7}
          onPress={() => handlePress(action.id)}
        >
          <View
            className="mb-2 items-center justify-center rounded-[20px] border border-foreground/10 bg-muted"
            style={{
              height: 63,
              width: 66,
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
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

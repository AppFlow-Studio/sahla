import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useDonation } from '@/src/providers/donation-provider';

const QUICK_ACTIONS = [
  { id: 'donate', icon: 'heart', label: 'DONATE' },
  { id: 'volunteer', icon: 'account-group', label: 'VOLUNTEER' },
  { id: 'advertise', icon: 'bullhorn', label: 'ADVERTISE' },
  { id: 'prayers', icon: 'clock', label: 'PRAYERS' },
] as const;

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export function QuickActions() {
  const { colors } = useMasjidConfig();
  const { open: openDonation } = useDonation();
  const router = useRouter();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ',')})`;

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
            <MaterialCommunityIcons
              name={action.icon as IconName}
              size={24}
              color={fgRgb}
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

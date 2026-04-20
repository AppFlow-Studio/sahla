import { View, Text, TouchableOpacity } from 'react-native';
import { GlassView } from 'expo-glass-effect';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useDonation } from '@/src/providers/donation-provider';

export function DonateBanner() {
  const { colors } = useMasjidConfig();
  const { open } = useDonation();
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;

  return (
    <View className="flex-row items-center justify-between rounded-full bg-primary px-4 py-3">
      <View className="flex-row items-center gap-3">
        <GlassView
          glassEffectStyle="regular"
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <Text style={{ color: accentRgb, fontSize: 20, lineHeight: 22 }}>♥</Text>
        </GlassView>
        <View>
          <Text className="text-[14px] font-bold text-primary-foreground">
            Support Your Masjid
          </Text>
          <Text className="text-[11px] text-primary-foreground/55">Donate</Text>
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.8} onPress={open}>
        <GlassView
          glassEffectStyle="regular"
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 999,
            overflow: 'hidden',
          }}
        >
          <Text style={{ color: accentRgb, fontSize: 11, fontWeight: '800' }}>
            DONATE →
          </Text>
        </GlassView>
      </TouchableOpacity>
    </View>
  );
}

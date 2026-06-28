import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFontFamily } from '@/src/hooks/use-font-family';

type Props = {
  onRestart: () => void;
  onDismiss: () => void;
};

export function UpdatesBanner({ onRestart, onDismiss }: Props) {
  const fonts = useFontFamily();
  const insets = useSafeAreaInsets();
  // Floats above the bottom tab bar (~64pt) plus the device's safe-area inset.
  const bottom = insets.bottom + 76;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom,
        zIndex: 50,
      }}
    >
      <View
        className="flex-row items-center justify-between rounded-2xl bg-foreground/90 px-4 py-3"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text
            className="text-background"
            style={{
              fontFamily: fonts.bodySemibold,
              fontWeight: '600',
              fontSize: 13,
              lineHeight: 18,
            }}
          >
            Update ready
          </Text>
          <Text
            className="text-background/70"
            style={{
              fontFamily: fonts.body,
              fontSize: 11,
              lineHeight: 16,
              marginTop: 2,
            }}
          >
            Restart to apply the latest version.
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={onDismiss}
            hitSlop={8}
            className="px-3 py-2 active:opacity-60"
          >
            <Text
              className="text-background/70"
              style={{ fontSize: 12, fontWeight: '500' }}
            >
              Later
            </Text>
          </Pressable>
          <Pressable
            onPress={onRestart}
            className="rounded-full bg-background px-4 py-2 active:opacity-80"
          >
            <Text
              className="text-foreground"
              style={{ fontSize: 12, fontWeight: '600' }}
            >
              Restart
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

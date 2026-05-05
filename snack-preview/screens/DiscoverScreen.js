import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, CONFIG, withAlpha } from '../config';

export default function DiscoverScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16 }}>
        <Text style={{ marginBottom: 24, fontSize: 30, fontWeight: 'bold', color: COLORS.foreground }}>
          Discover
        </Text>
        <View
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
            backgroundColor: withAlpha(COLORS.muted, 0.4),
            padding: 20,
          }}
        >
          <Text style={{ fontSize: 16, color: COLORS.mutedForeground }}>
            Discover content from {CONFIG.displayName} coming soon.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

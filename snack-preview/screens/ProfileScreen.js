import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, CONFIG, withAlpha } from '../config';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16 }}>
        <Text style={{ marginBottom: 24, fontSize: 30, fontWeight: 'bold', color: COLORS.foreground }}>
          Profile
        </Text>

        <View
          style={{
            marginBottom: 24,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
            backgroundColor: withAlpha(COLORS.muted, 0.4),
            padding: 16,
          }}
        >
          <Text style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, color: COLORS.mutedForeground }}>
            Masjid
          </Text>
          <Text style={{ marginTop: 4, fontSize: 16, fontWeight: '600', color: COLORS.foreground }}>
            {CONFIG.displayName}
          </Text>
          <Text style={{ marginTop: 2, fontSize: 14, color: COLORS.mutedForeground }}>
            ID: {CONFIG.id}
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.mutedForeground }}>
            Timezone: {CONFIG.timezone}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

export default function DiscoverScreen() {
  const masjid = useMasjidConfig();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerClassName="px-6 pb-10 pt-4">
        <Text className="mb-6 text-3xl font-bold text-foreground">Discover</Text>
        <View className="rounded-2xl border border-border bg-muted/40 p-5">
          <Text className="text-base text-muted-foreground">
            Discover content from {masjid.displayName} coming soon.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

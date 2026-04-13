import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DiscoverScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-xl font-semibold text-foreground">Discover</Text>
        <Text className="mt-2 text-center text-muted-foreground">Coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

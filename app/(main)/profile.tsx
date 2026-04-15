import { useAuth, useUser } from '@clerk/clerk-expo';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const masjid = useMasjidConfig();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerClassName="px-6 pb-10 pt-4">
        <Text className="mb-6 text-3xl font-bold text-foreground">Settings</Text>

        <View className="mb-6 rounded-2xl border border-border bg-muted/40 p-4">
          <Text className="text-sm uppercase tracking-wider text-muted-foreground">
            Signed in as
          </Text>
          <Text className="mt-1 text-base font-semibold text-foreground">
            {user?.primaryEmailAddress?.emailAddress ?? 'Unknown'}
          </Text>
        </View>

        <View className="mb-6 rounded-2xl border border-border bg-muted/40 p-4">
          <Text className="text-sm uppercase tracking-wider text-muted-foreground">Masjid</Text>
          <Text className="mt-1 text-base font-semibold text-foreground">{masjid.displayName}</Text>
          <Text className="mt-0.5 text-sm text-muted-foreground">ID: {masjid.id}</Text>
          <Text className="text-sm text-muted-foreground">Timezone: {masjid.timezone}</Text>
        </View>

        <Pressable
          onPress={() => signOut()}
          className="items-center justify-center rounded-lg bg-primary px-4 py-3 active:opacity-80"
        >
          <Text className="font-semibold text-primary-foreground">Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

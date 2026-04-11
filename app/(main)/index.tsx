import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

export default function HomeScreen() {
  const masjid = useMasjidConfig();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerClassName="px-6 pb-10 pt-4">
        <View className="mb-6">
          <Text className="text-sm uppercase tracking-widest text-muted-foreground">
            Assalamu alaikum
          </Text>
          <Text className="mt-1 text-3xl font-bold text-foreground">{masjid.displayName}</Text>
          {masjid.tagline ? (
            <Text className="mt-1 text-muted-foreground">{masjid.tagline}</Text>
          ) : null}
        </View>

        <View className="mb-4 rounded-2xl bg-primary p-5">
          <Text className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/80">
            Next prayer
          </Text>
          <Text className="mt-1 text-2xl font-bold text-primary-foreground">Asr · 3:42 PM</Text>
          <Text className="mt-0.5 text-primary-foreground/80">in 1h 12m</Text>
        </View>

        <Text className="mb-2 text-lg font-semibold text-foreground">Quick actions</Text>
        <View className="gap-3">
          {masjid.features.prayerTimes ? (
            <FeatureCard title="Prayer times" subtitle="Daily schedule for this masjid" />
          ) : null}
          {masjid.features.events ? (
            <FeatureCard title="Events" subtitle="Community events & programs" />
          ) : null}
          {masjid.features.announcements ? (
            <FeatureCard title="Announcements" subtitle="Latest updates from the imam" />
          ) : null}
          {masjid.features.donations ? (
            <FeatureCard title="Donate" subtitle="Support your masjid" />
          ) : null}
          {masjid.features.jumaahRegistration ? (
            <FeatureCard title="Jumu'ah sign-up" subtitle="Reserve your spot for Friday prayer" />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View className="rounded-xl border border-border bg-muted/40 p-4">
      <Text className="text-base font-semibold text-foreground">{title}</Text>
      <Text className="mt-0.5 text-sm text-muted-foreground">{subtitle}</Text>
    </View>
  );
}

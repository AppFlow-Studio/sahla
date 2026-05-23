import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { HomeHeader } from '@/src/components/home/home-header';
import { DonateBanner } from '@/src/components/home/donate-banner';
import { TodaysEvents } from '@/src/components/home/todays-events';
import { FeaturedCard } from '@/src/components/home/featured-card';
import { QuickActions } from '@/src/components/home/quick-actions';
import { ProgramsSection } from '@/src/components/home/programs-section';
import { RecommendedForYou } from '@/src/components/home/recommended-for-you';
import { CommunityPartners } from '@/src/components/home/community-partners';
import { CommunityPartnerCta } from '@/src/components/home/community-partner-cta';
import { JummahScheduleCard } from '@/src/components/home/jummah-schedule';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { usePrayerTimes } from '@/src/hooks/use-prayer-times';

const JUMMAH_HEIGHT = 360;

export default function HomeScreen() {
  const { features } = useMasjidConfig();
  const { prayers } = usePrayerTimes();
  const showJummah = features.jumaahRegistration;
  const isMaghribTime =
    prayers.find((p) => p.name === 'Maghrib')?.isActive ?? false;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(isMaghribTime && showJummah ? 1 : 0, {
      duration: 850,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [isMaghribTime, showJummah, progress]);

  const revealStyle = useAnimatedStyle(() => ({
    height: interpolate(progress.value, [0, 1], [0, JUMMAH_HEIGHT]),
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.45, 1], [0, 0, 1]),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [20, 0]) }],
  }));

  return (
    <View className="flex-1 bg-primary">
      <StatusBar style="light" />
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        <HomeHeader />

        {showJummah && (
          <Animated.View style={[{ overflow: 'hidden' }, revealStyle]}>
            <Animated.View style={cardStyle}>
              <JummahScheduleCard />
            </Animated.View>
          </Animated.View>
        )}

        <View
          className="bg-background"
          style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
        >
          <View className="gap-7 px-5 pt-5" style={{ paddingBottom: 160 }}>
            <DonateBanner />
            <TodaysEvents />
            <FeaturedCard />
            <QuickActions />
            <ProgramsSection />
            <RecommendedForYou />
            <CommunityPartners />
            <CommunityPartnerCta />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

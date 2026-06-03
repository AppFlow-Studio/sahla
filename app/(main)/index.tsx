import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
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
import { useJummahSchedule, useJummahWindow } from '@/src/hooks/use-jummah-schedule';
import { useStatusBarStyle } from '@/src/hooks/use-status-bar-style';

export default function HomeScreen() {
  // The Jummah card is driven entirely by the admin schedule: it shows whenever
  // the mosque has configured at least one slot and we're inside the weekly
  // window (Thursday Maghrib → Friday Asr).
  const { slots } = useJummahSchedule();
  const jummahWindowOpen = useJummahWindow();
  const showJummah = slots.length > 0 && jummahWindowOpen;
  useStatusBarStyle('light');
  const progress = useSharedValue(0);
  // Measured natural height of the card, so the reveal grows/shrinks with the
  // number of jummah slots instead of using a fixed height.
  const cardHeight = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(showJummah ? 1 : 0, {
      duration: 850,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [showJummah, progress]);

  const revealStyle = useAnimatedStyle(() => ({
    height: progress.value * cardHeight.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.45, 1], [0, 0, 1]),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [20, 0]) }],
  }));

  return (
    <View className="flex-1 bg-primary">

      {/* Hidden measurer: renders the card at its natural height (outside the
          clipped reveal container, which would otherwise clamp it to 0) so we
          know how far to expand the reveal. */}
      {slots.length > 0 && (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, right: 0, top: 0, opacity: 0 }}
          onLayout={(e) => {
            cardHeight.value = e.nativeEvent.layout.height;
          }}
        >
          <JummahScheduleCard />
        </View>
      )}

      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        <HomeHeader />

        {slots.length > 0 && (
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
            <View className="h-px bg-foreground/10" />
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

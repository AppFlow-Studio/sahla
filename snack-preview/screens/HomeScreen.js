import { View, ScrollView } from 'react-native';
import { COLORS } from '../config';
import { HomeHeader } from '../components/home/HomeHeader';
import { DonateBanner } from '../components/home/DonateBanner';
import { TodaysEvents } from '../components/home/TodaysEvents';
import { FeaturedCard } from '../components/home/FeaturedCard';
import { QuickActions } from '../components/home/QuickActions';
import { ProgramsSection } from '../components/home/ProgramsSection';
import { RecommendedForYou } from '../components/home/RecommendedForYou';
import { CommunityPartners } from '../components/home/CommunityPartners';
import { CommunityPartnerCta } from '../components/home/CommunityPartnerCta';
import { JummahScheduleCard } from '../components/home/JummahScheduleCard';
import { MOCK_PRAYER_TIMES } from '../mock-data';

const JUMMAH_HEIGHT = 360;

export default function HomeScreen() {
  const isMaghribTime =
    MOCK_PRAYER_TIMES.find((p) => p.name === 'Maghrib')?.isActive ?? false;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.primary }}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        <HomeHeader />

        {isMaghribTime && (
          <View style={{ height: JUMMAH_HEIGHT }}>
            <JummahScheduleCard />
          </View>
        )}

        <View
          style={{
            backgroundColor: COLORS.background,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
          }}
        >
          <View style={{ gap: 28, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 160 }}>
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

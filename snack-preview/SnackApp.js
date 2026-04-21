import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';

// ─── CONFIG ────────────────────────────────────────────────────────────────────

const COLORS = {
  primary: 'rgb(10, 38, 30)',
  primaryForeground: 'rgb(255, 251, 242)',
  accent: 'rgb(184, 146, 42)',
  accentForeground: 'rgb(10, 38, 30)',
  background: 'rgb(255, 251, 242)',
  foreground: 'rgb(10, 38, 30)',
  muted: 'rgb(241, 237, 228)',
  mutedForeground: 'rgb(92, 110, 103)',
  border: 'rgb(221, 216, 209)',
  shadow: 'rgb(0, 0, 0)',
};

function withAlpha(rgbString, alpha) {
  return rgbString.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
}

const CONFIG = {
  id: 'sahla',
  displayName: 'Sahla Demo Masjid',
  timezone: 'America/New_York',
};

// ─── MOCK DATA ─────────────────────────────────────────────────────────────────

const MOCK_CURRENT_TIME = '4:01 PM';
const MOCK_HIJRI_DATE = 'Ramadan 13, 1447';
const MOCK_NEXT_PRAYER = { name: 'Maghrib', timeRemaining: '1h 53m', type: 'iqamah' };

const MOCK_PRAYER_TIMES = [
  { name: 'Fajr', time: '5:14 AM', icon: 'weather-sunset-up', isActive: false },
  { name: 'Dhuhr', time: '5:14 AM', icon: 'white-balance-sunny', isActive: false },
  { name: 'Asr', time: '5:14 AM', icon: 'weather-sunny', isActive: false },
  { name: 'Maghrib', time: '5:14 AM', icon: 'weather-sunset-down', isActive: true },
  { name: 'Isha', time: '5:14 AM', icon: 'moon-waning-crescent', isActive: false },
];

const MOCK_EVENTS_DATE = 'MAR 9, 2026';
const MOCK_EVENTS = [
  { id: '1', time: '5:00 PM', title: 'MAS SI Soccer Program', category: 'Sports & Youth' },
  { id: '2', time: '5:00 PM', title: 'MAS SI Soccer Program', category: 'Sports & Youth' },
  { id: '3', time: '5:00 PM', title: 'MAS SI Soccer Program', category: 'Sports & Youth' },
];

const MOCK_FEATURED = {
  badge: 'Featured',
  title: 'Weekend Islamic School',
  subtitle: 'Saturdays & Sundays \u00b7 10:00 AM \u2013 1:00 PM',
};

const MOCK_QUICK_ACTIONS = [
  { id: 'donate', icon: 'heart', label: 'DONATE' },
  { id: 'volunteer', icon: 'account-group', label: 'VOLUNTEER' },
  { id: 'advertise', icon: 'bullhorn', label: 'ADVERTISE' },
  { id: 'prayers', icon: 'clock', label: 'PRAYERS' },
];

const MOCK_PROGRAMS = [
  { id: 'p1', title: 'MAS SI Soccer Program', date: 'April 10 \u2022 6pm', category: 'Sports & Youth', icon: 'soccer' },
  { id: 'p2', title: 'Quranic Wisdoms', date: 'April 11 \u2022 6pm', category: 'Quran Study', icon: 'book-open-page-variant' },
  { id: 'p3', title: 'Soulful Saturdays', date: 'April 30 \u2022 6pm', category: 'Kids', icon: 'account-child' },
];

const MOCK_RECOMMENDED = [
  { id: 'r1', title: 'Advanced Tajweed & Reading', category: 'Quran Study', icon: 'book-open-variant' },
  { id: 'r2', title: 'Young Brother Qiyam', category: 'Spirituality & Tazkiyah', icon: 'weather-night' },
];

const MOCK_COMMUNITY_PARTNER = {
  id: 'cp1',
  name: 'Sandwich City',
  address: '1805 Forest Ave @ Richmond Ave.,\nStaten Island, NY 10303',
  icon: 'food',
};

const MOCK_JUMMAH_DATE = 'Friday, March 22, 2026';
const MOCK_JUMMAH_SCHEDULE = [
  { id: 'j1', title: 'Jummah 1', speaker: 'Sh. Tarek Allan', time: '12:15 pm', icon: 'weather-sunny' },
  { id: 'j2', title: 'Jummah 2', speaker: 'Sh. Tarek Allan', time: '1:15 pm', icon: 'weather-sunset-up', isCurrent: true },
  { id: 'j3', title: 'Jummah 3', speaker: 'Sh. Tarek Allan', time: '2:15 pm', icon: 'weather-sunset-down' },
  { id: 'j4', title: 'Jummah 4', speaker: 'Sh. Tarek Allan', time: '3:15 pm', icon: 'moon-waning-crescent' },
];

// ─── HOME SCREEN COMPONENTS ───────────────────────────────────────────────────

function PrayerTimesBar() {
  const nameMuted = withAlpha(COLORS.primaryForeground, 0.4);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 }}>
      {MOCK_PRAYER_TIMES.map((prayer) => {
        const isActive = prayer.isActive;
        return (
          <View key={prayer.name} style={{ flex: 1, alignItems: 'center' }}>
            <View
              style={{
                width: 60, height: 67, borderRadius: 15,
                paddingVertical: 6, paddingHorizontal: 3,
                alignItems: 'center', justifyContent: 'space-between',
                borderWidth: isActive ? 0.5 : 0,
                borderColor: withAlpha(COLORS.accent, 0.2),
                backgroundColor: isActive ? withAlpha(COLORS.accent, 0.12) : 'transparent',
              }}
            >
              <Text style={{ fontSize: 8, fontWeight: '600', color: nameMuted, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                {prayer.name}
              </Text>
              <MaterialCommunityIcons name={prayer.icon} size={18} color={isActive ? COLORS.accent : COLORS.primaryForeground} />
              <Text style={{ fontSize: 10, fontWeight: '600', color: isActive ? COLORS.accent : COLORS.primaryForeground }}>
                {prayer.time}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function HomeHeader() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ overflow: 'hidden', backgroundColor: COLORS.primary, paddingTop: insets.top + 16 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Text style={{ color: withAlpha(COLORS.primaryForeground, 0.5), fontSize: 9, fontWeight: '700', letterSpacing: 1.62, textTransform: 'uppercase' }}>
          Assalamu Alaikum D!
        </Text>
        <Text style={{ color: COLORS.primaryForeground, fontSize: 45, lineHeight: 52, marginTop: 8, letterSpacing: -2 }}>
          {MOCK_CURRENT_TIME}
        </Text>
        <Text style={{ color: COLORS.primaryForeground, fontSize: 13, fontWeight: '600', marginTop: 4 }}>
          {MOCK_HIJRI_DATE}
        </Text>
        <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ height: 6, width: 6, borderRadius: 3, backgroundColor: COLORS.accent, marginRight: 6 }} />
          <Text style={{ fontSize: 13 }}>
            <Text style={{ color: withAlpha(COLORS.primaryForeground, 0.5) }}>{MOCK_NEXT_PRAYER.name}</Text>
            <Text style={{ color: withAlpha(COLORS.primaryForeground, 0.8) }}> {MOCK_NEXT_PRAYER.type} in {MOCK_NEXT_PRAYER.timeRemaining}</Text>
          </Text>
        </View>
      </View>
      <View style={{ marginTop: 24, paddingBottom: 24 }}>
        <PrayerTimesBar />
      </View>
    </View>
  );
}

function DonateBanner() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 999, backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(COLORS.primaryForeground, 0.1) }}>
          <Text style={{ color: COLORS.accent, fontSize: 20, lineHeight: 22 }}>{'\u2665'}</Text>
        </View>
        <View>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: COLORS.primaryForeground }}>Support Your Masjid</Text>
          <Text style={{ fontSize: 11, color: withAlpha(COLORS.primaryForeground, 0.55) }}>Donate</Text>
        </View>
      </View>
      <TouchableOpacity activeOpacity={0.8}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: withAlpha(COLORS.primaryForeground, 0.1) }}>
          <Text style={{ color: COLORS.accent, fontSize: 11, fontWeight: '800' }}>DONATE {'\u2192'}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function TodaysEvents() {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, color: COLORS.foreground }}>Today's Events</Text>
        <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.accent }}>{MOCK_EVENTS_DATE}</Text>
      </View>
      <View style={{ borderTopWidth: 1, borderTopColor: COLORS.foreground }}>
        {MOCK_EVENTS.map((event, index) => (
          <View key={event.id + index} style={{ flexDirection: 'row', alignItems: 'center', height: 58, borderBottomWidth: index < MOCK_EVENTS.length - 1 ? 1 : 0, borderBottomColor: withAlpha(COLORS.foreground, 0.15) }}>
            <Text style={{ width: 64, fontSize: 12, fontWeight: '500', textAlign: 'right', marginRight: 20, color: COLORS.foreground }}>{event.time}</Text>
            <Text style={{ flex: 1, fontSize: 12, fontWeight: '500', color: COLORS.foreground }}>{event.title}</Text>
            <Text style={{ fontSize: 9, color: COLORS.accent }}>{event.category}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function FeaturedCard() {
  return (
    <View style={{ overflow: 'hidden', borderRadius: 16, backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingBottom: 16, paddingTop: 16, minHeight: 110 }}>
      <View style={{ alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, borderColor: withAlpha(COLORS.accent, 0.4), paddingHorizontal: 10, paddingVertical: 2 }}>
        <Text style={{ fontSize: 10, color: COLORS.accent }}>{MOCK_FEATURED.badge}</Text>
      </View>
      <View style={{ marginTop: 12 }}>
        <Text style={{ fontSize: 17, fontWeight: 'bold', color: COLORS.primaryForeground }}>{MOCK_FEATURED.title}</Text>
        <Text style={{ marginTop: 4, fontSize: 11, color: withAlpha(COLORS.primaryForeground, 0.55) }}>{MOCK_FEATURED.subtitle}</Text>
      </View>
    </View>
  );
}

function QuickActions() {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
      {MOCK_QUICK_ACTIONS.map((action) => (
        <TouchableOpacity key={action.id} style={{ alignItems: 'center' }} activeOpacity={0.7}>
          <View style={{ marginBottom: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 20, borderWidth: 1, borderColor: withAlpha(COLORS.foreground, 0.1), backgroundColor: COLORS.muted, height: 63, width: 66 }}>
            <MaterialCommunityIcons name={action.icon} size={24} color={COLORS.foreground} />
          </View>
          <Text style={{ fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: withAlpha(COLORS.foreground, 0.6) }}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ProgramsSection() {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, color: COLORS.foreground }}>Programs</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={{ fontSize: 10, color: withAlpha(COLORS.foreground, 0.6) }}>SEE ALL {'\u2192'}</Text>
        </TouchableOpacity>
      </View>
      <View style={{ borderTopWidth: 1, borderTopColor: COLORS.foreground }}>
        {MOCK_PROGRAMS.map((program, index) => (
          <View key={program.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: index < MOCK_PROGRAMS.length - 1 ? 1 : 0, borderBottomColor: withAlpha(COLORS.foreground, 0.1) }}>
            <View style={{ marginRight: 12, height: 50, width: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: withAlpha(COLORS.primary, 0.1) }}>
              <MaterialCommunityIcons name={program.icon} size={24} color={COLORS.foreground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.foreground }}>{program.title}</Text>
              <Text style={{ marginTop: 2, fontSize: 10, color: withAlpha(COLORS.foreground, 0.6) }}>{program.date}</Text>
              <Text style={{ marginTop: 2, fontSize: 10, color: COLORS.accent }}>{program.category}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={16} color={withAlpha(COLORS.foreground, 0.4)} />
          </View>
        ))}
      </View>
    </View>
  );
}

function RecommendedForYou() {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, color: COLORS.foreground }}>Recommended for you</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={{ fontSize: 10, color: withAlpha(COLORS.foreground, 0.6) }}>SEE ALL {'\u2192'}</Text>
        </TouchableOpacity>
      </View>
      <View style={{ borderTopWidth: 1, borderTopColor: COLORS.foreground, paddingTop: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {MOCK_RECOMMENDED.map((item) => (
            <TouchableOpacity key={item.id} activeOpacity={0.85}>
              <View style={{ marginBottom: 8, height: 196, width: 220, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 16, backgroundColor: COLORS.primary }}>
                <MaterialCommunityIcons name={item.icon} size={64} color={withAlpha(COLORS.primaryForeground, 0.85)} />
              </View>
              <Text style={{ width: 220, fontSize: 13, fontWeight: '600', color: COLORS.foreground }}>{item.title}</Text>
              <Text style={{ width: 220, fontSize: 11, color: withAlpha(COLORS.foreground, 0.6) }}>{item.category}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

function CommunityPartners() {
  const partner = MOCK_COMMUNITY_PARTNER;
  return (
    <View>
      <View style={{ paddingBottom: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, color: COLORS.foreground }}>Community partners</Text>
      </View>
      <View style={{ borderTopWidth: 1, borderTopColor: COLORS.foreground, paddingTop: 16 }}>
        <View style={{ overflow: 'hidden', borderRadius: 16, backgroundColor: COLORS.muted }}>
          <View style={{ height: 189, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(COLORS.primary, 0.1) }}>
            <MaterialCommunityIcons name={partner.icon} size={72} color={COLORS.foreground} />
            <Text style={{ marginTop: 8, fontSize: 18, fontWeight: 'bold', color: COLORS.foreground }}>{partner.name}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: COLORS.foreground }}>{partner.address}</Text>
              <TouchableOpacity activeOpacity={0.7} style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, borderColor: COLORS.foreground, paddingHorizontal: 10, paddingVertical: 4 }}>
                <MaterialCommunityIcons name="map-marker-outline" size={12} color={COLORS.foreground} />
                <Text style={{ marginLeft: 4, fontSize: 9, fontWeight: '600', color: COLORS.foreground }}>Directions</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['phone', 'web', 'message-text-outline'].map((icon) => (
                <View key={icon} style={{ height: 26, width: 26, alignItems: 'center', justifyContent: 'center', borderRadius: 13, borderWidth: 1, borderColor: withAlpha(COLORS.foreground, 0.2) }}>
                  <MaterialCommunityIcons name={icon} size={14} color={COLORS.foreground} />
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function CommunityPartnerCta() {
  return (
    <TouchableOpacity activeOpacity={0.85}>
      <View style={{ alignItems: 'center', borderRadius: 999, backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 12 }}>
        <Text style={{ fontSize: 14, color: COLORS.primaryForeground }}>Become a Community Partner {'\u2192'}</Text>
      </View>
    </TouchableOpacity>
  );
}

function JummahScheduleCard() {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
      <View style={{ alignSelf: 'flex-start', borderWidth: 0.5, borderColor: withAlpha(COLORS.accent, 0.5), paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100 }}>
        <Text style={{ color: COLORS.accent, fontSize: 10 }}>{MOCK_JUMMAH_DATE}</Text>
      </View>
      <Text style={{ color: COLORS.primaryForeground, fontSize: 20, marginTop: 10, marginBottom: 14 }}>Jummah Schedule</Text>
      <View style={{ gap: 8 }}>
        {MOCK_JUMMAH_SCHEDULE.map((slot) => (
          <TouchableOpacity key={slot.id} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 14, backgroundColor: slot.isCurrent ? withAlpha(COLORS.accent, 0.18) : 'transparent', borderWidth: slot.isCurrent ? 0.5 : 0, borderColor: withAlpha(COLORS.accent, 0.5), paddingHorizontal: 12, paddingVertical: 10 }}>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: withAlpha(COLORS.accent, 0.18), marginRight: 12, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name={slot.icon} size={18} color={COLORS.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.primaryForeground, fontSize: 13, fontWeight: '600' }}>{slot.title}</Text>
              <Text style={{ color: withAlpha(COLORS.primaryForeground, 0.55), fontSize: 10, marginTop: 2 }}>{slot.speaker}</Text>
            </View>
            <Text style={{ color: COLORS.primaryForeground, fontSize: 13, fontWeight: '600' }}>{slot.time}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── HOME SCREEN ───────────────────────────────────────────────────────────────

function HomeScreen() {
  const isMaghribTime = MOCK_PRAYER_TIMES.find((p) => p.name === 'Maghrib')?.isActive ?? false;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.primary }}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        <HomeHeader />
        {isMaghribTime && (
          <View style={{ height: 360 }}>
            <JummahScheduleCard />
          </View>
        )}
        <View style={{ backgroundColor: COLORS.background, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}>
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

// ─── DISCOVER SCREEN ───────────────────────────────────────────────────────────

function DiscoverScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16 }}>
        <Text style={{ marginBottom: 24, fontSize: 30, fontWeight: 'bold', color: COLORS.foreground }}>Discover</Text>
        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: withAlpha(COLORS.muted, 0.4), padding: 20 }}>
          <Text style={{ fontSize: 16, color: COLORS.mutedForeground }}>Discover content from {CONFIG.displayName} coming soon.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── LIBRARY SCREEN ────────────────────────────────────────────────────────────

const libPalette = {
  brandDark: COLORS.primary,
  cream: COLORS.background,
  gold: COLORS.accent,
  goldTint15: withAlpha(COLORS.accent, 0.15),
  mutedInk: withAlpha(COLORS.primary, 0.6),
  divider: withAlpha(COLORS.primary, 0.1),
  veryLightBg: withAlpha(COLORS.primary, 0.03),
};

const libStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: libPalette.cream },
  scroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
  title: { fontSize: 30, fontWeight: '500', color: libPalette.brandDark, marginBottom: 20 },
  quranCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, borderColor: libPalette.divider, backgroundColor: libPalette.cream },
  quranIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: libPalette.goldTint15, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  quranIcon: { color: libPalette.gold, fontSize: 22 },
  quranTitle: { fontSize: 16, fontWeight: '600', color: libPalette.brandDark },
  quranSubtitle: { fontSize: 12, color: libPalette.mutedInk, marginTop: 2 },
  chevron: { fontSize: 22, color: libPalette.mutedInk, marginLeft: 6 },
  placeholder: { marginTop: 16, padding: 18, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, borderColor: libPalette.divider, backgroundColor: libPalette.veryLightBg },
  placeholderText: { color: libPalette.mutedInk, fontSize: 13 },
});

function LibraryScreen() {
  return (
    <SafeAreaView style={libStyles.root} edges={['top']}>
      <ScrollView contentContainerStyle={libStyles.scroll}>
        <Text style={libStyles.title}>Library</Text>
        <Pressable style={libStyles.quranCard}>
          <View style={libStyles.quranIconWrap}>
            <Text style={libStyles.quranIcon}>{'\u06DD'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={libStyles.quranTitle}>Quran</Text>
            <Text style={libStyles.quranSubtitle}>114 Chapters of the Holy Quran</Text>
          </View>
          <Text style={libStyles.chevron}>{'\u203A'}</Text>
        </Pressable>
        <View style={libStyles.placeholder}>
          <Text style={libStyles.placeholderText}>More resources coming soon.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── PRAYER SCREEN ─────────────────────────────────────────────────────────────

const PRAYERS = [
  { name: 'Fajr', athan: '5:50 AM', iqamah: '6:10 AM', status: 'passed', statusLabel: 'Passed' },
  { name: 'Dhuhr', athan: '1:05 PM', iqamah: '1:15 PM', status: 'next', statusLabel: 'Next in 0h 55m' },
  { name: 'Asr', athan: '4:28 PM', iqamah: '5:00 PM', status: 'upcoming', statusLabel: '' },
  { name: 'Maghrib', athan: '7:05 PM', iqamah: '7:10 PM', status: 'upcoming', statusLabel: '' },
  { name: 'Isha', athan: '8:20 PM', iqamah: '8:30 PM', status: 'upcoming', statusLabel: '' },
];

const pc = {
  bg: COLORS.primary,
  gold: COLORS.accent,
  goldSoft: withAlpha(COLORS.accent, 0.15),
  text: COLORS.primaryForeground,
  muted: withAlpha(COLORS.primaryForeground, 0.55),
  ringDim: withAlpha(COLORS.primaryForeground, 0.28),
  iconBg: withAlpha(COLORS.primaryForeground, 0.06),
  highlight: 'rgb(7, 31, 24)',
  shadow: COLORS.shadow,
  depth30: 'rgba(7, 31, 24, 0.85)',
  depth35: 'rgba(7, 31, 24, 0.95)',
  divider10: withAlpha(COLORS.primaryForeground, 0.1),
  divider12: withAlpha(COLORS.primaryForeground, 0.12),
  divider15: withAlpha(COLORS.primaryForeground, 0.15),
  border20: withAlpha(COLORS.primaryForeground, 0.2),
  border25: withAlpha(COLORS.primaryForeground, 0.25),
  ringTrack: withAlpha(COLORS.primaryForeground, 0.08),
};

const STARS = [
  { x: 14, y: 12, size: 10, max: 1, delay: 0, duration: 1600 },
  { x: 72, y: 6, size: 6, max: 0.9, delay: 800, duration: 2200 },
  { x: 188, y: 2, size: 7, max: 1, delay: 400, duration: 1900 },
  { x: 288, y: 8, size: 12, max: 1, delay: 1200, duration: 2400 },
  { x: 356, y: 18, size: 8, max: 0.95, delay: 200, duration: 2000 },
  { x: 8, y: 70, size: 6, max: 0.85, delay: 1500, duration: 1700 },
  { x: 22, y: 190, size: 7, max: 0.9, delay: 600, duration: 2100 },
  { x: 360, y: 70, size: 9, max: 1, delay: 1000, duration: 2300 },
  { x: 352, y: 200, size: 5, max: 0.8, delay: 300, duration: 1800 },
  { x: 4, y: 300, size: 5, max: 0.75, delay: 1400, duration: 2000 },
  { x: 362, y: 300, size: 6, max: 0.85, delay: 900, duration: 2200 },
];

function parseTimeToHours(time) {
  const m = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return 0;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const period = m[3]?.toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h + min / 60;
}

function CountdownRing({ nowHours }) {
  const size = 340;
  const cx = size / 2;
  const cy = size / 2;
  const r = 128;
  const tickOuter = 146;
  const tickInnerMinor = 142;
  const tickInnerMajor = 137;
  const circumference = 2 * Math.PI * r;
  const progress = nowHours / 24;
  const dashOffset = circumference * (1 - progress);
  const TICK_COUNT = 96;
  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => i);
  const angleRad = ((nowHours / 24) * 360 - 90) * (Math.PI / 180);
  const nowPoint = { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };

  return (
    <Svg width={size} height={size}>
      {ticks.map((i) => {
        const angle = ((i / TICK_COUNT) * 360 - 90) * (Math.PI / 180);
        const isHour = i % 4 === 0;
        const isQuarterDay = i % 24 === 0;
        const inner = isQuarterDay ? tickInnerMajor : isHour ? tickInnerMajor + 2 : tickInnerMinor;
        return (
          <Line key={i} x1={cx + inner * Math.cos(angle)} y1={cy + inner * Math.sin(angle)} x2={cx + tickOuter * Math.cos(angle)} y2={cy + tickOuter * Math.sin(angle)} stroke={pc.ringDim} strokeWidth={isQuarterDay ? 1.6 : isHour ? 1.2 : 0.7} strokeLinecap="round" />
        );
      })}
      <Circle cx={cx} cy={cy} r={r} stroke={pc.gold} strokeWidth={3} fill="none" strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={dashOffset} transform={`rotate(-90 ${cx} ${cy})`} />
      <Circle cx={nowPoint.x} cy={nowPoint.y} r={6} fill={pc.gold} />
    </Svg>
  );
}

function PrayerSparkle({ size: s, color }) {
  const cx = s / 2;
  const arm = s / 2;
  const waist = s * 0.08;
  const d = `M ${cx} ${cx - arm} Q ${cx + waist} ${cx} ${cx + arm} ${cx} Q ${cx + waist} ${cx} ${cx} ${cx + arm} Q ${cx - waist} ${cx} ${cx - arm} ${cx} Q ${cx - waist} ${cx} ${cx} ${cx - arm} Z`;
  return <Svg width={s} height={s}><Path d={d} fill={color} /></Svg>;
}

function TwinklingStar({ star, color }) {
  const opacity = useSharedValue(0.1);
  const scale = useSharedValue(0.7);
  useEffect(() => {
    opacity.value = withDelay(star.delay, withRepeat(withSequence(withTiming(star.max, { duration: star.duration / 2, easing: Easing.inOut(Easing.quad) }), withTiming(0.1, { duration: star.duration / 2, easing: Easing.inOut(Easing.quad) })), -1, false));
    scale.value = withDelay(star.delay, withRepeat(withSequence(withTiming(1, { duration: star.duration / 2, easing: Easing.inOut(Easing.quad) }), withTiming(0.7, { duration: star.duration / 2, easing: Easing.inOut(Easing.quad) })), -1, false));
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[{ position: 'absolute', top: star.y, left: star.x }, animatedStyle]}>
      <PrayerSparkle size={star.size} color={color} />
    </Animated.View>
  );
}

function StarField({ color }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 360 }}>
      {STARS.map((s, i) => <TwinklingStar key={i} star={s} color={color} />)}
    </View>
  );
}

function PrayerProgressRing({ progress, size: sz = 72, stroke = 5, color, track }) {
  const r = (sz - stroke) / 2;
  const cx = sz / 2;
  const cy = sz / 2;
  const circ = 2 * Math.PI * r;
  return (
    <Svg width={sz} height={sz}>
      <Circle cx={cx} cy={cy} r={r} stroke={track} strokeWidth={stroke} fill="none" />
      <Circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${circ} ${circ}`} strokeDashoffset={circ * (1 - progress)} transform={`rotate(-90 ${cx} ${cy})`} />
    </Svg>
  );
}

const PERIOD_OPTIONS = [
  { key: 'day', short: 'Daily', long: 'today' },
  { key: 'month', short: 'Monthly', long: 'this month' },
  { key: 'year', short: 'Yearly', long: 'this year' },
];

function PeriodToggle({ value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', alignSelf: 'flex-start', borderRadius: 999, backgroundColor: pc.iconBg, padding: 3 }}>
      {PERIOD_OPTIONS.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable key={opt.key} onPress={() => onChange(opt.key)} hitSlop={4} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: active ? pc.goldSoft : 'transparent' }}>
            <Text style={{ color: active ? pc.gold : pc.muted, fontSize: 11, fontWeight: active ? '700' : '500', letterSpacing: 0.5 }}>{opt.short}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function DailyQuranGoalCard() {
  const [period, setPeriod] = useState('day');
  const pages = 1, goal = 2, percent = 0.5;
  const periodLabel = PERIOD_OPTIONS.find((o) => o.key === period)?.long ?? 'today';
  const remaining = Math.max(0, goal - pages);
  const ringSize = 64;

  return (
    <View style={{ borderRadius: 22, paddingHorizontal: 20, paddingVertical: 20, backgroundColor: pc.depth30, marginTop: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: withAlpha(COLORS.primaryForeground, 0.1) }}>
          <MaterialCommunityIcons name="book-open-page-variant" size={16} color={pc.gold} />
        </View>
        <Text style={{ color: pc.text, fontSize: 24, fontWeight: '400' }}>Quran Goal</Text>
      </View>
      <PeriodToggle value={period} onChange={setPeriod} />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 18 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: pc.text, fontSize: 20, fontWeight: '700' }}>{pages} / {goal} pages</Text>
          <Text style={{ color: pc.muted, fontSize: 12, marginTop: 6 }}>{periodLabel} <Text style={{ color: pc.gold }}>{'\u2022'} {remaining} left</Text></Text>
          <Pressable style={{ alignSelf: 'flex-start', marginTop: 14 }}>
            <View style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: withAlpha(COLORS.primaryForeground, 0.1) }}>
              <Text style={{ color: pc.text, fontSize: 12, fontWeight: '500' }}>Continue Reading</Text>
            </View>
          </Pressable>
        </View>
        <View style={{ width: ringSize, height: ringSize, alignItems: 'center', justifyContent: 'center' }}>
          <PrayerProgressRing progress={percent} size={ringSize} stroke={4} color={pc.gold} track={pc.ringTrack} />
          <Text style={{ position: 'absolute', color: pc.text, fontSize: 22 }}>{Math.round(percent * 100)}%</Text>
        </View>
      </View>
      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: pc.divider12, marginTop: 22, marginBottom: 4 }} />
      <View style={{ marginTop: 18, marginBottom: 16 }}>
        <Text style={{ color: pc.text, fontSize: 24, fontWeight: '400', marginBottom: 22 }}>Remembrances</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="weather-sunny" size={18} color={pc.gold} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: pc.text, fontSize: 13, fontWeight: '600' }}>Morning Athkar</Text>
              <Text style={{ color: pc.muted, fontSize: 11, marginTop: 2 }}>42 Prayers {'\u2022'} 12m</Text>
            </View>
          </View>
          <View style={{ width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: pc.divider15, marginHorizontal: 18 }} />
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="moon-waning-crescent" size={18} color={pc.gold} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: pc.text, fontSize: 13, fontWeight: '600' }}>Evening Athkar</Text>
              <Text style={{ color: pc.muted, fontSize: 11, marginTop: 2 }}>42 Prayers {'\u2022'} 12m</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function PrayerSupportCard() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 999, backgroundColor: pc.depth30, paddingHorizontal: 16, paddingVertical: 12, marginTop: 32 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(COLORS.primaryForeground, 0.1) }}>
          <Text style={{ color: pc.gold, fontSize: 20, lineHeight: 22 }}>{'\u2665'}</Text>
        </View>
        <View>
          <Text style={{ color: pc.text, fontSize: 14, fontWeight: '700' }}>Support Your Masjid</Text>
          <Text style={{ color: pc.muted, fontSize: 11, marginTop: 1 }}>Donate</Text>
        </View>
      </View>
      <Pressable>
        <View style={{ borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: withAlpha(COLORS.primaryForeground, 0.1) }}>
          <Text style={{ color: pc.gold, fontSize: 11, fontWeight: '800' }}>DONATE {'\u2192'}</Text>
        </View>
      </Pressable>
    </View>
  );
}

function PrayerCommunitySection() {
  const iconBtn = { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: pc.border20, alignItems: 'center', justifyContent: 'center' };
  return (
    <View style={{ marginTop: 32 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: pc.border20, paddingBottom: 10, marginBottom: 16 }}>
        <Text style={{ color: pc.text, fontSize: 12, fontWeight: '700', letterSpacing: 2 }}>COMMUNITY PARTNERS</Text>
      </View>
      <View style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: pc.depth35 }}>
        <View style={{ width: '100%', aspectRatio: 16 / 10, backgroundColor: withAlpha(COLORS.primaryForeground, 0.05), alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name="food" size={48} color={pc.muted} />
        </View>
        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          <Text style={{ color: pc.text, fontSize: 13, lineHeight: 18 }}>1805 Forest Ave @ Richmond AVe.,{'\n'}Staten Island, NY 10303</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
            <Pressable style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: pc.border25 }}>
              <MaterialCommunityIcons name="map-marker-outline" size={14} color={pc.text} />
              <Text style={{ color: pc.text, fontSize: 13, fontWeight: '500', marginLeft: 6 }}>Directions</Text>
            </Pressable>
            <View style={{ flexDirection: 'row' }}>
              <Pressable style={[iconBtn, { marginRight: 8 }]}><MaterialCommunityIcons name="phone-outline" size={16} color={pc.text} /></Pressable>
              <Pressable style={[iconBtn, { marginRight: 8 }]}><MaterialCommunityIcons name="message-text-outline" size={16} color={pc.text} /></Pressable>
              <Pressable style={iconBtn}><MaterialCommunityIcons name="email-outline" size={16} color={pc.text} /></Pressable>
            </View>
          </View>
        </View>
      </View>
      <Pressable style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, marginTop: 16, borderRadius: 20, backgroundColor: pc.depth35 }}>
        <Text style={{ color: pc.text, fontSize: 14, fontWeight: '500', marginRight: 6 }}>Become a Community Partner</Text>
        <MaterialCommunityIcons name="arrow-right" size={16} color={pc.text} />
      </Pressable>
    </View>
  );
}

function PrayerRowItem({ row, showDivider }) {
  const isNext = row.status === 'next';
  const isPassed = row.status === 'passed';
  return (
    <View style={{ borderRadius: 18, paddingVertical: 14, paddingHorizontal: 14, marginBottom: 12, backgroundColor: isNext ? pc.goldSoft : 'transparent', flexDirection: 'row', alignItems: 'center', borderBottomWidth: showDivider ? StyleSheet.hairlineWidth : 0, borderBottomColor: pc.divider10 }}>
      <View style={{ width: 40, alignItems: 'center', marginRight: 12 }}>
        <MaterialCommunityIcons name="weather-sunny" size={22} color={isNext ? pc.gold : isPassed ? pc.muted : pc.text} />
      </View>
      <View style={{ flex: 1.1 }}>
        <Text style={{ color: isPassed ? pc.muted : pc.text, fontSize: 16, fontWeight: '600' }}>{row.name}</Text>
        {row.statusLabel ? <Text style={{ color: isNext ? pc.gold : pc.muted, fontSize: 11, marginTop: 2 }}>{row.statusLabel}</Text> : null}
      </View>
      <Text style={{ color: isPassed ? pc.muted : pc.text, fontSize: 14, flex: 0.9, textAlign: 'center' }}>{row.athan}</Text>
      <Text style={{ color: isNext ? pc.gold : isPassed ? pc.muted : pc.text, fontSize: 14, fontWeight: isNext ? '600' : '400', flex: 0.9, textAlign: 'center' }}>{row.iqamah}</Text>
      <View style={{ width: 20, alignItems: 'flex-end' }}>
        {!isPassed ? <MaterialCommunityIcons name={isNext ? 'bell' : 'bell-outline'} size={16} color={isNext ? pc.gold : pc.muted} /> : null}
      </View>
    </View>
  );
}

function PrayerScreen() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <View style={{ flex: 1, backgroundColor: pc.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={{ paddingBottom: 160 }}>
          <View style={{ position: 'relative' }}>
            <StarField color={pc.gold} />
            <View style={{ alignItems: 'center', marginTop: 12 }}>
              <View style={{ width: 340, height: 340, alignItems: 'center', justifyContent: 'center' }}>
                <View pointerEvents="none" style={{ position: 'absolute', width: 320, height: 320, borderRadius: 160, backgroundColor: pc.bg, shadowColor: pc.text, shadowOffset: { width: 16, height: 0 }, shadowOpacity: 0.1, shadowRadius: 14 }} />
                <View pointerEvents="none" style={{ position: 'absolute', width: 320, height: 320, borderRadius: 160, backgroundColor: pc.bg, shadowColor: pc.shadow, shadowOffset: { width: -38, height: 0 }, shadowOpacity: 0.95, shadowRadius: 22, elevation: 20 }} />
                <View pointerEvents="none" style={{ position: 'absolute', width: 252, height: 252, borderRadius: 126, backgroundColor: pc.highlight }} />
                <CountdownRing nowHours={now.getHours() + now.getMinutes() / 60} />
                <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: pc.text, fontSize: 12, letterSpacing: 3, fontWeight: '500', marginBottom: 4 }}>ASR IN</Text>
                  <Text style={{ color: pc.text, fontSize: 56, fontWeight: '300', letterSpacing: 1 }}>00:55</Text>
                  <View style={{ marginTop: 8, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999, backgroundColor: withAlpha(COLORS.primaryForeground, 0.1) }}>
                    <Text style={{ color: pc.gold, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>{currentTime} CURRENT</Text>
                  </View>
                </View>
              </View>
            </View>
            <Text style={{ color: pc.text, fontSize: 44, textAlign: 'center', marginTop: 24, fontWeight: '400' }}>Prayer Times</Text>
          </View>
          <View style={{ paddingHorizontal: 20, marginTop: 56 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: pc.depth30, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14 }}>
              <Pressable hitSlop={12}><MaterialCommunityIcons name="chevron-left" size={22} color={pc.muted} /></Pressable>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: pc.text, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }}>THURSDAY, MAR, 2026</Text>
                <Text style={{ color: pc.gold, fontSize: 10, marginTop: 2 }}>Ramadan 30, 1447</Text>
              </View>
              <Pressable hitSlop={12}><MaterialCommunityIcons name="chevron-right" size={22} color={pc.muted} /></Pressable>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 12, paddingHorizontal: 14 }}>
              <View style={{ width: 40, marginRight: 12 }} />
              <Text style={{ color: pc.muted, fontSize: 11, letterSpacing: 2, flex: 1.1 }}>PRAYER</Text>
              <Text style={{ color: pc.muted, fontSize: 11, letterSpacing: 2, flex: 0.9, textAlign: 'center' }}>ATHAN</Text>
              <Text style={{ color: pc.muted, fontSize: 11, letterSpacing: 2, flex: 0.9, textAlign: 'center' }}>IQAMAH</Text>
              <View style={{ width: 20 }} />
            </View>
            {PRAYERS.map((p, i) => {
              const isPassed = p.status === 'passed';
              const isNext = p.status === 'next';
              const nextRow = PRAYERS[i + 1];
              const showDivider = !isPassed && !isNext && nextRow?.status !== 'next';
              return <PrayerRowItem key={p.name} row={p} showDivider={showDivider} />;
            })}
            <DailyQuranGoalCard />
            <PrayerSupportCard />
            <PrayerCommunitySection />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── PROFILE SCREEN ────────────────────────────────────────────────────────────

function ProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16 }}>
        <Text style={{ marginBottom: 24, fontSize: 30, fontWeight: 'bold', color: COLORS.foreground }}>Profile</Text>
        <View style={{ marginBottom: 24, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: withAlpha(COLORS.muted, 0.4), padding: 16 }}>
          <Text style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, color: COLORS.mutedForeground }}>Masjid</Text>
          <Text style={{ marginTop: 4, fontSize: 16, fontWeight: '600', color: COLORS.foreground }}>{CONFIG.displayName}</Text>
          <Text style={{ marginTop: 2, fontSize: 14, color: COLORS.mutedForeground }}>ID: {CONFIG.id}</Text>
          <Text style={{ fontSize: 14, color: COLORS.mutedForeground }}>Timezone: {CONFIG.timezone}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── APP ────────────────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: COLORS.accent,
            tabBarInactiveTintColor: COLORS.mutedForeground,
            tabBarStyle: { backgroundColor: COLORS.background, borderTopColor: COLORS.border },
          }}
        >
          <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home" size={size} color={color} /> }} />
          <Tab.Screen name="Discover" component={DiscoverScreen} options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="compass-outline" size={size} color={color} /> }} />
          <Tab.Screen name="Library" component={LibraryScreen} options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="bookshelf" size={size} color={color} /> }} />
          <Tab.Screen name="Prayer" component={PrayerScreen} options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="moon-waning-crescent" size={size} color={color} /> }} />
          <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account" size={size} color={color} /> }} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

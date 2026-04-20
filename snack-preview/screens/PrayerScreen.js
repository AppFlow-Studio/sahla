import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { COLORS, withAlpha } from '../config';

function rgb(triplet, alpha = 1) {
  // Already resolved to rgb() strings in this snack version
  return triplet;
}

const PRAYERS = [
  { name: 'Fajr', athan: '5:50 AM', iqamah: '6:10 AM', status: 'passed', statusLabel: 'Passed' },
  { name: 'Dhuhr', athan: '1:05 PM', iqamah: '1:15 PM', status: 'next', statusLabel: 'Next in 0h 55m' },
  { name: 'Asr', athan: '4:28 PM', iqamah: '5:00 PM', status: 'upcoming', statusLabel: '' },
  { name: 'Maghrib', athan: '7:05 PM', iqamah: '7:10 PM', status: 'upcoming', statusLabel: '' },
  { name: 'Isha', athan: '8:20 PM', iqamah: '8:30 PM', status: 'upcoming', statusLabel: '' },
];

const c = {
  bg: COLORS.primary,
  gold: COLORS.accent,
  goldSoft: withAlpha(COLORS.accent, 0.15),
  goldBorder: withAlpha(COLORS.accent, 0.5),
  text: COLORS.primaryForeground,
  muted: withAlpha(COLORS.primaryForeground, 0.55),
  ringDim: withAlpha(COLORS.primaryForeground, 0.28),
  rowBg: withAlpha(COLORS.primaryForeground, 0.04),
  iconBg: withAlpha(COLORS.primaryForeground, 0.06),
  iconBgActive: withAlpha(COLORS.accent, 0.25),
  goldGlass: withAlpha(COLORS.accent, 0.45),
  highlight: 'rgb(7, 31, 24)',
  highlightBorder: 'rgb(7, 31, 24)',
  haloOuter: withAlpha(COLORS.primaryForeground, 0.035),
  depth: 'rgb(7, 31, 24)',
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

function CountdownRing({ prayers, nowHours }) {
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

  const angleForHour = (h) => (h / 24) * 360 - 90;
  const pointForHour = (h, radius = r) => {
    const rad = (angleForHour(h) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const nowPoint = pointForHour(nowHours);

  return (
    <Svg width={size} height={size}>
      {ticks.map((i) => {
        const angle = ((i / TICK_COUNT) * 360 - 90) * (Math.PI / 180);
        const isHour = i % 4 === 0;
        const isQuarterDay = i % 24 === 0;
        const inner = isQuarterDay ? tickInnerMajor : isHour ? tickInnerMajor + 2 : tickInnerMinor;
        const outer = tickOuter;
        const x1 = cx + inner * Math.cos(angle);
        const y1 = cy + inner * Math.sin(angle);
        const x2 = cx + outer * Math.cos(angle);
        const y2 = cy + outer * Math.sin(angle);
        return (
          <Line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={c.ringDim}
            strokeWidth={isQuarterDay ? 1.6 : isHour ? 1.2 : 0.7}
            strokeLinecap="round"
          />
        );
      })}
      <Circle
        cx={cx} cy={cy} r={r}
        stroke={c.gold}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <Circle cx={nowPoint.x} cy={nowPoint.y} r={6} fill={c.gold} />
    </Svg>
  );
}

function Sparkle({ size: s, color }) {
  const cx = s / 2;
  const arm = s / 2;
  const waist = s * 0.08;
  const d = `M ${cx} ${cx - arm} Q ${cx + waist} ${cx} ${cx + arm} ${cx} Q ${cx + waist} ${cx} ${cx} ${cx + arm} Q ${cx - waist} ${cx} ${cx - arm} ${cx} Q ${cx - waist} ${cx} ${cx} ${cx - arm} Z`;
  return (
    <Svg width={s} height={s}>
      <Path d={d} fill={color} />
    </Svg>
  );
}

function TwinklingStar({ star, color }) {
  const opacity = useSharedValue(0.1);
  const scale = useSharedValue(0.7);

  useEffect(() => {
    opacity.value = withDelay(
      star.delay,
      withRepeat(
        withSequence(
          withTiming(star.max, { duration: star.duration / 2, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.1, { duration: star.duration / 2, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
    scale.value = withDelay(
      star.delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: star.duration / 2, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.7, { duration: star.duration / 2, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ position: 'absolute', top: star.y, left: star.x }, animatedStyle]}>
      <Sparkle size={star.size} color={color} />
    </Animated.View>
  );
}

function StarField({ color }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 360 }}>
      {STARS.map((s, i) => (
        <TwinklingStar key={i} star={s} color={color} />
      ))}
    </View>
  );
}

function ProgressRing({ progress, size: sz = 72, stroke = 5, color, track }) {
  const r = (sz - stroke) / 2;
  const cx = sz / 2;
  const cy = sz / 2;
  const circ = 2 * Math.PI * r;
  return (
    <Svg width={sz} height={sz}>
      <Circle cx={cx} cy={cy} r={r} stroke={track} strokeWidth={stroke} fill="none" />
      <Circle
        cx={cx} cy={cy} r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${circ} ${circ}`}
        strokeDashoffset={circ * (1 - progress)}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
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
    <View style={{ flexDirection: 'row', alignSelf: 'flex-start', borderRadius: 999, backgroundColor: c.iconBg, padding: 3 }}>
      {PERIOD_OPTIONS.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            hitSlop={4}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: active ? c.goldSoft : 'transparent',
            }}
          >
            <Text style={{ color: active ? c.gold : c.muted, fontSize: 11, fontWeight: active ? '700' : '500', letterSpacing: 0.5 }}>
              {opt.short}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function RemembranceItem({ icon, title, meta }) {
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
      <MaterialCommunityIcons name={icon} size={18} color={c.gold} style={{ marginRight: 10 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>{title}</Text>
        <Text style={{ color: c.muted, fontSize: 11, marginTop: 2 }}>{meta}</Text>
      </View>
    </View>
  );
}

function RemembrancesSection() {
  return (
    <View style={{ marginTop: 18, marginBottom: 16 }}>
      <Text style={{ color: c.text, fontSize: 24, fontWeight: '400', marginBottom: 22 }}>
        Remembrances
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <RemembranceItem icon="weather-sunny" title="Morning Athkar" meta="42 Prayers \u2022 12m" />
        <View style={{ width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: c.divider15, marginHorizontal: 18 }} />
        <RemembranceItem icon="moon-waning-crescent" title="Evening Athkar" meta="42 Prayers \u2022 12m" />
      </View>
    </View>
  );
}

function DailyQuranGoalCard() {
  const [period, setPeriod] = useState('day');
  // Mock values instead of real tracker
  const pages = 1;
  const goal = 2;
  const percent = 0.5;
  const periodLabel = PERIOD_OPTIONS.find((o) => o.key === period)?.long ?? 'today';
  const remaining = Math.max(0, goal - pages);
  const ringSize = 64;

  return (
    <View style={{ borderRadius: 22, paddingHorizontal: 20, paddingVertical: 20, backgroundColor: c.depth30, marginTop: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: withAlpha(COLORS.primaryForeground, 0.1) }}>
          <MaterialCommunityIcons name="book-open-page-variant" size={16} color={c.gold} />
        </View>
        <Text style={{ color: c.text, fontSize: 24, fontWeight: '400' }}>Quran Goal</Text>
      </View>

      <PeriodToggle value={period} onChange={setPeriod} />

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 18 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>
            {pages} / {goal} pages
          </Text>
          <Text style={{ color: c.muted, fontSize: 12, marginTop: 6 }}>
            {remaining === 0 ? (
              <Text style={{ color: c.gold }}>Goal reached {periodLabel}</Text>
            ) : (
              <>
                {periodLabel} <Text style={{ color: c.gold }}>{'\u2022'} {remaining} left</Text>
              </>
            )}
          </Text>
          <Pressable style={{ alignSelf: 'flex-start', marginTop: 14 }}>
            <View style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: withAlpha(COLORS.primaryForeground, 0.1) }}>
              <Text style={{ color: c.text, fontSize: 12, fontWeight: '500' }}>Continue Reading</Text>
            </View>
          </Pressable>
        </View>

        <View style={{ width: ringSize, height: ringSize, alignItems: 'center', justifyContent: 'center' }}>
          <ProgressRing progress={percent} size={ringSize} stroke={4} color={c.gold} track={c.ringTrack} />
          <View style={{ position: 'absolute', top: 2, right: 10 }}>
            <Sparkle size={6} color={c.gold} />
          </View>
          <Text style={{ position: 'absolute', color: c.text, fontSize: 22 }}>
            {Math.round(percent * 100)}%
          </Text>
        </View>
      </View>

      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.divider12, marginTop: 22, marginBottom: 4 }} />
      <RemembrancesSection />
    </View>
  );
}

function SupportMasjidCard() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 999, backgroundColor: c.depth30, paddingHorizontal: 16, paddingVertical: 12, marginTop: 32 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(COLORS.primaryForeground, 0.1) }}>
          <Text style={{ color: c.gold, fontSize: 20, lineHeight: 22 }}>{'\u2665'}</Text>
        </View>
        <View>
          <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>Support Your Masjid</Text>
          <Text style={{ color: c.muted, fontSize: 11, marginTop: 1 }}>Donate</Text>
        </View>
      </View>
      <Pressable>
        <View style={{ borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: withAlpha(COLORS.primaryForeground, 0.1) }}>
          <Text style={{ color: c.gold, fontSize: 11, fontWeight: '800' }}>DONATE {'\u2192'}</Text>
        </View>
      </Pressable>
    </View>
  );
}

function CommunityPartnersSection() {
  const iconBtn = {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, borderColor: c.border20,
    alignItems: 'center', justifyContent: 'center',
  };

  return (
    <View style={{ marginTop: 32 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border20, paddingBottom: 10, marginBottom: 16 }}>
        <Text style={{ color: c.text, fontSize: 12, fontWeight: '700', letterSpacing: 2 }}>COMMUNITY PARTNERS</Text>
      </View>

      <View style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: c.depth35 }}>
        <View style={{ width: '100%', aspectRatio: 16 / 10, backgroundColor: withAlpha(COLORS.primaryForeground, 0.05), alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name="food" size={48} color={c.muted} />
        </View>

        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          <Text style={{ color: c.text, fontSize: 13, lineHeight: 18 }}>
            1805 Forest Ave @ Richmond AVe.,{'\n'}Staten Island, NY 10303
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
            <Pressable style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: c.border25 }}>
              <MaterialCommunityIcons name="map-marker-outline" size={14} color={c.text} />
              <Text style={{ color: c.text, fontSize: 13, fontWeight: '500', marginLeft: 6 }}>Directions</Text>
            </Pressable>
            <View style={{ flexDirection: 'row' }}>
              <Pressable style={[iconBtn, { marginRight: 8 }]}>
                <MaterialCommunityIcons name="phone-outline" size={16} color={c.text} />
              </Pressable>
              <Pressable style={[iconBtn, { marginRight: 8 }]}>
                <MaterialCommunityIcons name="message-text-outline" size={16} color={c.text} />
              </Pressable>
              <Pressable style={iconBtn}>
                <MaterialCommunityIcons name="email-outline" size={16} color={c.text} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      <Pressable style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, marginTop: 16, borderRadius: 20, backgroundColor: c.depth35 }}>
        <Text style={{ color: c.text, fontSize: 14, fontWeight: '500', marginRight: 6 }}>Become a Community Partner</Text>
        <MaterialCommunityIcons name="arrow-right" size={16} color={c.text} />
      </Pressable>
    </View>
  );
}

function PrayerRowItem({ row, showDivider }) {
  const isNext = row.status === 'next';
  const isPassed = row.status === 'passed';

  return (
    <View
      style={{
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 14,
        marginBottom: 12,
        backgroundColor: isNext ? c.goldSoft : 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: showDivider ? StyleSheet.hairlineWidth : 0,
        borderBottomColor: c.divider10,
      }}
    >
      <View style={{ width: 40, alignItems: 'center', marginRight: 12 }}>
        <MaterialCommunityIcons
          name="weather-sunny"
          size={22}
          color={isNext ? c.gold : isPassed ? c.muted : c.text}
        />
      </View>
      <View style={{ flex: 1.1 }}>
        <Text style={{ color: isPassed ? c.muted : c.text, fontSize: 16, fontWeight: '600' }}>
          {row.name}
        </Text>
        {row.statusLabel ? (
          <Text style={{ color: isNext ? c.gold : c.muted, fontSize: 11, marginTop: 2 }}>
            {row.statusLabel}
          </Text>
        ) : null}
      </View>
      <Text style={{ color: isPassed ? c.muted : c.text, fontSize: 14, flex: 0.9, textAlign: 'center' }}>
        {row.athan}
      </Text>
      <Text style={{ color: isNext ? c.gold : isPassed ? c.muted : c.text, fontSize: 14, fontWeight: isNext ? '600' : '400', flex: 0.9, textAlign: 'center' }}>
        {row.iqamah}
      </Text>
      <View style={{ width: 20, alignItems: 'flex-end' }}>
        {!isPassed ? (
          <MaterialCommunityIcons name={isNext ? 'bell' : 'bell-outline'} size={16} color={isNext ? c.gold : c.muted} />
        ) : null}
      </View>
    </View>
  );
}

export default function PrayerScreen() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={{ paddingBottom: 160 }} contentInsetAdjustmentBehavior="never">
          <View style={{ position: 'relative' }}>
            <StarField color={c.gold} />

            <View style={{ alignItems: 'center', marginTop: 12 }}>
              <View style={{ width: 340, height: 340, alignItems: 'center', justifyContent: 'center' }}>
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute', width: 320, height: 320, borderRadius: 160,
                    backgroundColor: c.bg,
                    shadowColor: c.text, shadowOffset: { width: 16, height: 0 },
                    shadowOpacity: 0.1, shadowRadius: 14,
                  }}
                />
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute', width: 320, height: 320, borderRadius: 160,
                    backgroundColor: c.bg,
                    shadowColor: c.shadow, shadowOffset: { width: -38, height: 0 },
                    shadowOpacity: 0.95, shadowRadius: 22, elevation: 20,
                  }}
                />
                <View
                  pointerEvents="none"
                  style={{ position: 'absolute', width: 252, height: 252, borderRadius: 126, backgroundColor: c.highlight }}
                />
                <CountdownRing prayers={PRAYERS} nowHours={now.getHours() + now.getMinutes() / 60} />
                <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: c.text, fontSize: 12, letterSpacing: 3, fontWeight: '500', marginBottom: 4 }}>
                    ASR IN
                  </Text>
                  <Text style={{ color: c.text, fontSize: 56, fontWeight: '300', letterSpacing: 1 }}>
                    00:55
                  </Text>
                  <View style={{ marginTop: 8, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999, backgroundColor: withAlpha(COLORS.primaryForeground, 0.1) }}>
                    <Text style={{ color: c.gold, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                      {currentTime} CURRENT
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <Text style={{ color: c.text, fontSize: 44, textAlign: 'center', marginTop: 24, fontWeight: '400' }}>
              Prayer Times
            </Text>
          </View>

          <View style={{ paddingHorizontal: 20, marginTop: 56 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.depth30, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14 }}>
              <Pressable hitSlop={12}>
                <MaterialCommunityIcons name="chevron-left" size={22} color={c.muted} />
              </Pressable>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: c.text, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }}>
                  THURSDAY, MAR, 2026
                </Text>
                <Text style={{ color: c.gold, fontSize: 10, marginTop: 2 }}>Ramadan 30, 1447</Text>
              </View>
              <Pressable hitSlop={12}>
                <MaterialCommunityIcons name="chevron-right" size={22} color={c.muted} />
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 12, paddingHorizontal: 14 }}>
              <View style={{ width: 40, marginRight: 12 }} />
              <Text style={{ color: c.muted, fontSize: 11, letterSpacing: 2, flex: 1.1 }}>PRAYER</Text>
              <Text style={{ color: c.muted, fontSize: 11, letterSpacing: 2, flex: 0.9, textAlign: 'center' }}>ATHAN</Text>
              <Text style={{ color: c.muted, fontSize: 11, letterSpacing: 2, flex: 0.9, textAlign: 'center' }}>IQAMAH</Text>
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
            <SupportMasjidCard />
            <CommunityPartnersSection />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

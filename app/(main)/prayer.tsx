import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { router, Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

import QuranScreen from '@/src/screens/QuranScreen';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { usePrayerTimes } from '@/src/hooks/use-prayer-times';
import { useTrackerVersion } from '@/src/hooks/use-tracker';
import { getLastViewed } from '@/src/lib/quran-tracker';
import {
  getGoalForPeriod,
  getGoals,
  getPeriodPages,
  type Period,
} from '@/src/lib/quran-tracker';
import { useDonation } from '@/src/providers/donation-provider';

function rgb(triplet: string, alpha = 1) {
  const [r, g, b] = triplet.split(' ');
  return alpha === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type Status = 'passed' | 'next' | 'upcoming';

type PrayerRow = {
  name: string;
  athan: string;
  iqamah: string;
  status: Status;
  statusLabel: string;
};

function buildPrayerRows(
  prayers: { name: string; time: string; isActive: boolean }[],
  nextPrayer: { name: string; timeRemaining: string } | null
): PrayerRow[] {
  let passedNext = false;
  return prayers.map((p) => {
    const isNext = p.isActive;
    if (isNext) passedNext = true;
    const status: Status = isNext ? 'next' : !passedNext && !isNext ? 'passed' : 'upcoming';
    let statusLabel = '';
    if (status === 'passed') statusLabel = 'Passed';
    if (status === 'next' && nextPrayer)
      statusLabel = `Next in ${nextPrayer.timeRemaining}`;
    return {
      name: p.name,
      athan: p.time,
      iqamah: '--',
      status,
      statusLabel,
    };
  });
}

type Palette = {
  bg: string;
  gold: string;
  goldSoft: string;
  goldBorder: string;
  text: string;
  muted: string;
  ringDim: string;
  rowBg: string;
  iconBg: string;
  iconBgActive: string;
  goldGlass: string;
  highlight: string;
  highlightBorder: string;
  haloOuter: string;
  depth: string;
  shadow: string;
  depth30: string;
  depth35: string;
  divider10: string;
  divider12: string;
  divider15: string;
  border20: string;
  border25: string;
  ringTrack: string;
};

function usePalette(): Palette {
  const { colors } = useMasjidConfig();
  return {
    bg: rgb(colors.primary),
    gold: rgb(colors.accent),
    goldSoft: rgb(colors.accent, 0.15),
    goldBorder: rgb(colors.accent, 0.5),
    text: rgb(colors.primaryForeground),
    muted: rgb(colors.primaryForeground, 0.55),
    ringDim: rgb(colors.primaryForeground, 0.28),
    rowBg: rgb(colors.primaryForeground, 0.04),
    iconBg: rgb(colors.primaryForeground, 0.06),
    iconBgActive: rgb(colors.accent, 0.25),
    goldGlass: rgb(colors.accent, 0.45),
    highlight: rgb(colors.depth),
    highlightBorder: rgb(colors.depth),
    haloOuter: rgb(colors.primaryForeground, 0.035),
    depth: rgb(colors.depth),
    shadow: rgb(colors.shadow),
    depth30: rgb(colors.depth, 0.85),
    depth35: rgb(colors.depth, 0.95),
    divider10: rgb(colors.primaryForeground, 0.1),
    divider12: rgb(colors.primaryForeground, 0.12),
    divider15: rgb(colors.primaryForeground, 0.15),
    border20: rgb(colors.primaryForeground, 0.2),
    border25: rgb(colors.primaryForeground, 0.25),
    ringTrack: rgb(colors.primaryForeground, 0.08),
  };
}

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

function parseTimeToHours(time: string): number {
  const m = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return 0;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const period = m[3]?.toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h + min / 60;
}

function CountdownRing({
  prayers,
  nowHours,
  c,
}: {
  prayers: PrayerRow[];
  nowHours: number;
  c: Palette;
}) {
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

  // 96 ticks (one per 15min); major every hour, extra-major every 6 hours
  const TICK_COUNT = 96;
  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => i);

  const angleForHour = (h: number) => (h / 24) * 360 - 90;
  const pointForHour = (h: number, radius = r) => {
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
        const inner = isQuarterDay
          ? tickInnerMajor
          : isHour
            ? tickInnerMajor + 2
            : tickInnerMinor;
        const outer = tickOuter;
        const x1 = cx + inner * Math.cos(angle);
        const y1 = cy + inner * Math.sin(angle);
        const x2 = cx + outer * Math.cos(angle);
        const y2 = cy + outer * Math.sin(angle);
        return (
          <Line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={c.ringDim}
            strokeWidth={isQuarterDay ? 1.6 : isHour ? 1.2 : 0.7}
            strokeLinecap="round"
          />
        );
      })}
      <Circle
        cx={cx}
        cy={cy}
        r={r}
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

function PrayerDots({
  prayers,
  c,
  size = 340,
  ringR = 128,
}: {
  prayers: PrayerRow[];
  c: Palette;
  size?: number;
  ringR?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', width: size, height: size }}
    >
      {prayers.map((p, idx) => {
        const h = parseTimeToHours(p.athan);
        const angleRad = ((h / 24) * 360 - 90) * (Math.PI / 180);
        const x = cx + ringR * Math.cos(angleRad);
        const y = cy + ringR * Math.sin(angleRad);
        const isNext = p.status === 'next';
        const isPassed = p.status === 'passed';
        const dotSize = isNext ? 16 : 13;
        return (
          <View
            key={`${p.name}-${idx}`}
            style={{
              position: 'absolute',
              left: x - dotSize / 2,
              top: y - dotSize / 2,
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              overflow: 'hidden',
              borderWidth: 0.5,
              borderColor: isNext ? c.gold : c.border20,
            }}
          >
            <GlassView
              glassEffectStyle="regular"
              style={{
                width: dotSize,
                height: dotSize,
                backgroundColor: isPassed
                  ? c.text
                  : isNext
                    ? c.goldGlass
                    : 'transparent',
              }}
            />
          </View>
        );
      })}
    </View>
  );
}

function Sparkle({ size, color }: { size: number; color: string }) {
  const s = size;
  const c = s / 2;
  const arm = s / 2;
  const waist = s * 0.08;
  const d = `M ${c} ${c - arm} Q ${c + waist} ${c} ${c + arm} ${c} Q ${c + waist} ${c} ${c} ${c + arm} Q ${c - waist} ${c} ${c - arm} ${c} Q ${c - waist} ${c} ${c} ${c - arm} Z`;
  return (
    <Svg width={s} height={s}>
      <Path d={d} fill={color} />
    </Svg>
  );
}

function TwinklingStar({
  star,
  color,
}: {
  star: (typeof STARS)[number];
  color: string;
}) {
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
  }, [opacity, scale, star.delay, star.duration, star.max]);

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

function StarField({ color }: { color: string }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 360 }}>
      {STARS.map((s, i) => (
        <TwinklingStar key={i} star={s} color={color} />
      ))}
    </View>
  );
}

function ProgressRing({
  progress,
  size = 72,
  stroke = 5,
  color,
  track,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  color: string;
  track: string;
}) {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cy} r={r} stroke={track} strokeWidth={stroke} fill="none" />
      <Circle
        cx={cx}
        cy={cy}
        r={r}
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

const PERIOD_OPTIONS: { key: Period; short: string; long: string }[] = [
  { key: 'day', short: 'Daily', long: 'today' },
  { key: 'month', short: 'Monthly', long: 'this month' },
  { key: 'year', short: 'Yearly', long: 'this year' },
];

function DailyQuranGoalCard({ c, onContinueReading }: { c: Palette; onContinueReading?: () => void }) {
  const [period, setPeriod] = useState<Period>('day');
  const version = useTrackerVersion();

  const { pages, goal, percent, periodLabel } = useMemo(() => {
    const goals = getGoals();
    const g = getGoalForPeriod(period, goals);
    const p = getPeriodPages(period);
    return {
      pages: p,
      goal: g,
      percent: Math.min(1, p / g),
      periodLabel: PERIOD_OPTIONS.find((o) => o.key === period)!.long,
    };
  }, [period, version]);

  const remaining = Math.max(0, goal - pages);
  const ringSize = 64;

  return (
    <View
      style={{
        borderRadius: 22,
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: c.depth30,
        marginTop: 20,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <GlassView
          glassEffectStyle="regular"
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
            overflow: 'hidden',
          }}
        >
          <MaterialCommunityIcons name="book-open-page-variant" size={16} color={c.gold} />
        </GlassView>
        <Text style={{ color: c.text, fontSize: 24, fontFamily: 'PlayfairDisplay_400Regular', fontWeight: '400' }}>
          Quran Goal
        </Text>
      </View>

      <PeriodToggle
        c={c}
        value={period}
        onChange={setPeriod}
      />

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
                {periodLabel} <Text style={{ color: c.gold }}>• {remaining} left</Text>
              </>
            )}
          </Text>
          <Pressable
            style={{ alignSelf: 'flex-start', marginTop: 14 }}
            onPress={onContinueReading}
          >
            <GlassView
              glassEffectStyle="regular"
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <Text style={{ color: c.text, fontSize: 12, fontWeight: '500' }}>
                Continue Reading
              </Text>
            </GlassView>
          </Pressable>
        </View>

        <View style={{ width: ringSize, height: ringSize, alignItems: 'center', justifyContent: 'center' }}>
          <ProgressRing
            progress={percent}
            size={ringSize}
            stroke={4}
            color={c.gold}
            track={c.ringTrack}
          />
          <View
            style={{
              position: 'absolute',
              top: 2,
              right: 10,
            }}
          >
            <Sparkle size={6} color={c.gold} />
          </View>
          <Text
            style={{
              position: 'absolute',
              color: c.text,
              fontSize: 22,
              fontFamily: 'CormorantGaramond_400Regular',
            }}
          >
            {Math.round(percent * 100)}%
          </Text>
        </View>
      </View>

      <View
        style={{
          height: StyleSheet.hairlineWidth,
          backgroundColor: c.divider12,
          marginTop: 22,
          marginBottom: 4,
        }}
      />

      <RemembrancesSection c={c} />
    </View>
  );
}

function PeriodToggle({
  c,
  value,
  onChange,
}: {
  c: Palette;
  value: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignSelf: 'flex-start',
        borderRadius: 999,
        backgroundColor: c.iconBg,
        padding: 3,
      }}
    >
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
            <Text
              style={{
                color: active ? c.gold : c.muted,
                fontSize: 11,
                fontWeight: active ? '700' : '500',
                letterSpacing: 0.5,
              }}
            >
              {opt.short}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function RemembrancesSection({ c }: { c: Palette }) {
  return (
    <View style={{ marginTop: 18, marginBottom: 16 }}>
      <Text
        style={{
          color: c.text,
          fontSize: 24,
          fontFamily: 'PlayfairDisplay_400Regular',
          fontWeight: '400',
          marginBottom: 22,
        }}
      >
        Remembrances
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <RemembranceItem
          c={c}
          icon="weather-sunny"
          title="Morning Athkar"
          meta="42 Prayers • 12m"
        />
        <View
          style={{
            width: StyleSheet.hairlineWidth,
            alignSelf: 'stretch',
            backgroundColor: c.divider15,
            marginHorizontal: 18,
          }}
        />
        <RemembranceItem
          c={c}
          icon="moon-waning-crescent"
          title="Evening Athkar"
          meta="42 Prayers • 12m"
        />
      </View>
    </View>
  );
}

function RemembranceItem({
  c,
  icon,
  title,
  meta,
}: {
  c: Palette;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  meta: string;
}) {
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

function CommunityPartnersSection({ c }: { c: Palette }) {
  const iconBtn = {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.border20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  return (
    <View style={{ marginTop: 32 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: c.border20,
          paddingBottom: 10,
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            color: c.text,
            fontSize: 12,
            fontWeight: '700',
            letterSpacing: 2,
          }}
        >
          COMMUNITY PARTNERS
        </Text>
      </View>

      <View
        style={{
          borderRadius: 20,
          overflow: 'hidden',
          backgroundColor: c.depth35,
        }}
      >
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=60',
          }}
          style={{ width: '100%', aspectRatio: 16 / 10 }}
          resizeMode="cover"
        />

        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          <Text style={{ color: c.text, fontSize: 13, lineHeight: 18 }}>
            1805 Forest Ave @ Richmond AVe.,{'\n'}Staten Island, NY 10303
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 14,
            }}
          >
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: c.border25,
              }}
            >
              <MaterialCommunityIcons name="map-marker-outline" size={14} color={c.text} />
              <Text style={{ color: c.text, fontSize: 13, fontWeight: '500', marginLeft: 6 }}>
                Directions
              </Text>
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

      <Pressable
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 10,
          marginTop: 16,
          borderRadius: 20,
          backgroundColor: c.depth35,
        }}
      >
        <Text style={{ color: c.text, fontSize: 14, fontWeight: '500', marginRight: 6 }}>
          Become a Community Partner
        </Text>
        <MaterialCommunityIcons name="arrow-right" size={16} color={c.text} />
      </Pressable>
    </View>
  );
}

function SupportMasjidCard({ c }: { c: Palette }) {
  const { open } = useDonation();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 999,
        backgroundColor: c.depth30,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginTop: 32,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <GlassView
          glassEffectStyle="regular"
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <Text style={{ color: c.gold, fontSize: 20, lineHeight: 22 }}>♥</Text>
        </GlassView>
        <View>
          <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>
            Support Your Masjid
          </Text>
          <Text style={{ color: c.muted, fontSize: 11, marginTop: 1 }}>Donate</Text>
        </View>
      </View>

      <Pressable onPress={open}>
        <GlassView
          glassEffectStyle="regular"
          style={{
            borderRadius: 999,
            paddingHorizontal: 16,
            paddingVertical: 8,
            overflow: 'hidden',
          }}
        >
          <Text style={{ color: c.gold, fontSize: 11, fontWeight: '800' }}>
            DONATE →
          </Text>
        </GlassView>
      </Pressable>
    </View>
  );
}

function PrayerRowItem({
  row,
  c,
  showDivider,
}: {
  row: PrayerRow;
  c: Palette;
  showDivider: boolean;
}) {
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
        <Text
          style={{
            color: isPassed ? c.muted : c.text,
            fontSize: 16,
            fontWeight: '600',
          }}
        >
          {row.name}
        </Text>
        {row.statusLabel ? (
          <Text style={{ color: isNext ? c.gold : c.muted, fontSize: 11, marginTop: 2 }}>
            {row.statusLabel}
          </Text>
        ) : null}
      </View>

      <Text
        style={{
          color: isPassed ? c.muted : c.text,
          fontSize: 14,
          flex: 0.9,
          textAlign: 'center',
        }}
      >
        {row.athan}
      </Text>

      <Text
        style={{
          color: isNext ? c.gold : isPassed ? c.muted : c.text,
          fontSize: 14,
          fontWeight: isNext ? '600' : '400',
          flex: 0.9,
          textAlign: 'center',
        }}
      >
        {row.iqamah}
      </Text>

      <View style={{ width: 20, alignItems: 'flex-end' }}>
        {!isPassed ? (
          <MaterialCommunityIcons
            name={isNext ? 'bell' : 'bell-outline'}
            size={16}
            color={isNext ? c.gold : c.muted}
          />
        ) : null}
      </View>
    </View>
  );
}

export default function PrayerScreen() {
  const c = usePalette();
  const [now, setNow] = useState(new Date());
  const [quranOpen, setQuranOpen] = useState(false);
  const [resumeTarget, setResumeTarget] = useState<ReturnType<typeof getLastViewed>>(null);
  const { items: prayerItems, nextPrayer, countdownLabel, countdownClock } = usePrayerTimes();
  const prayerData = useMemo(
    () => prayerItems.map((p) => ({ name: p.name, time: p.athan, isActive: p.status === 'next' })),
    [prayerItems]
  );
  const prayerRows = useMemo(
    () => buildPrayerRows(prayerData, nextPrayer),
    [prayerData, nextPrayer]
  );

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const currentTime = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const todayFormatted = now
    .toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      year: 'numeric',
    })
    .toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 160 }}
          contentInsetAdjustmentBehavior="never"
        >
          <View style={{ position: 'relative' }}>
            <StarField color={c.gold} />

            <View style={{ alignItems: 'center', marginTop: 12 }}>
              <View style={{ width: 340, height: 340, alignItems: 'center', justifyContent: 'center' }}>
                {/* Light glow on the right */}
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    width: 320,
                    height: 320,
                    borderRadius: 160,
                    backgroundColor: c.bg,
                    shadowColor: c.text,
                    shadowOffset: { width: 16, height: 0 },
                    shadowOpacity: 0.1,
                    shadowRadius: 14,
                  }}
                />
                {/* Dark shadow on the left */}
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    width: 320,
                    height: 320,
                    borderRadius: 160,
                    backgroundColor: c.bg,
                    shadowColor: c.shadow,
                    shadowOffset: { width: -38, height: 0 },
                    shadowOpacity: 0.95,
                    shadowRadius: 22,
                    elevation: 20,
                  }}
                />
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    width: 252,
                    height: 252,
                    borderRadius: 126,
                    backgroundColor: c.highlight,
                  }}
                />
                <CountdownRing
                  prayers={prayerRows}
                  nowHours={now.getHours() + now.getMinutes() / 60}
                  c={c}
                />
                <PrayerDots prayers={prayerRows} c={c} />
                <View
                  style={{
                    position: 'absolute',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: c.text,
                      fontSize: 12,
                      letterSpacing: 3,
                      fontWeight: '500',
                      marginBottom: 4,
                    }}
                  >
                    {nextPrayer ? `${nextPrayer.name.toUpperCase()} IN` : ''}
                  </Text>
                  <Text
                    style={{
                      color: c.text,
                      fontSize: 56,
                      fontWeight: '300',
                      letterSpacing: 1,
                    }}
                  >
                    {countdownClock ?? '--'}
                  </Text>
                  <GlassView
                    glassEffectStyle="regular"
                    style={{
                      marginTop: 8,
                      paddingHorizontal: 14,
                      paddingVertical: 5,
                      borderRadius: 999,
                      overflow: 'hidden',
                    }}
                  >
                    <Text style={{ color: c.gold, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                      {currentTime} CURRENT
                    </Text>
                  </GlassView>
                </View>
              </View>
            </View>

            <Text
              style={{
                color: c.text,
                fontSize: 44,
                textAlign: 'center',
                marginTop: 24,
                fontWeight: '400',
                fontFamily: 'PlayfairDisplay_400Regular',
              }}
            >
              Prayer Times
            </Text>
          </View>

          <View style={{ paddingHorizontal: 20, marginTop: 56 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: c.depth30,
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
            >
              <Pressable hitSlop={12}>
                <MaterialCommunityIcons name="chevron-left" size={22} color={c.muted} />
              </Pressable>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: c.text, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }}>
                  {todayFormatted}
                </Text>
                {/* TODO: hijri date */}
              </View>
              <Pressable hitSlop={12}>
                <MaterialCommunityIcons name="chevron-right" size={22} color={c.muted} />
              </Pressable>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 24,
                marginBottom: 12,
                paddingHorizontal: 14,
              }}
            >
              <View style={{ width: 40, marginRight: 12 }} />
              <Text style={{ color: c.muted, fontSize: 11, letterSpacing: 2, flex: 1.1 }}>PRAYER</Text>
              <Text
                style={{ color: c.muted, fontSize: 11, letterSpacing: 2, flex: 0.9, textAlign: 'center' }}
              >
                ATHAN
              </Text>
              <Text
                style={{ color: c.muted, fontSize: 11, letterSpacing: 2, flex: 0.9, textAlign: 'center' }}
              >
                IQAMAH
              </Text>
              <View style={{ width: 20 }} />
            </View>

            {prayerRows.map((p, i) => {
              const isPassed = p.status === 'passed';
              const isNext = p.status === 'next';
              const nextRow = prayerRows[i + 1];
              const showDivider = !isPassed && !isNext && nextRow?.status !== 'next';
              return <PrayerRowItem key={`${p.name}-${i}`} row={p} c={c} showDivider={showDivider} />;
            })}

            <DailyQuranGoalCard c={c} onContinueReading={() => { setResumeTarget(getLastViewed()); setQuranOpen(true); }} />
            <SupportMasjidCard c={c} />
            <CommunityPartnersSection c={c} />
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={quranOpen}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => { setQuranOpen(false); setResumeTarget(null); }}
      >
        <QuranScreen onClose={() => { setQuranOpen(false); setResumeTarget(null); }} initial={resumeTarget} />
      </Modal>
    </View>
  );
}

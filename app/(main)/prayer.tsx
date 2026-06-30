import * as Haptics from 'expo-haptics';
import { router, Stack, useFocusEffect } from 'expo-router';

import { useTranslation } from 'react-i18next';

import { useFontFamily } from '@/src/hooks/use-font-family';
import { useIsRTL } from '@/src/hooks/use-is-rtl';
import { useStatusBarStyle } from '@/src/hooks/use-status-bar-style';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { Icon, type IconName } from '@/src/components/ui/icon';
import QuranScreen from '@/src/screens/QuranScreen';
import { PrayerNotificationSheet } from '@/src/components/prayer/prayer-notification-sheet';
import { CommunityPartnersCarousel } from '@/src/components/community-partners-carousel';
import { useCommunityPartners } from '@/src/hooks/use-community-partners';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { usePrayerAlerts, type PrayerName } from '@/src/hooks/use-prayer-alerts';
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
  items: { name: string; athan: string; iqamah: string; status: Status }[],
  nextPrayer: { name: string; timeRemaining: string } | null,
  t: (key: string, opts?: Record<string, unknown>) => string
): PrayerRow[] {
  return items.map((p) => {
    let statusLabel = '';
    if (p.status === 'passed') statusLabel = t('prayer.passed');
    if (p.status === 'next' && nextPrayer)
      statusLabel = t('prayer.nextIn', { time: nextPrayer.timeRemaining });
    return {
      name: p.name,
      athan: p.athan,
      iqamah: p.iqamah,
      status: p.status,
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
  // Highest — deep pull-to-refresh zone
  { x: 60, y: -160, size: 6, max: 0.85, delay: 400, duration: 4200 },
  { x: 180, y: -170, size: 9, max: 1, delay: 1600, duration: 3800 },
  { x: 300, y: -155, size: 5, max: 0.8, delay: 2800, duration: 4600 },
  { x: 20, y: -145, size: 7, max: 0.9, delay: 1200, duration: 4000 },
  { x: 350, y: -165, size: 8, max: 0.95, delay: 2000, duration: 3600 },
  { x: 120, y: -140, size: 5, max: 0.75, delay: 3200, duration: 4400 },
  { x: 240, y: -150, size: 10, max: 1, delay: 800, duration: 4800 },
  // Upper — visible on normal overscroll
  { x: 50, y: -115, size: 7, max: 0.9, delay: 2400, duration: 4000 },
  { x: 170, y: -105, size: 5, max: 0.8, delay: 600, duration: 4400 },
  { x: 280, y: -120, size: 8, max: 0.95, delay: 1800, duration: 3400 },
  { x: 360, y: -100, size: 6, max: 0.85, delay: 3000, duration: 4200 },
  { x: 15, y: -95, size: 9, max: 1, delay: 1000, duration: 3800 },
  { x: 220, y: -90, size: 5, max: 0.75, delay: 2200, duration: 4600 },
  // Mid-upper — visible on pull-to-refresh
  { x: 40, y: -60, size: 5, max: 0.8, delay: 600, duration: 4000 },
  { x: 150, y: -55, size: 8, max: 0.9, delay: 2200, duration: 3600 },
  { x: 260, y: -65, size: 6, max: 0.85, delay: 1400, duration: 4400 },
  { x: 340, y: -50, size: 7, max: 0.95, delay: 200, duration: 3800 },
  { x: 90, y: -35, size: 10, max: 1, delay: 1000, duration: 4800 },
  { x: 210, y: -30, size: 5, max: 0.75, delay: 2600, duration: 4200 },
  { x: 320, y: -25, size: 9, max: 0.9, delay: 1800, duration: 3400 },
  { x: 10, y: -40, size: 6, max: 0.85, delay: 3200, duration: 4600 },
  // Original top row
  { x: 14, y: 12, size: 10, max: 1, delay: 0, duration: 3200 },
  { x: 72, y: 6, size: 6, max: 0.9, delay: 1600, duration: 4400 },
  { x: 188, y: 2, size: 7, max: 1, delay: 800, duration: 3800 },
  { x: 288, y: 8, size: 12, max: 1, delay: 2400, duration: 4800 },
  { x: 356, y: 18, size: 8, max: 0.95, delay: 400, duration: 4000 },
  { x: 8, y: 70, size: 6, max: 0.85, delay: 3000, duration: 3400 },
  { x: 22, y: 190, size: 7, max: 0.9, delay: 1200, duration: 4200 },
  { x: 360, y: 70, size: 9, max: 1, delay: 2000, duration: 4600 },
  { x: 352, y: 200, size: 5, max: 0.8, delay: 600, duration: 3600 },
  { x: 4, y: 300, size: 5, max: 0.75, delay: 2800, duration: 4000 },
  { x: 362, y: 300, size: 6, max: 0.85, delay: 1800, duration: 4400 },
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
            <View
              style={{
                width: dotSize,
                height: dotSize,
                backgroundColor: isPassed
                  ? c.muted
                  : isNext
                    ? c.goldGlass
                    : 'rgba(0, 0, 0, 0.18)',
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
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 360, overflow: 'visible' }}>
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

const PERIOD_OPTIONS: { key: Period; shortKey: string; longKey: string }[] = [
  { key: 'day', shortKey: 'periodDaily', longKey: 'periodToday' },
  { key: 'month', shortKey: 'periodMonthly', longKey: 'periodThisMonth' },
  { key: 'year', shortKey: 'periodYearly', longKey: 'periodThisYear' },
];

function DailyQuranGoalCard({ c, onContinueReading }: { c: Palette; onContinueReading?: () => void }) {
  const { t } = useTranslation();
  const fonts = useFontFamily();
  const isRTL = useIsRTL();
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
      periodLabel: t(`prayer.${PERIOD_OPTIONS.find((o) => o.key === period)!.longKey}`),
    };
  }, [period, version, t]);

  const remaining = Math.max(0, goal - pages);
  const ringSize = 78;

  // No saved last-viewed position → the user hasn't read yet, so prompt them to
  // "Start Reading" rather than "Continue Reading".
  const hasRead = useMemo(() => getLastViewed() != null, [version]);

  return (
    <View
      style={{
        borderRadius: 22,
        paddingHorizontal: 20,
        paddingVertical: 18,
        backgroundColor: c.depth30,
        marginTop: 20,
      }}
    >
      {/* Header row: book icon + "Quran Goal" title on the left,
          percent progress ring pinned top-right. */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 4,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: 'center',
              justifyContent: 'center',
              marginEnd: 12,
              backgroundColor: 'rgba(0, 0, 0, 0.18)',
            }}
          >
            <Icon name="book-open-page-variant" size={20} color={c.gold} />
          </View>
          <Text style={{ color: c.text, fontSize: 24, fontFamily: fonts.displayRegular, fontWeight: '400' }}>
            {t('prayer.quranGoal')}
          </Text>
        </View>
        <View style={{ width: ringSize, height: ringSize, alignItems: 'center', justifyContent: 'center' }}>
          <ProgressRing
            progress={percent}
            size={ringSize}
            stroke={4}
            color={c.gold}
            track={c.ringTrack}
          />
          <Text
            style={{
              position: 'absolute',
              color: c.text,
              fontSize: 24,
              fontFamily: fonts.displayRegular,
            }}
          >
            {Math.round(percent * 100)}%
          </Text>
        </View>
      </View>

      <PeriodToggle
        c={c}
        value={period}
        onChange={setPeriod}
      />

      <View style={{ marginTop: 12 }}>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>
          {t('prayer.pagesProgress', { pages, goal })}
        </Text>
        <Text style={{ color: c.muted, fontSize: 12, marginTop: 6 }}>
          {remaining === 0 ? (
            <Text style={{ color: c.gold }}>{t('prayer.goalReached', { period: periodLabel })}</Text>
          ) : (
            <>
              {periodLabel} <Text style={{ color: c.gold }}>{t('prayer.pagesLeft', { count: remaining })}</Text>
            </>
          )}
        </Text>
        {/* Continue Reading — full-width rectangle CTA. marginTop on the
            outer static View; Pressable's style-function form drops
            layout props (same gotcha as the earlier alignSelf issue). */}
        <View style={{ marginTop: 18 }}>
          <Pressable
            onPress={onContinueReading}
            style={({ pressed }) => ({
              opacity: pressed ? 0.92 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 13,
                borderRadius: 14,
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: c.gold,
                shadowColor: c.gold,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.55,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <Text style={{ color: '#0A1426', fontSize: 14, fontWeight: '700', letterSpacing: 0.3 }}>
                {hasRead ? t('prayer.continueReading') : t('prayer.startReading')}
              </Text>
              <Icon name={isRTL ? 'arrow-back' : 'arrow-forward'} size={15} color={c.gold} />
            </View>
          </Pressable>
        </View>
      </View>

      <View
        style={{
          height: StyleSheet.hairlineWidth,
          backgroundColor: c.divider12,
          marginTop: 16,
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
  const { t } = useTranslation();
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
              {t(`prayer.${opt.shortKey}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function RemembrancesSection({ c }: { c: Palette }) {
  const { t } = useTranslation();
  const fonts = useFontFamily();
  const meta = t('prayer.athkarMeta', { count: 42, minutes: 12 });
  return (
    <View style={{ marginTop: 18, marginBottom: 16 }}>
      <Text
        style={{
          color: c.text,
          fontSize: 24,
          fontFamily: fonts.displayRegular,
          fontWeight: '400',
          marginBottom: 22,
        }}
      >
        {t('prayer.remembrances')}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <RemembranceItem
          c={c}
          icon="weather-sunny"
          title={t('prayer.morningAthkar')}
          meta={meta}
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
          title={t('prayer.eveningAthkar')}
          meta={meta}
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
  icon: IconName;
  title: string;
  meta: string;
}) {
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
      {/* Dark blur badge — matches the book-icon treatment on the
          Quran Goal header + the donate heart icon. */}
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: 'center',
          justifyContent: 'center',
          marginEnd: 10,
          backgroundColor: 'rgba(0, 0, 0, 0.18)',
        }}
      >
        <Icon name={icon} size={18} color={c.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>{title}</Text>
        <Text style={{ color: c.muted, fontSize: 11, marginTop: 2 }}>{meta}</Text>
      </View>
    </View>
  );
}

function CommunityPartnersSection({ c }: { c: Palette }) {
  const { t } = useTranslation();
  const { data } = useCommunityPartners();
  const partners = data ?? [];

  // Nothing approved yet → hide the section entirely.
  if (partners.length === 0) return null;

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
        <Text style={{ color: c.text, fontSize: 12, fontWeight: '700', letterSpacing: 2 }}>
          {t('prayer.communityPartners')}
        </Text>
      </View>

      <CommunityPartnersCarousel
        partners={partners}
        colors={{
          text: c.text,
          cardBg: c.depth35,
          fallbackBg: c.iconBg,
          border: c.border20,
        }}
      />
    </View>
  );
}

function SupportMasjidCard({ c }: { c: Palette }) {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
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
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.18)',
          }}
        >
          <Text style={{ color: c.gold, fontSize: 20, lineHeight: 22 }}>♥</Text>
        </View>
        <View>
          <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>
            {t('prayer.supportYourMasjid')}
          </Text>
          <Text style={{ color: c.muted, fontSize: 11, marginTop: 1 }}>{t('prayer.donate')}</Text>
        </View>
      </View>

      <Pressable onPress={open}>
        <View
          style={{
            borderRadius: 999,
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.18)',
          }}
        >
          <Text style={{ color: c.gold, fontSize: 11, fontWeight: '800' }}>
            {t('prayer.donateCta')} {isRTL ? '←' : '→'}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

// Map a raw prayer name (DB-derived, title-cased) to its i18n key suffix so it
// can be translated. Falls back to the original name when unrecognized.
function prayerNameKey(name: string): string | null {
  const n = name.toLowerCase();
  if (n.includes('fajr')) return 'fajr';
  if (n.includes('sunrise') || n.includes('shuru') || n.includes('shorooq'))
    return 'sunrise';
  if (n.includes('dhuhr') || n.includes('zuhr') || n.includes('duhr'))
    return 'dhuhr';
  if (n.includes('asr')) return 'asr';
  if (n.includes('maghrib')) return 'maghrib';
  if (n.includes('isha')) return 'isha';
  if (n.includes('jummah') || n.includes('jumah') || n.includes('juma'))
    return 'jummah';
  return null;
}

// Icon per prayer, matching the time of day it falls in.
function prayerIcon(
  name: string,
): IconName {
  const n = name.toLowerCase();
  if (n.includes('fajr')) return 'weather-sunset-up'; // dawn
  if (n.includes('sunrise') || n.includes('shuru') || n.includes('shorooq'))
    return 'weather-sunny'; // sun up
  if (n.includes('dhuhr') || n.includes('zuhr') || n.includes('duhr'))
    return 'white-balance-sunny'; // midday
  if (n.includes('asr')) return 'weather-partly-cloudy'; // afternoon
  if (n.includes('maghrib')) return 'weather-sunset-down'; // sunset
  if (n.includes('isha')) return 'weather-night'; // night
  return 'weather-sunny';
}

function PrayerRowItem({
  row,
  c,
  showDivider,
  hasNotifications,
  onBellPress,
}: {
  row: PrayerRow;
  c: Palette;
  showDivider: boolean;
  hasNotifications: boolean;
  onBellPress: () => void;
}) {
  const { t } = useTranslation();
  const isNext = row.status === 'next';
  const isPassed = row.status === 'passed';
  const bellActive = hasNotifications || isNext;
  const nameKey = prayerNameKey(row.name);
  const displayName = nameKey ? t(`prayer.${nameKey}`) : row.name;

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
      <View style={{ width: 40, alignItems: 'center', marginEnd: 12 }}>
        <Icon
          name={prayerIcon(row.name)}
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
          {displayName}
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

      <Pressable
        onPress={onBellPress}
        hitSlop={12}
        style={{ width: 24, alignItems: 'center' }}
      >
        <Icon
          name={bellActive ? 'bell' : 'bell-outline'}
          size={16}
          color={bellActive ? c.gold : c.muted}
          fill={bellActive ? c.gold : 'none'}
        />
      </Pressable>
    </View>
  );
}

function SkeletonRow({ c, index }: { c: Palette; index: number }) {
  const pulse = useSharedValue(0.08);
  useEffect(() => {
    pulse.value = withDelay(
      index * 80,
      withRepeat(
        withSequence(
          withTiming(0.18, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.08, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, [pulse, index]);

  const shimmer = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <View
      style={{
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 14,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View style={{ width: 40, alignItems: 'center', marginEnd: 12 }}>
        <Animated.View style={[{ width: 22, height: 22, borderRadius: 11, backgroundColor: c.text }, shimmer]} />
      </View>
      <View style={{ flex: 1.1 }}>
        <Animated.View style={[{ width: 60, height: 14, borderRadius: 7, backgroundColor: c.text }, shimmer]} />
      </View>
      <View style={{ flex: 0.9, alignItems: 'center' }}>
        <Animated.View style={[{ width: 52, height: 14, borderRadius: 7, backgroundColor: c.text }, shimmer]} />
      </View>
      <View style={{ flex: 0.9, alignItems: 'center' }}>
        <Animated.View style={[{ width: 52, height: 14, borderRadius: 7, backgroundColor: c.text }, shimmer]} />
      </View>
      <View style={{ width: 24 }} />
    </View>
  );
}

function DateBarSkeleton({ c }: { c: Palette }) {
  const pulse = useSharedValue(0.08);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.18, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.08, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [pulse]);
  const shimmer = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: c.depth30,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
      }}
    >
      <Animated.View style={[{ width: 180, height: 12, borderRadius: 6, backgroundColor: c.text }, shimmer]} />
    </View>
  );
}

const SKELETON_PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

export default function PrayerScreen() {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const c = usePalette();
  const fonts = useFontFamily();
  const [now, setNow] = useState(new Date());
  const [quranOpen, setQuranOpen] = useState(false);
  const [resumeTarget, setResumeTarget] = useState<ReturnType<typeof getLastViewed>>(null);
  const [sheetPrayer, setSheetPrayer] = useState<PrayerName | null>(null);
  // Date navigation — allow browsing ±7 days
  const [dayOffset, setDayOffset] = useState(0);

  const { timezone } = useMasjidConfig();
  const tz = timezone || 'UTC';

  const todayDateStr = useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tz, now]);

  const selectedDateStr = useMemo(() => {
    // Parse today in mosque tz, then offset by days
    const [y, m, d] = todayDateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + dayOffset);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }, [dayOffset, todayDateStr]);

  const isToday = selectedDateStr === todayDateStr;

  const {
    items: prayerItems,
    nextPrayer,
    countdownLabel,
    countdownClock,
    isFetching: prayersFetching,
    status: prayersStatus,
    refetch: refetchPrayers,
  } = usePrayerTimes(isToday ? undefined : selectedDateStr);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRefreshing(true);
    refetchPrayers().finally(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRefreshing(false);
    });
  }, [refetchPrayers]);
  const {
    toggles: prayerToggles,
    getSettings,
    savePrayerSettings,
    applyToAll,
  } = usePrayerAlerts();
  const prayerRows = useMemo(
    () => buildPrayerRows(prayerItems, isToday ? nextPrayer : null, t),
    [prayerItems, nextPrayer, isToday, t]
  );

  const goBack = useCallback(() => setDayOffset((d) => Math.max(d - 1, 0)), []);
  const goForward = useCallback(() => setDayOffset((d) => Math.min(d + 1, 7)), []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const currentTime = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const selectedDateFormatted = useMemo(() => {
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date
      .toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      .toUpperCase();
  }, [selectedDateStr]);

  const insets = useSafeAreaInsets();

  useStatusBarStyle('light');

  // Always start the Prayer page at the top each time it's focused, rather than
  // restoring the previous scroll position.
  const scrollRef = useRef<ScrollView>(null);
  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: -insets.top, animated: false });
    }, [insets.top]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingBottom: 160 }}
          indicatorStyle="white"
          scrollEventThrottle={16}
          contentInset={{ top: insets.top }}
          contentOffset={{ x: 0, y: -insets.top }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={c.gold}
              colors={[c.gold]}
              progressBackgroundColor={c.bg}
            />
          }
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
                    {nextPrayer
                      ? t('prayer.countdownLabel', {
                          name: (() => {
                            const k = prayerNameKey(nextPrayer.name);
                            return (k ? t(`prayer.${k}`) : nextPrayer.name).toUpperCase();
                          })(),
                        })
                      : ''}
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
                  <View
                    style={{
                      marginTop: 8,
                      paddingHorizontal: 14,
                      paddingVertical: 5,
                      borderRadius: 999,
                      backgroundColor: 'rgba(0, 0, 0, 0.18)',
                    }}
                  >
                    <Text style={{ color: c.gold, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                      {t('prayer.currentTime', { time: currentTime })}
                    </Text>
                  </View>
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
                fontFamily: fonts.displayRegular,
              }}
            >
              {t('prayer.title')}
            </Text>
          </View>

          <View style={{ paddingHorizontal: 20, marginTop: 56 }}>
            {refreshing ? (
              <DateBarSkeleton c={c} />
            ) : (
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
                <Pressable hitSlop={12} onPress={goBack} style={{ opacity: dayOffset > 0 ? 1 : 0.3 }}>
                  <Icon name={isRTL ? 'chevron-right' : 'chevron-left'} size={22} color={c.muted} />
                </Pressable>
                <Pressable onPress={() => setDayOffset(0)} hitSlop={8}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: c.text, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }}>
                      {selectedDateFormatted}
                    </Text>
                    {!isToday && (
                      <Text style={{ color: c.gold, fontSize: 11, marginTop: 2, letterSpacing: 1 }}>
                        {t('prayer.tapToReturnToday')}
                      </Text>
                    )}
                  </View>
                </Pressable>
                <Pressable hitSlop={12} onPress={goForward} style={{ opacity: dayOffset < 7 ? 1 : 0.3 }}>
                  <Icon name={isRTL ? 'chevron-left' : 'chevron-right'} size={22} color={c.muted} />
                </Pressable>
              </View>
            )}

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 24,
                marginBottom: 12,
                paddingHorizontal: 14,
              }}
            >
              <View style={{ width: 40, marginEnd: 12 }} />
              <Text style={{ color: c.muted, fontSize: 11, letterSpacing: 2, flex: 1.1 }}>{t('prayer.colPrayer')}</Text>
              <Text
                style={{ color: c.muted, fontSize: 11, letterSpacing: 2, flex: 0.9, textAlign: 'center' }}
              >
                {t('prayer.colAthan')}
              </Text>
              <Text
                style={{ color: c.muted, fontSize: 11, letterSpacing: 2, flex: 0.9, textAlign: 'center' }}
              >
                {t('prayer.colIqamah')}
              </Text>
              <View style={{ width: 20 }} />
            </View>

            {refreshing || (prayersFetching && prayerRows.length === 0) ? (
              SKELETON_PRAYERS.map((name, i) => (
                <SkeletonRow key={name} c={c} index={i} />
              ))
            ) : (
              <Animated.View entering={FadeIn.duration(300)} key={selectedDateStr}>
                {prayerRows.map((p, i) => {
                  const isPassed = p.status === 'passed';
                  const isNext = p.status === 'next';
                  const nextRow = prayerRows[i + 1];
                  const showDivider = !isPassed && !isNext && nextRow?.status !== 'next';
                  const pName = p.name as PrayerName;
                  return (
                    <PrayerRowItem
                      key={`${p.name}-${i}`}
                      row={p}
                      c={c}
                      showDivider={showDivider}
                      hasNotifications={prayerToggles[pName] ?? false}
                      onBellPress={() => setSheetPrayer(pName)}
                    />
                  );
                })}
              </Animated.View>
            )}

            <DailyQuranGoalCard c={c} onContinueReading={() => { setResumeTarget(getLastViewed()); setQuranOpen(true); }} />
            <SupportMasjidCard c={c} />
            <CommunityPartnersSection c={c} />
          </View>
        </ScrollView>

      <Modal
        visible={quranOpen}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => { setQuranOpen(false); setResumeTarget(null); }}
      >
        <QuranScreen onClose={() => { setQuranOpen(false); setResumeTarget(null); }} initial={resumeTarget} />
      </Modal>

      <PrayerNotificationSheet
        prayer={sheetPrayer}
        currentSettings={sheetPrayer ? getSettings(sheetPrayer) : []}
        onSave={(settings) => {
          if (sheetPrayer) savePrayerSettings(sheetPrayer, settings).catch(() => {});
        }}
        onApplyToAll={(settings) => {
          applyToAll(settings).catch(() => {});
        }}
        onClose={() => setSheetPrayer(null)}
      />
    </View>
  );
}

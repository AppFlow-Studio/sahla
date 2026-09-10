import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { GlassSurface } from '../components/ui/glass-surface';
import { Tappable } from '../components/ui/tappable';
import { CENTERED_GLYPH } from '../lib/text-styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  getGoals,
  getKhatmStats,
  getPagesForDate,
  getPeriodPages,
  getStreak,
  setGoals,
  type Goals,
} from '../lib/quran-tracker';
import { useTrackerVersion } from '../hooks/use-tracker';
import { useUserPreferences } from '../hooks/use-user-preferences';
import { useQuranPalette, type QuranPalette } from '../hooks/use-quran-palette';
import { BackButton } from '@/src/components/ui/back-button';

type Props = { onClose?: () => void };

export default function QuranTrackerScreen({ onClose }: Props) {
  const palette = useQuranPalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  const version = useTrackerVersion();
  // Pull the server-side goal mutation up here so the morphing editor at the
  // bottom can fire it alongside the existing MMKV write — keeps the engagement
  // -nudge scheduler in step with whatever the user chose in the UI.
  const { upsertQuranDailyGoal } = useUserPreferences();
  const snapshot = useMemo(
    () => ({
      goals: getGoals(),
      today: getPagesForDate(),
      week: getPeriodPages('week'),
      month: getPeriodPages('month'),
      year: getPeriodPages('year'),
      streak: getStreak(),
      khatm: getKhatmStats(),
    }),
    [version]
  );

  return (
    <View style={styles.root}>
      <View style={[styles.statusBar, { paddingTop: insets.top }]} />

      <ScrollView
        style={{ flex: 1, backgroundColor: palette.cream }}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      >
        {/* Header */}
        <View style={styles.header}>
          {onClose ? (
            <BackButton onPress={onClose} color={palette.mutedInk} style={styles.backBtn} />
          ) : (
            <View style={{ width: 28 }} />
          )}
          <Text style={styles.headerTitle}>My Quran</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Today ring + streak */}
        <TodayBlock
          pages={snapshot.today}
          goal={snapshot.goals.daily}
          streak={snapshot.streak}
          palette={palette}
          styles={styles}
        />

        {/* Khatm card */}
        <KhatmCard khatm={snapshot.khatm} styles={styles} />

        {/* Progress section */}
        <Text style={styles.sectionTitle}>PROGRESS</Text>
        <View style={styles.sectionDivider} />
        <PeriodBar label="This week" value={snapshot.week} goal={snapshot.goals.weekly} styles={styles} />
        <PeriodBar label="This month" value={snapshot.month} goal={snapshot.goals.monthly} styles={styles} />
        <PeriodBar label="This year" value={snapshot.year} goal={snapshot.goals.yearly} styles={styles} />

        {/* Goals section */}
        <Text style={styles.sectionTitle}>GOALS</Text>
        <View style={styles.sectionDivider} />
        <GoalReadout label="Daily" value={`${snapshot.goals.daily} pages`} styles={styles} />
        <GoalReadout label="Weekly" value={`${snapshot.goals.weekly} pages`} styles={styles} />
        <GoalReadout label="Monthly" value={`${snapshot.goals.monthly} pages`} styles={styles} />
        <GoalReadout label="Yearly" value={`${snapshot.goals.yearly} pages`} styles={styles} />
        <GoalReadout label="Pages counts after" value={`${snapshot.goals.dwellSeconds}s`} styles={styles} />
      </ScrollView>

      {/* Morphing edit pill / sheet */}
      <MorphingEditGoals
        expanded={editing}
        onExpand={() => setEditing(true)}
        onCollapse={() => setEditing(false)}
        goals={snapshot.goals}
        palette={palette}
        styles={styles}
        onSyncDailyGoal={(g) => upsertQuranDailyGoal.mutate(g)}
      />
    </View>
  );
}

// ─────────────────────────── today (ring) ───────────────────────────

type TrackerStyles = ReturnType<typeof makeStyles>;

function TodayBlock({
  pages,
  goal,
  streak,
  palette,
  styles,
}: {
  pages: number;
  goal: number;
  streak: number;
  palette: QuranPalette;
  styles: TrackerStyles;
}) {
  const pct = goal > 0 ? Math.min(1, pages / goal) : 0;
  return (
    <View style={styles.todayBlock}>
      <View style={styles.ornamentWrap}>
        <Image
          source={require('../../assets/quran-ring-ornament.png')}
          style={styles.ornamentImage}
        />
        <ProgressRing size={140} stroke={6} progress={pct} palette={palette}>
          <Text style={styles.ringPages}>{pages}</Text>
          <Text style={styles.ringGoal}>of {goal} today</Text>
        </ProgressRing>
      </View>
      <View style={styles.streakCenter}>
        <Text style={styles.streakValue}>
          {streak} Day{streak === 1 ? '' : 's'}
        </Text>
        <Text style={styles.streakLabel}>current streak</Text>
      </View>
    </View>
  );
}

function ProgressRing({
  size,
  stroke,
  progress,
  palette,
  children,
}: {
  size: number;
  stroke: number;
  progress: number;
  palette: QuranPalette;
  children?: React.ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(1, progress)));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={palette.track}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={palette.gold}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        {/* Small dot at bottom of ring */}
        <Circle
          cx={size / 2}
          cy={size - stroke / 2}
          r={4}
          fill={palette.cream}
          stroke={palette.track}
          strokeWidth={1}
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>{children}</View>
    </View>
  );
}

// ─────────────────────────── khatm card ───────────────────────────

function KhatmCard({ khatm, styles }: { khatm: ReturnType<typeof getKhatmStats>; styles: TrackerStyles }) {
  return (
    <View style={styles.khatmOuter}>
      <View style={styles.khatmCard}>
        <Text style={styles.khatmLabel}>Quran Completion</Text>
        <Text style={styles.khatmValue}>{khatm.completedKhatms}</Text>
        <Text style={styles.khatmSub}>
          {khatm.pagesIntoCurrent} / 604 pages into the next
        </Text>
        <View style={styles.barTrack}>
          <View
            style={[styles.barFill, { width: `${khatm.currentPercent}%` }]}
          />
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────── period bar ───────────────────────────

function PeriodBar({
  label,
  value,
  goal,
  styles,
}: {
  label: string;
  value: number;
  goal: number;
  styles: TrackerStyles;
}) {
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
  return (
    <View style={styles.periodRow}>
      <View style={styles.periodHead}>
        <Text style={styles.periodLabel}>{label}</Text>
        <Text style={styles.periodValue}>
          {value} <Text style={styles.periodValueGoal}>/ {goal}</Text>
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

// ─────────────────────────── goal readout ───────────────────────────

function GoalReadout({ label, value, styles }: { label: string; value: string; styles: TrackerStyles }) {
  return (
    <View style={styles.goalRow}>
      <Text style={styles.goalLabel}>{label}</Text>
      <Text style={styles.goalValue}>{value}</Text>
    </View>
  );
}

// ─────────────────────────── morphing edit goals ───────────────────────────

function MorphingEditGoals({
  expanded,
  onExpand,
  onCollapse,
  goals,
  palette,
  styles,
  onSyncDailyGoal,
}: {
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  goals: Goals;
  palette: QuranPalette;
  styles: TrackerStyles;
  /** Best-effort push of the new daily goal to user_preferences.quran_daily_goal
   *  so the NT-ENGAGE-01 scheduler honors it. Fired on Done; failure swallowed
   *  (the local MMKV write is the source of truth for in-app UX). */
  onSyncDailyGoal: (dailyGoal: number) => void;
}) {
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<Goals>({ ...goals });

  const collapsedHeight = 52;
  const expandedHeight = 380;
  const dragThreshold = 100;

  // 0 = collapsed pill, 1 = expanded sheet
  const progress = useSharedValue(0);
  const dragY = useSharedValue(0);

  useEffect(() => {
    if (!expanded) {
      dragY.value = 0;
    }
    progress.value = withTiming(expanded ? 1 : 0, { duration: 350 });
  }, [expanded, progress, dragY]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        dragY.value = e.translationY;
        // Map drag distance to progress: full drag = collapsed
        const dragProgress = 1 - Math.min(1, e.translationY / (expandedHeight - collapsedHeight));
        progress.value = dragProgress;
      }
    })
    .onEnd((e) => {
      if (e.translationY > dragThreshold || e.velocityY > 500) {
        progress.value = withTiming(0, { duration: 250 });
        runOnJS(onCollapse)();
      } else {
        progress.value = withTiming(1, { duration: 250 });
      }
      dragY.value = 0;
    });

  useEffect(() => {
    if (expanded) setDraft({ ...goals });
  }, [expanded, goals]);

  function increment(key: keyof Goals) {
    setDraft((d) => ({ ...d, [key]: d[key] + 1 }));
  }
  function decrement(key: keyof Goals) {
    setDraft((d) => ({ ...d, [key]: Math.max(1, d[key] - 1) }));
  }
  function handleDone() {
    setGoals(draft);
    // Only the daily goal drives engagement nudges today; week/month/year
    // remain local-only and don't need a server-side counterpart yet.
    if (draft.daily !== goals.daily) onSyncDailyGoal(draft.daily);
    onCollapse();
  }

  const formatValue = (key: keyof Goals, val: number) =>
    key === 'dwellSeconds' ? `${val}s` : `${val} pages`;

  const containerStyle = useAnimatedStyle(() => ({
    height: interpolate(
      progress.value,
      [0, 1],
      [collapsedHeight, expandedHeight],
      Extrapolation.CLAMP
    ),
    left: interpolate(progress.value, [0, 1], [40, 6], Extrapolation.CLAMP),
    right: interpolate(progress.value, [0, 1], [40, 6], Extrapolation.CLAMP),
    bottom: interpolate(
      progress.value,
      [0, 1],
      [insets.bottom - 10, 6],
      Extrapolation.CLAMP
    ),
  }));

  const innerRadiusStyle = useAnimatedStyle(() => ({
    borderRadius: interpolate(
      progress.value,
      [0, 1],
      [999, 56],
      Extrapolation.CLAMP
    ),
  }));

  const collapsedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.3], [1, 0], Extrapolation.CLAMP),
  }));

  const expandedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.5, 1], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Dim backdrop */}
      {expanded ? (
        <Pressable style={StyleSheet.absoluteFill} onPress={onCollapse}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: palette.backdrop },
            ]}
          />
        </Pressable>
      ) : null}

      <Animated.View style={[styles.morphWrap, containerStyle]}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={{ flex: 1 }}>
            <Pressable
              onPress={expanded ? undefined : onExpand}
              style={{ flex: 1 }}
            >
              <GlassSurface
                glassEffectStyle="regular"
                isInteractive
                style={styles.morphInner}
                fallbackColor={palette.cream}
                fallbackBorderColor={palette.divider}
              >
                <Animated.View style={[styles.morphRadius, innerRadiusStyle]} />

                {/* Collapsed: pill button */}
                <Animated.View
                  style={[styles.collapsedContent, collapsedStyle]}
                  pointerEvents={expanded ? 'none' : 'auto'}
                >
                  <Text style={styles.editBtnText}>Edit goals</Text>
                </Animated.View>

                {/* Expanded: sheet content */}
                <Animated.View
                  style={[styles.expandedContent, expandedStyle]}
                  pointerEvents={expanded ? 'auto' : 'none'}
                >
                  <View style={styles.sheetHandle} />
                  <Text style={styles.sheetTitle}>Edit goals</Text>

                  <StepperRow
                    label="Daily"
                    value={formatValue('daily', draft.daily)}
                    onIncrement={() => increment('daily')}
                    onDecrement={() => decrement('daily')}
                    styles={styles}
                  />
                  <StepperRow
                    label="Weekly"
                    value={formatValue('weekly', draft.weekly)}
                    onIncrement={() => increment('weekly')}
                    onDecrement={() => decrement('weekly')}
                    styles={styles}
                  />
                  <StepperRow
                    label="Monthly"
                    value={formatValue('monthly', draft.monthly)}
                    onIncrement={() => increment('monthly')}
                    onDecrement={() => decrement('monthly')}
                    styles={styles}
                  />
                  <StepperRow
                    label="Yearly"
                    value={formatValue('yearly', draft.yearly)}
                    onIncrement={() => increment('yearly')}
                    onDecrement={() => decrement('yearly')}
                    styles={styles}
                  />
                  <StepperRow
                    label="Page counts after"
                    value={formatValue('dwellSeconds', draft.dwellSeconds)}
                    onIncrement={() => increment('dwellSeconds')}
                    onDecrement={() => decrement('dwellSeconds')}
                    styles={styles}
                  />

                  <Tappable onPress={handleDone} style={styles.doneBtn}>
                    <Text style={styles.doneBtnText}>Done</Text>
                  </Tappable>
                </Animated.View>
              </GlassSurface>
            </Pressable>
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </GestureHandlerRootView>
  );
}

function StepperRow({
  label,
  value,
  onIncrement,
  onDecrement,
  styles,
}: {
  label: string;
  value: string;
  onIncrement: () => void;
  onDecrement: () => void;
  styles: TrackerStyles;
}) {
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Tappable onPress={onIncrement} hitSlop={8}>
          <Text style={styles.stepperBtn}>+</Text>
        </Tappable>
        <Text style={styles.stepperValue}>{value}</Text>
        <Tappable onPress={onDecrement} hitSlop={8}>
          <Text style={styles.stepperBtn}>{'\u2013'}</Text>
        </Tappable>
      </View>
    </View>
  );
}

// ─────────────────────────── styles ───────────────────────────

function makeStyles(p: QuranPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: p.cream },

    statusBar: { backgroundColor: p.brandDark },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
      backgroundColor: p.cream,
    },
    headerTitle: {
      fontFamily: 'PlayfairDisplay_500Medium',
      color: p.brandDark,
      fontSize: 30,
      lineHeight: 52,
    },
    backBtn: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },

    todayBlock: {
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 10,
      backgroundColor: p.cream,
    },
    ornamentWrap: {
      width: 260,
      height: 260,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ornamentImage: {
      position: 'absolute',
      width: 260,
      height: 260,
      resizeMode: 'contain',
    },
    ringPages: {
      fontFamily: 'PlayfairDisplay_500Medium',
      fontSize: 45,
      color: p.brandDark,
      lineHeight: 50,
    },
    ringGoal: {
      fontSize: 12,
      color: p.mutedInk,
      marginTop: 2,
    },
    streakCenter: {
      marginTop: 20,
      alignItems: 'center',
    },
    streakValue: {
      fontFamily: 'PlayfairDisplay_500Medium',
      fontSize: 20,
      color: p.brandDark,
      lineHeight: 22,
    },
    streakLabel: {
      fontSize: 12,
      color: p.mutedInk,
      marginTop: 4,
    },

    khatmOuter: {
      marginHorizontal: 20,
      marginTop: 16,
      marginBottom: 8,
      borderRadius: 30,
      shadowColor: p.gold,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 6,
    },
    khatmCard: {
      padding: 20,
      borderRadius: 30,
      backgroundColor: p.goldTint10,
      overflow: 'hidden',
    },
    khatmLabel: {
      fontFamily: 'PlayfairDisplay_500Medium',
      fontSize: 15,
      color: p.brandDark,
    },
    khatmValue: {
      fontFamily: 'PlayfairDisplay_500Medium',
      fontSize: 45,
      color: p.brandDark,
      marginTop: 2,
      lineHeight: 50,
    },
    khatmSub: {
      fontSize: 12,
      color: p.mutedInk,
      marginTop: 2,
      marginBottom: 12,
    },
    barTrack: {
      height: 3,
      borderRadius: 100,
      backgroundColor: p.divider,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 100,
      backgroundColor: p.gold,
    },

    sectionTitle: {
      fontWeight: '600',
      fontSize: 13,
      color: p.brandDark,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      marginHorizontal: 24,
      marginTop: 28,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: p.brandDark,
      marginTop: 10,
      marginBottom: 14,
      marginHorizontal: 24,
    },

    periodRow: {
      marginBottom: 14,
      marginHorizontal: 24,
    },
    periodHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 6,
    },
    periodLabel: {
      fontSize: 13,
      color: p.brandDark,
    },
    periodValue: {
      fontSize: 13,
      color: p.mutedInk,
    },
    periodValueGoal: {
      color: p.mutedInk,
      fontSize: 13,
    },

    goalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: p.divider,
      marginHorizontal: 24,
    },
    goalLabel: {
      fontSize: 13,
      color: p.brandDark,
      flex: 1,
    },
    goalValue: {
      fontSize: 13,
      color: p.mutedInk,
    },

    // Morphing pill → sheet
    morphWrap: {
      position: 'absolute',
      overflow: 'hidden',
      borderRadius: 56,
    },
    morphInner: {
      flex: 1,
      borderRadius: 56,
      overflow: 'hidden',
      backgroundColor: 'rgba(160,160,160,0.45)',
    },
    morphRadius: {
      position: 'absolute',
      inset: 0,
    },
    collapsedContent: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
    },
    editBtnText: {
      ...CENTERED_GLYPH,
      fontWeight: '600',
      fontSize: 14,
      color: p.brandDark,
      letterSpacing: 0.2,
    },
    expandedContent: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 8,
    },
    sheetHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: p.divider,
      alignSelf: 'center',
      marginBottom: 16,
    },
    sheetTitle: {
      fontWeight: '600',
      fontSize: 14,
      color: p.brandDark,
      textAlign: 'center',
      marginBottom: 20,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: p.divider,
    },
    stepperLabel: {
      fontSize: 13,
      color: p.brandDark,
      flex: 1,
    },
    stepperControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    stepperBtn: {
      ...CENTERED_GLYPH,
      fontSize: 13,
      color: p.mutedLight,
    },
    stepperValue: {
      fontSize: 13,
      color: p.brandDark,
      minWidth: 60,
      textAlign: 'right',
    },
    doneBtn: {
      marginTop: 20,
      backgroundColor: p.brandDark,
      borderRadius: 50,
      paddingVertical: 10,
      paddingHorizontal: 30,
      alignSelf: 'center',
    },
    doneBtnText: {
      ...CENTERED_GLYPH,
      color: p.cream,
      fontSize: 12,
    },
  });
}

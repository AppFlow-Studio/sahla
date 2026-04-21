import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import { GlassView } from 'expo-glass-effect';
import SurahOrnamentTop from '../../assets/surah-ornament-top.svg';
import SurahOrnamentBottom from '../../assets/surah-ornament-bottom.svg';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  BISMILLAH_TEXT,
  getMushafPage,
  getPageForAyah,
  TOTAL_MUSHAF_PAGES,
  type MushafLine,
  type Surah,
} from '../db/quranDb';
import { useTrackPage } from '../hooks/use-track-page';
import { useQuranPalette, type QuranPalette } from '../hooks/use-quran-palette';

type Props = {
  initialPage: number;
  surahs: Surah[];
  onBack?: () => void;
};

export default function MushafPageScreen({ initialPage, surahs, onBack }: Props) {
  const palette = useQuranPalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const pagerRef = useRef<PagerView>(null);
  const insets = useSafeAreaInsets();
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pickerOpen, setPickerOpen] = useState(false);
  // Synchronously set surah on jump so the footer updates instantly, then
  // the page→surah hook can correct it when the pager settles.
  const [surahOverride, setSurahOverride] = useState<Surah | null>(null);
  const initialPosition = Math.max(0, initialPage - 1);

  const resolvedSurah = useSurahForPage(currentPage, surahs);
  const currentSurah = surahOverride ?? resolvedSurah;

  useTrackPage(currentPage, {
    viewMode: 'mushaf',
    surahNumber: currentSurah?.surah_number,
    surahName: currentSurah?.name_simple,
  });

  function jumpToSurah(surah: Surah) {
    const target = getPageForAyah(surah.surah_number, 1) ?? 1;
    const pos = Math.max(0, target - 1);
    pagerRef.current?.setPage(pos);
    setCurrentPage(target);
    setSurahOverride(surah);
    setPickerOpen(false);
  }

  // Clear the override once the hook catches up to the real page's surah.
  useEffect(() => {
    if (
      surahOverride &&
      resolvedSurah?.surah_number === surahOverride.surah_number
    ) {
      setSurahOverride(null);
    }
  }, [resolvedSurah, surahOverride]);

  return (
    <View style={styles.root}>
      {/* Dark header with surah name + juz/hizb */}
      <View style={[styles.topBandSafe, { paddingTop: insets.top }]}>
        <View style={styles.topBand}>
          <Text style={styles.topSurahName} numberOfLines={1}>
            {currentSurah ? `سُورَةُ ${currentSurah.name_arabic}` : ''}
          </Text>
          <View style={styles.topRight}>
            <Text style={styles.hizbText}>Hizb 1</Text>
            <Text style={styles.juzText}>
              <Text style={styles.juzLabel}>الجزء </Text>
              <Text style={styles.juzNum}>1</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Back + page count bar */}
      <View style={styles.toolbar}>
        <Pressable onPress={onBack} hitSlop={10} style={styles.backCircle}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Text style={styles.pageCounter}>
          {currentPage} / {TOTAL_MUSHAF_PAGES}
        </Text>
      </View>

      <PagerView
        ref={pagerRef}
        style={{ flex: 1, backgroundColor: palette.cream }}
        initialPage={initialPosition}
        offscreenPageLimit={1}
        onPageSelected={(e) => setCurrentPage(e.nativeEvent.position + 1)}
      >
        {Array.from({ length: TOTAL_MUSHAF_PAGES }, (_, i) => {
          const pageNumber = i + 1;
          const isNear = Math.abs(pageNumber - currentPage) <= 2;
          return (
            <View key={pageNumber} collapsable={false} style={{ flex: 1 }}>
              {isNear ? (
                <MushafPage pageNumber={pageNumber} surahs={surahs} />
              ) : (
                <View style={styles.pageBody} />
              )}
            </View>
          );
        })}
      </PagerView>

      {/* Morphing footer → sheet */}
      <MorphingFooter
        expanded={pickerOpen}
        onExpand={() => setPickerOpen(true)}
        onCollapse={() => setPickerOpen(false)}
        currentPage={currentPage}
        currentSurah={currentSurah}
        surahs={surahs}
        onSelectSurah={jumpToSurah}
      />
    </View>
  );
}

/**
 * Morphing footer that expands from a small pill at the bottom into a full
 * surah picker sheet. Collapsed state shows the current surah info. Expanded
 * state reveals a handle + title + list + search. The container animates
 * height and corner radius; contents cross-fade based on progress.
 */
export function MorphingFooter({
  expanded,
  onExpand,
  onCollapse,
  currentPage,
  currentSurah,
  surahs,
  onSelectSurah,
}: {
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  currentPage: number;
  currentSurah: Surah | null;
  surahs: Surah[];
  onSelectSurah: (s: Surah) => void;
}) {
  const palette = useQuranPalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  // progress: 0 = collapsed pill, 1 = half-up, 2 = full-up (search focused)
  const progress = useSharedValue(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const keyboard = useAnimatedKeyboard();

  const collapsedHeight = 58;
  const halfHeight = screenHeight * 0.72;

  useEffect(() => {
    const target = !expanded ? 0 : searchFocused ? 2 : 1;
    progress.value = withTiming(target, { duration: 320 });
  }, [expanded, searchFocused, progress]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return surahs;
    return surahs.filter(
      (s) =>
        s.name_simple.toLowerCase().includes(q) ||
        s.name_arabic.includes(query.trim()) ||
        String(s.surah_number) === q
    );
  }, [surahs, query]);

  const containerStyle = useAnimatedStyle(() => {
    // Sheet slides above the keyboard when search is focused. Full-up height
    // is computed so its top edge sits just below the safe-area (notch), with
    // the bottom aligned to the top of the keyboard — never overflowing.
    const kbLift = keyboard.height.value;
    const fullHeightDynamic =
      screenHeight - insets.top - 20 - kbLift;
    return {
      height: interpolate(
        progress.value,
        [0, 1, 2],
        [collapsedHeight, halfHeight, fullHeightDynamic],
        Extrapolation.CLAMP
      ),
      left: interpolate(progress.value, [0, 1], [14, 6], Extrapolation.CLAMP),
      right: interpolate(progress.value, [0, 1], [14, 6], Extrapolation.CLAMP),
      bottom:
        interpolate(progress.value, [0, 1], [30, 0], Extrapolation.CLAMP) +
        kbLift,
    };
  });

  const innerRadiusStyle = useAnimatedStyle(() => {
    return {
      borderRadius: interpolate(
        progress.value,
        [0, 1],
        [26, 32],
        Extrapolation.CLAMP
      ),
    };
  });

  const collapsedContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.35], [1, 0], Extrapolation.CLAMP),
  }));

  const expandedContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.45, 1], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <>
      {/* Dim backdrop when expanded */}
      {expanded ? (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCollapse}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: palette.backdrop },
            ]}
          />
        </Pressable>
      ) : null}

      <Animated.View style={[styles.morphingWrap, containerStyle]}>
        <Pressable
          onPress={expanded ? undefined : onExpand}
          style={{ flex: 1 }}
        >
          <GlassView
            glassEffectStyle="regular"
            isInteractive
            style={styles.morphingInner}
          >
            <Animated.View style={[styles.morphingRadius, innerRadiusStyle]} />

            {/* Collapsed pill content */}
            <Animated.View
              style={[styles.collapsedContent, collapsedContentStyle]}
              pointerEvents={expanded ? 'none' : 'auto'}
            >
              {currentSurah ? (
                <>
                  <View style={styles.footerBadge}>
                    <Text style={styles.footerBadgeText}>
                      {currentSurah.surah_number}
                    </Text>
                  </View>
                  <View style={styles.footerNames}>
                    <Text style={styles.footerArabic} numberOfLines={1}>
                      {currentSurah.name_arabic}
                    </Text>
                    <Text style={styles.footerSimple} numberOfLines={1}>
                      {currentSurah.name_simple}
                    </Text>
                  </View>
                  <Text style={styles.footerPage}>Page {currentPage}</Text>
                  <View style={styles.footerMenu}>
                    <View style={styles.menuLine} />
                    <View style={styles.menuLine} />
                    <View style={styles.menuLine} />
                  </View>
                </>
              ) : null}
            </Animated.View>

            {/* Expanded sheet content */}
            <Animated.View
              style={[styles.expandedContent, expandedContentStyle]}
              pointerEvents={expanded ? 'auto' : 'none'}
            >
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <View style={{ width: 24 }} />
                <Text style={styles.sheetTitle}>Surahs</Text>
                <Pressable onPress={onCollapse} hitSlop={8}>
                  <Text style={styles.sheetClose}>✕</Text>
                </Pressable>
              </View>

              <FlatList
                data={filtered}
                keyExtractor={(s) => String(s.surah_number)}
                ItemSeparatorComponent={() => (
                  <View style={styles.sheetSeparator} />
                )}
                contentContainerStyle={{ paddingBottom: 8 }}
                renderItem={({ item }) => {
                  const isCurrent =
                    currentSurah?.surah_number === item.surah_number;
                  const pageNum = getPageForAyah(item.surah_number, 1) ?? 1;
                  return (
                    <Pressable
                      style={styles.sheetRow}
                      onPress={() => onSelectSurah(item)}
                    >
                      <View
                        style={[
                          styles.sheetBadge,
                          isCurrent ? styles.sheetBadgeActive : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.sheetBadgeText,
                            isCurrent ? styles.sheetBadgeTextActive : null,
                          ]}
                        >
                          {item.surah_number}
                        </Text>
                      </View>
                      <View style={styles.sheetNames}>
                        <Text style={styles.sheetArabic}>
                          {item.name_arabic}
                        </Text>
                        <Text style={styles.sheetSub}>
                          {item.name_simple}
                          <Text style={styles.sheetSubFaint}>
                            {'  •  '}
                            {item.verses_count} Ayas
                          </Text>
                        </Text>
                      </View>
                      {isCurrent ? (
                        <View style={styles.sheetCheck}>
                          <Text style={styles.sheetCheckMark}>✓</Text>
                        </View>
                      ) : null}
                      <Text style={styles.sheetPage}>p. {pageNum}</Text>
                      <Text style={styles.sheetChevron}>›</Text>
                    </Pressable>
                  );
                }}
              />

              <GlassView
                glassEffectStyle="regular"
                isInteractive
                style={styles.sheetSearchWrap}
              >
                <Text style={styles.sheetSearchIcon}>⌕</Text>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search surahs"
                  placeholderTextColor={palette.placeholderText}
                  style={styles.sheetSearchInput}
                />
              </GlassView>
            </Animated.View>
          </GlassView>
        </Pressable>
      </Animated.View>
    </>
  );
}

function useSurahForPage(page: number, surahs: Surah[]) {
  const [surah, setSurah] = useState<Surah | null>(null);
  useEffect(() => {
    let cancelled = false;
    getMushafPage(page)
      .then((lines) => {
        if (cancelled || lines.length === 0) return;
        // Find the primary surah for the page: prefer surah_name line,
        // otherwise any line's surah_number (ayah lines don't carry it, so
        // we fall back to the first surah_name occurrence).
        const surahLine = lines.find((l) => l.surah_number != null);
        if (surahLine?.surah_number) {
          setSurah(surahs[surahLine.surah_number - 1] ?? null);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [page, surahs]);
  return surah;
}

const MushafPage = React.memo(function MushafPage({
  pageNumber,
  surahs,
}: {
  pageNumber: number;
  surahs: Surah[];
}) {
  const palette = useQuranPalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const [lines, setLines] = useState<MushafLine[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMushafPage(pageNumber)
      .then((rows) => {
        if (!cancelled) setLines(rows);
      })
      .catch(() => {
        if (!cancelled) setLines([]);
      });
    return () => {
      cancelled = true;
    };
  }, [pageNumber]);

  if (!lines) {
    return (
      <View style={[styles.pageBody, styles.center]}>
        <ActivityIndicator color={palette.gold} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.pageScroll}
      contentContainerStyle={styles.pageBody}
      showsVerticalScrollIndicator={false}
    >
      {lines.map((line, i) => (
        <MushafLineRow
          key={`${pageNumber}-${line.line_number}-${i}`}
          line={line}
          surahs={surahs}
          styles={styles}
        />
      ))}
    </ScrollView>
  );
});

function MushafLineRow({
  line,
  surahs,
  styles,
}: {
  line: MushafLine;
  surahs: Surah[];
  styles: MushafStyles;
}) {
  if (line.line_type === 'surah_name') {
    const surah =
      line.surah_number != null ? surahs[line.surah_number - 1] : null;
    return (
      <View style={styles.ornamentBlock}>
        <SurahOrnamentTop width={240} height={48} />
        <Text style={styles.surahOrnamentText}>
          {surah ? `سُورَةُ ${surah.name_arabic}` : ''}
        </Text>
        <View style={{ transform: [{ scaleY: -1 }] }}>
          <SurahOrnamentBottom width={240} height={48} />
        </View>
      </View>
    );
  }

  if (line.line_type === 'basmallah') {
    return (
      <View style={styles.basmallahBlock}>
        <Text style={styles.basmallahText}>{BISMILLAH_TEXT}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.ayahLine, line.is_centered ? styles.centered : null]}>
      <Text style={styles.ayahText}>{line.text}</Text>
    </View>
  );
}

type MushafStyles = ReturnType<typeof makeStyles>;

function makeStyles(p: QuranPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: p.cream },
    center: { alignItems: 'center', justifyContent: 'center' },

    topBandSafe: { backgroundColor: p.brandDark },
    topBand: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingVertical: 10,
      height: 44,
    },
    topSurahName: {
      fontFamily: 'UthmanicHafs',
      color: p.cream,
      fontSize: 15,
      maxWidth: 160,
    },
    topRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    hizbText: { color: p.gold, fontSize: 12 },
    juzText: { color: p.cream, fontSize: 12 },
    juzLabel: { fontFamily: 'UthmanicHafs', fontSize: 13 },
    juzNum: { fontSize: 12 },

    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 8,
    },
    backCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: p.cream,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.divider08,
    },
    backArrow: { color: p.brandDark, fontSize: 14 },
    pageCounter: { color: p.mutedInk, fontSize: 12 },

    pageScroll: {
      flex: 1,
      backgroundColor: p.cream,
    },
    pageBody: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 110,
      backgroundColor: p.cream,
      justifyContent: 'space-between',
    },

    ornamentBlock: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    surahOrnamentText: {
      fontFamily: 'UthmanicHafs',
      color: p.brandDark,
      fontSize: 22,
      marginVertical: 6,
    },

    basmallahBlock: {
      alignItems: 'center',
      paddingVertical: 4,
    },
    basmallahText: {
      fontFamily: 'UthmanicHafs',
      fontSize: 20,
      color: p.brandDark,
      writingDirection: 'rtl',
      textAlign: 'center',
    },

    ayahLine: {
      justifyContent: 'center',
      paddingVertical: 2,
    },
    centered: { alignItems: 'center' },
    ayahText: {
      fontFamily: 'UthmanicHafs',
      fontSize: 20,
      lineHeight: 40,
      color: p.brandDark,
      textAlign: 'center',
      writingDirection: 'rtl',
    },

    footerWrap: {
      position: 'absolute',
      left: 14,
      right: 14,
      bottom: 30,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 26,
      overflow: 'hidden',
    },
    morphingWrap: {
      position: 'absolute',
      overflow: 'hidden',
      borderRadius: 32,
    },
    morphingInner: {
      flex: 1,
      borderRadius: 32,
      overflow: 'hidden',
    },
    morphingRadius: {
      position: 'absolute',
      inset: 0,
    },
    collapsedContent: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: 58,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
    },
    expandedContent: {
      flex: 1,
      paddingHorizontal: 14,
      paddingTop: 8,
    },
    footerBadge: {
      width: 25,
      height: 25,
      borderRadius: 12.5,
      backgroundColor: p.brandDark,
      alignItems: 'center',
      justifyContent: 'center',
    },
    footerBadgeText: {
      color: p.cream,
      fontSize: 11,
      fontWeight: '600',
    },
    footerNames: {
      flex: 1,
      marginLeft: 12,
    },
    footerArabic: {
      fontFamily: 'UthmanicHafs',
      color: p.brandDark,
      fontSize: 14,
    },
    footerSimple: {
      color: p.mutedInk,
      fontSize: 11,
      marginTop: 1,
    },
    footerPage: {
      color: p.mutedInk,
      fontSize: 11,
      marginRight: 10,
    },
    footerMenu: {
      alignItems: 'flex-end',
      gap: 3,
    },
    menuLine: {
      width: 16,
      height: 1,
      backgroundColor: p.mutedInk,
    },

    // Surah picker sheet
    sheetBackdrop: {
      flex: 1,
      backgroundColor: p.backdrop,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: p.cream,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingTop: 8,
      paddingHorizontal: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.divider08,
    },
    sheetHandle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: p.handleBg,
      marginBottom: 8,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: p.divider08,
      marginBottom: 4,
    },
    sheetTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: p.brandDark,
    },
    sheetClose: {
      fontSize: 18,
      color: p.brandDark,
    },
    sheetSeparator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: p.divider08,
      marginHorizontal: 8,
    },
    sheetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 12,
    },
    sheetBadge: {
      width: 25,
      height: 25,
      borderRadius: 12.5,
      backgroundColor: p.badgeBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetBadgeActive: {
      backgroundColor: p.brandDark,
    },
    sheetBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: p.brandDark,
    },
    sheetBadgeTextActive: {
      color: p.cream,
    },
    sheetNames: {
      flex: 1,
      marginLeft: 12,
    },
    sheetArabic: {
      fontFamily: 'UthmanicHafs',
      fontSize: 14,
      color: p.brandDark,
    },
    sheetSub: {
      fontSize: 10,
      color: p.mutedInk,
      marginTop: 1,
    },
    sheetSubFaint: {
      color: p.faintText,
    },
    sheetCheck: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: p.gold,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    sheetCheckMark: {
      color: p.cream,
      fontSize: 11,
      fontWeight: '700',
    },
    sheetPage: {
      fontSize: 10,
      color: p.faintTextDarker,
      marginRight: 6,
    },
    sheetChevron: {
      fontSize: 16,
      color: p.mutedInk,
    },
    sheetSearchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 8,
      marginBottom: 16,
      paddingHorizontal: 14,
      height: 42,
      borderRadius: 20,
      overflow: 'hidden',
    },
    sheetSearchIcon: {
      color: p.mutedInk,
      fontSize: 14,
    },
    sheetSearchInput: {
      flex: 1,
      fontSize: 13,
      color: p.brandDark,
    },
  });
}

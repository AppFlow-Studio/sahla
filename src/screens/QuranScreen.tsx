import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../components/ui/icon';
import { Tappable } from '../components/ui/tappable';
import { useIsRTL } from '../hooks/use-is-rtl';
import { CENTERED_GLYPH } from '../lib/text-styles';
import TopOrnament from '../../assets/quran-top-ornament.svg';
import {
  getPageForAyah,
  getSurahs,
  initQuranDb,
  type Surah,
} from '../db/quranDb';
import { storage } from '../lib/mmkv';
import type { LastViewed } from '../lib/quran-tracker';
import { useQuranPalette, type QuranPalette } from '../hooks/use-quran-palette';
import { useStatusBarStyle } from '../hooks/use-status-bar-style';
import SurahScreen from './SurahScreen';
import MushafPageScreen from './MushafPageScreen';
import QuranTrackerScreen from './QuranTrackerScreen';

type ViewMode = 'list' | 'mushaf';
type Filter = 'all' | 'makkan' | 'madinan';
const VIEW_MODE_KEY = 'quran.viewMode';

function readViewMode(): ViewMode {
  const raw = storage.getString(VIEW_MODE_KEY);
  return raw === 'mushaf' ? 'mushaf' : 'list';
}
function writeViewMode(mode: ViewMode) {
  storage.set(VIEW_MODE_KEY, mode);
}

type Props = { onClose?: () => void; initial?: LastViewed | null };

export default function QuranScreen({ onClose, initial }: Props = {}) {
  const { t } = useTranslation();
  const palette = useQuranPalette();
  useStatusBarStyle('dark');
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Surah | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => readViewMode());
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [trackerOpen, setTrackerOpen] = useState(false);
  // One-shot override: when restoring a mushaf-mode resume target we want to
  // open at the exact saved page instead of the surah's first page. Cleared
  // as soon as the user picks a different surah.
  const [initialMushafOverride, setInitialMushafOverride] = useState<number | null>(null);

  const selectSurah = (s: Surah | null) => {
    setSelected(s);
    setInitialMushafOverride(null);
  };

  const insets = useSafeAreaInsets();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await initQuranDb();
        const rows = await getSurahs();
        if (!cancelled) setSurahs(rows);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? t('quran.loadError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Apply a resume target ("Continue Reading") once surahs have loaded.
  useEffect(() => {
    if (!initial || surahs.length === 0) return;
    const surah = surahs[initial.surahNumber - 1];
    if (!surah) return;
    setSelected(surah);
    setViewMode(initial.viewMode);
    writeViewMode(initial.viewMode);
    setInitialMushafOverride(
      initial.viewMode === 'mushaf' ? initial.page : null
    );
  }, [initial, surahs.length]);

  function toggleView(next: ViewMode) {
    setViewMode(next);
    writeViewMode(next);
  }

  const filteredSurahs = useMemo(() => {
    let list = surahs;
    if (filter === 'makkan') list = list.filter((s) => s.revelation_place === 'makkah');
    else if (filter === 'madinan') list = list.filter((s) => s.revelation_place === 'madinah');
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name_simple.toLowerCase().includes(q) ||
          s.name_arabic.includes(query.trim()) ||
          String(s.surah_number) === q
      );
    }
    return list;
  }, [surahs, filter, query]);

  const mushafPage =
    initialMushafOverride ??
    (selected ? getPageForAyah(selected.surah_number, 1) ?? 1 : 1);

  const listViewing = selected && viewMode === 'list';

  return (
    <>
      {/* Tracker modal */}
      <Modal
        visible={trackerOpen}
        animationType="slide"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => setTrackerOpen(false)}
      >
        <QuranTrackerScreen onClose={() => setTrackerOpen(false)} />
      </Modal>

      {/* Full-screen modal for Mushaf so it covers the native tab bar. */}
      <Modal
        visible={!!selected && viewMode === 'mushaf'}
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => selectSurah(null)}
      >
        {selected ? (
          <MushafPageScreen
            initialPage={mushafPage}
            surahs={surahs}
            onBack={() => selectSurah(null)}
          />
        ) : null}
      </Modal>

      {/* Full-screen modal for the list reader too, so the tab bar is hidden. */}
      <Modal
        visible={!!listViewing}
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => selectSurah(null)}
      >
        {selected ? (
          <SurahScreen
            surah={selected}
            onBack={() => selectSurah(null)}
            viewMode={viewMode}
            onChangeViewMode={toggleView}
            allSurahs={surahs}
            onSelectSurah={(next) => selectSurah(next)}
          />
        ) : null}
      </Modal>

      {renderSurahList()}
    </>
  );

  function renderSurahList() {

  if (loading) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator size="large" color={palette.gold} />
        <Text style={styles.loadingText}>{t('quran.loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.root, styles.center, { paddingHorizontal: 24 }]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.safeDark, { paddingTop: insets.top }]}>
        <View style={styles.topOrnamentWrap} pointerEvents="none">
          <TopOrnament width={300} height={110} />
        </View>
        <View style={styles.content}>
          <View style={styles.titleBlock}>
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{t('quran.title')}</Text>
                <Text style={styles.subtitle}>{t('quran.subtitle')}</Text>
              </View>
              <Tappable
                onPress={() => setTrackerOpen(true)}
                hitSlop={10}
                style={styles.trackerBtn}
              >
                <Text style={styles.trackerBtnText}>{t('quran.tracker')}</Text>
              </Tappable>
              {onClose ? (
                <Tappable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
                  <Icon name="close" size={14} color={palette.brandDark} />
                </Tappable>
              ) : null}
            </View>
          </View>

          <SearchableFilterRow
            filter={filter}
            onFilter={setFilter}
            query={query}
            onQuery={setQuery}
            viewMode={viewMode}
            onToggleView={() => toggleView(viewMode === 'list' ? 'mushaf' : 'list')}
            palette={palette}
            styles={styles}
          />

          <FlatList
            data={filteredSurahs}
            keyExtractor={(item) => String(item.surah_number)}
            contentContainerStyle={{ paddingBottom: 32 }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => <SurahRow surah={item} onPress={() => selectSurah(item)} styles={styles} />}
          />
        </View>
      </View>
    </View>
  );
  } // end renderSurahList
}

function FilterPill({
  label,
  active,
  onPress,
  styles,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Tappable onPress={onPress} hitSlop={6} style={styles.filterPill}>
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
      {active ? <View style={styles.filterUnderline} /> : null}
    </Tappable>
  );
}

/** Crossfade duration, matched to `components/Discover/DiscoverHeader.tsx`. */
const SEARCH_DURATION = 250;

/**
 * The filter row, which morphs into a search bar — the same interaction as the
 * Discover header, ported to the Quran palette.
 *
 * Two absolutely-stacked layers share one `progress` value: the browse layer
 * (Makkan/Madinan pills, search icon, Mushaf/List toggle) fades out and slides
 * away, while the search layer slides in from the trailing edge. Stacking them
 * rather than swapping keeps the row's height fixed, so the surah list below
 * never jumps. `Cancel` reverses it and clears the query.
 */
function SearchableFilterRow({
  filter,
  onFilter,
  query,
  onQuery,
  viewMode,
  onToggleView,
  palette,
  styles,
}: {
  filter: Filter;
  onFilter: (f: Filter) => void;
  query: string;
  onQuery: (v: string) => void;
  viewMode: ViewMode;
  onToggleView: () => void;
  palette: QuranPalette;
  styles: ReturnType<typeof makeStyles>;
}) {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(isSearching ? 1 : 0, { duration: SEARCH_DURATION });
    // Focus only once the bar has arrived, so the keyboard doesn't race the
    // slide-in and jolt the row.
    if (isSearching) {
      const id = setTimeout(() => inputRef.current?.focus(), SEARCH_DURATION);
      return () => clearTimeout(id);
    }
  }, [isSearching, progress]);

  // Under RTL the row mirrors but translateX stays physical, so the slide has
  // to be flipped by hand or the layers would animate the wrong way.
  const dir = isRTL ? -1 : 1;

  const browseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4], [1, 0]),
    transform: [{ translateX: interpolate(progress.value, [0, 1], [0, -20 * dir]) }],
  }));

  const searchStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.3, 1], [0, 1]),
    transform: [{ translateX: interpolate(progress.value, [0, 1], [40 * dir, 0]) }],
  }));

  return (
    <View style={styles.filterRow}>
      <View style={styles.searchSwap}>
        {/* Browse layer */}
        <Animated.View
          style={[styles.searchLayer, browseStyle]}
          pointerEvents={isSearching ? 'none' : 'auto'}
        >
          <FilterPill
            label={t('quran.filterAll')}
            active={filter === 'all'}
            onPress={() => onFilter('all')}
            styles={styles}
          />
          <FilterPill
            label={t('quran.filterMakkan')}
            active={filter === 'makkan'}
            onPress={() => onFilter('makkan')}
            styles={styles}
          />
          <FilterPill
            label={t('quran.filterMadinan')}
            active={filter === 'madinan'}
            onPress={() => onFilter('madinan')}
            styles={styles}
          />
          <View style={{ flex: 1 }} />
          <Tappable
            onPress={() => setIsSearching(true)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('quran.search')}
          >
            <Image
              source={require('@/assets/images/search_icon.png')}
              style={styles.searchIcon}
              resizeMode="contain"
            />
          </Tappable>
          <Tappable onPress={onToggleView} style={styles.modeToggle} hitSlop={6}>
            <Text style={styles.modeToggleText}>
              {viewMode === 'list' ? t('quran.mushaf') : t('quran.list')}
            </Text>
          </Tappable>
        </Animated.View>

        {/* Search layer */}
        <Animated.View
          style={[styles.searchLayer, searchStyle]}
          pointerEvents={isSearching ? 'auto' : 'none'}
        >
          <View style={styles.searchPill}>
            <Image
              source={require('@/assets/images/search_icon.png')}
              style={[styles.searchIcon, { opacity: 0.6 }]}
              resizeMode="contain"
            />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={onQuery}
              onBlur={() => {
                // An empty field collapses back to the pills; a typed query
                // keeps the bar so results stay browsable without the keyboard.
                if (!query) setIsSearching(false);
              }}
              placeholder={t('quran.search')}
              placeholderTextColor={palette.placeholderText}
              returnKeyType="search"
              style={styles.searchInput}
            />
            {query.length > 0 ? (
              <Tappable
                onPress={() => onQuery('')}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
              >
                <Icon name="close" size={13} color={palette.mutedInk} />
              </Tappable>
            ) : null}
          </View>
          <Tappable
            onPress={() => {
              setIsSearching(false);
              onQuery('');
            }}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Text style={styles.searchCancel}>{t('common.cancel')}</Text>
          </Tappable>
        </Animated.View>
      </View>
    </View>
  );
}

function SurahRow({ surah, onPress, styles }: { surah: Surah; onPress: () => void; styles: ReturnType<typeof makeStyles> }) {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const palette = useQuranPalette();
  return (
    <Tappable onPress={onPress} style={styles.row}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{surah.surah_number}</Text>
      </View>
      <View style={{ flex: 1, marginStart: 12 }}>
        <Text style={styles.arabicName} numberOfLines={1}>
          {surah.name_arabic}
        </Text>
        <Text style={styles.simpleName} numberOfLines={1}>
          {surah.name_simple}
        </Text>
      </View>
      <Text style={styles.ayahCount}>{t('quran.ayahs', { count: surah.verses_count })}</Text>
      <Icon
        name={isRTL ? 'chevron-back' : 'chevron-forward'}
        size={18}
        color={palette.mutedInk}
        style={{ marginStart: 2 }}
      />
    </Tappable>
  );
}

function makeStyles(p: QuranPalette) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: p.cream,
    },
    safeDark: {
      flex: 1,
      backgroundColor: p.brandDark,
    },
    content: {
      flex: 1,
      backgroundColor: p.cream,
    },
    topBand: {
      height: 0,
      backgroundColor: p.brandDark,
      overflow: 'hidden',
    },
    topOrnamentWrap: {
      position: 'absolute',
      top: -10,
      right: 50,
      width: 260,
      height: 110,
      opacity: 1,
      transform: [],
    },
    center: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: 12,
      color: p.mutedInk,
      fontSize: 14,
    },
    errorText: {
      color: '#B00020',
      textAlign: 'center',
    },
    titleBlock: {
      paddingHorizontal: 24,
      paddingTop: 20,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.closeBtnBorder,
      marginTop: 4,
      marginStart: 8,
    },
    trackerBtn: {
      height: 32,
      paddingHorizontal: 12,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: p.brandDark,
      marginTop: 4,
    },
    trackerBtnText: {
      ...CENTERED_GLYPH,
      fontSize: 12,
      fontWeight: '600',
      color: p.cream,
    },
    title: {
      fontFamily: 'PlayfairDisplay_500Medium',
      fontSize: 30,
      color: p.brandDark,
      lineHeight: 40,
    },
    subtitle: {
      color: p.mutedInk,
      fontSize: 12,
      marginTop: 2,
    },
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 18,
      paddingBottom: 10,
      gap: 12,
    },
    filterPill: {
      position: 'relative',
      paddingVertical: 4,
    },
    filterText: {
      ...CENTERED_GLYPH,
      fontSize: 12,
      fontWeight: '500',
      color: p.mutedInk,
    },
    filterTextActive: {
      color: p.brandDark,
    },
    filterUnderline: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: -2,
      height: 1.5,
      backgroundColor: p.brandDark,
    },
    // Fixed height so the two stacked layers occupy the same box and the list
    // below never shifts as they crossfade.
    searchSwap: {
      flex: 1,
      height: 32,
      justifyContent: 'center',
    },
    searchLayer: {
      position: 'absolute',
      start: 0,
      end: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    searchIcon: {
      width: 16,
      height: 16,
    },
    searchPill: {
      flex: 1,
      height: 32,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: p.track,
    },
    searchInput: {
      ...CENTERED_GLYPH,
      flex: 1,
      marginStart: 8,
      color: p.brandDark,
      fontSize: 13,
      paddingVertical: 0,
    },
    searchCancel: {
      ...CENTERED_GLYPH,
      fontSize: 12,
      fontWeight: '500',
      color: p.brandDark,
    },
    modeToggle: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.brandDark,
    },
    modeToggleText: {
      ...CENTERED_GLYPH,
      fontSize: 11,
      fontWeight: '600',
      color: p.brandDark,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 14,
    },
    badge: {
      width: 35,
      height: 35,
      borderRadius: 10,
      backgroundColor: p.goldTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      ...CENTERED_GLYPH,
      fontFamily: 'PlayfairDisplay_500Medium',
      fontSize: 18,
      color: p.gold,
    },
    arabicName: {
      fontFamily: 'UthmanicHafs',
      fontSize: 16,
      color: p.brandDark,
      textAlign: 'left',
      writingDirection: 'rtl',
    },
    simpleName: {
      fontSize: 11,
      color: p.mutedInk,
      marginTop: 2,
    },
    ayahCount: {
      fontSize: 11,
      color: p.mutedInk,
      marginEnd: 6,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: p.divider,
      marginHorizontal: 24,
    },
  });
}

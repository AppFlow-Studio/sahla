import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
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
  const palette = useQuranPalette();
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

  const [fontsLoaded] = useFonts({
    UthmanicHafs: require('../../assets/fonts/UthmanicHafs_V22.ttf'),
  });

  const insets = useSafeAreaInsets();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await initQuranDb();
        const rows = await getSurahs();
        if (!cancelled) setSurahs(rows);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load Quran database.');
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
        onRequestClose={() => setTrackerOpen(false)}
      >
        <QuranTrackerScreen onClose={() => setTrackerOpen(false)} />
      </Modal>

      {/* Full-screen modal for Mushaf so it covers the native tab bar. */}
      <Modal
        visible={!!selected && viewMode === 'mushaf'}
        animationType="fade"
        presentationStyle="overFullScreen"
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

  if (loading || !fontsLoaded) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator size="large" color={palette.gold} />
        <Text style={styles.loadingText}>Loading Quran…</Text>
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
                <Text style={styles.title}>Surahs</Text>
                <Text style={styles.subtitle}>114 Chapters of the Holy Quran</Text>
              </View>
              <Pressable
                onPress={() => setTrackerOpen(true)}
                hitSlop={10}
                style={styles.trackerBtn}
              >
                <Text style={styles.trackerBtnText}>Tracker</Text>
              </Pressable>
              {onClose ? (
                <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.filterRow}>
            <FilterPill label="All" active={filter === 'all'} onPress={() => setFilter('all')} styles={styles} />
            <FilterPill
              label="Makkan"
              active={filter === 'makkan'}
              onPress={() => setFilter('makkan')}
              styles={styles}
            />
            <FilterPill
              label="Madinan"
              active={filter === 'madinan'}
              onPress={() => setFilter('madinan')}
              styles={styles}
            />
            <View style={{ flex: 1 }} />
            <SearchField value={query} onChange={setQuery} palette={palette} styles={styles} />
            <Pressable
              onPress={() => toggleView(viewMode === 'list' ? 'mushaf' : 'list')}
              style={styles.modeToggle}
              hitSlop={6}
            >
              <Text style={styles.modeToggleText}>
                {viewMode === 'list' ? 'Mushaf' : 'List'}
              </Text>
            </Pressable>
          </View>

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
    <Pressable onPress={onPress} hitSlop={6} style={styles.filterPill}>
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
      {active ? <View style={styles.filterUnderline} /> : null}
    </Pressable>
  );
}

function SearchField({
  value,
  onChange,
  palette,
  styles,
}: {
  value: string;
  onChange: (v: string) => void;
  palette: QuranPalette;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="Search"
      placeholderTextColor={palette.mutedInk}
      style={styles.search}
    />
  );
}

function SurahRow({ surah, onPress, styles }: { surah: Surah; onPress: () => void; styles: ReturnType<typeof makeStyles> }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{surah.surah_number}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.arabicName} numberOfLines={1}>
          {surah.name_arabic}
        </Text>
        <Text style={styles.simpleName} numberOfLines={1}>
          {surah.name_simple}
        </Text>
      </View>
      <Text style={styles.ayahCount}>{surah.verses_count} ayahs</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
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
      marginLeft: 8,
    },
    closeBtnText: {
      fontSize: 14,
      color: p.brandDark,
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
    search: {
      width: 110,
      height: 28,
      paddingHorizontal: 10,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.divider,
      color: p.brandDark,
      fontSize: 12,
      backgroundColor: 'transparent',
    },
    modeToggle: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.brandDark,
    },
    modeToggleText: {
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
      fontFamily: 'PlayfairDisplay_500Medium',
      fontSize: 18,
      color: p.gold,
    },
    arabicName: {
      fontFamily: 'UthmanicHafs',
      fontSize: 16,
      color: p.brandDark,
      textAlign: 'left',
    },
    simpleName: {
      fontSize: 11,
      color: p.mutedInk,
      marginTop: 2,
    },
    ayahCount: {
      fontSize: 11,
      color: p.mutedInk,
      marginRight: 6,
    },
    chevron: {
      fontSize: 18,
      color: p.mutedInk,
      marginLeft: 2,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: p.divider,
      marginHorizontal: 24,
    },
  });
}

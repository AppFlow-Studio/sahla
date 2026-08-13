import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BISMILLAH_TEXT,
  getAyahs,
  getPageForAyah,
  shouldShowBismillahHeader,
  type Ayah,
  type Surah,
} from '../db/quranDb';
import { Icon } from '../components/ui/icon';
import { Tappable } from '../components/ui/tappable';
import { CENTERED_GLYPH } from '../lib/text-styles';
import SurahOrnamentTop from '../../assets/surah-ornament-top.svg';
import SurahOrnamentBottom from '../../assets/surah-ornament-bottom.svg';
import { MorphingFooter } from './MushafPageScreen';
import { useTrackPage } from '../hooks/use-track-page';
import { useQuranPalette, type QuranPalette } from '../hooks/use-quran-palette';
import { BackButton } from '@/src/components/ui/back-button';

type ViewMode = 'list' | 'mushaf';

type Props = {
  surah: Surah;
  onBack?: () => void;
  viewMode?: ViewMode;
  onChangeViewMode?: (m: ViewMode) => void;
  allSurahs?: Surah[];
  onSelectSurah?: (s: Surah) => void;
};

export default function SurahScreen({
  surah,
  onBack,
  viewMode,
  onChangeViewMode,
  allSurahs = [],
  onSelectSurah,
}: Props) {
  const palette = useQuranPalette();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const insets = useSafeAreaInsets();
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await getAyahs(surah.surah_number);
        if (!cancelled) setAyahs(rows);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load ayahs.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [surah.surah_number]);

  const startingPage = useMemo(
    () => getPageForAyah(surah.surah_number, 1) ?? 1,
    [surah.surah_number]
  );

  // Track the page of the topmost visible ayah so scrolling through a long
  // surah credits multiple mushaf pages, not just the surah's first page.
  const [visiblePage, setVisiblePage] = useState<number>(startingPage);
  useEffect(() => setVisiblePage(startingPage), [startingPage]);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { item: Ayah }[] }) => {
      const top = viewableItems[0]?.item;
      if (top?.page) setVisiblePage(top.page);
    }
  ).current;
  useTrackPage(visiblePage, {
    viewMode: 'list',
    surahNumber: surah.surah_number,
    surahName: surah.name_simple,
  });

  return (
    <View style={styles.root}>
      {/* Dark header band */}
      <View style={[styles.topBandSafe, { paddingTop: insets.top }]}>
        <View style={styles.topBand}>
          <Text style={styles.topSurahName} numberOfLines={1}>
            {surah.name_arabic}
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

      {/* Back + Recite row */}
      <View style={styles.toolbar}>
        <BackButton
          onPress={onBack}
          color={palette.brandDark}
          size={18}
          variant="circle"
          circleColor={palette.cream}
          circleBorderColor={palette.divider08}
        />
        <View style={{ flex: 1 }} />
        {viewMode && onChangeViewMode ? (
          <Tappable
            onPress={() => onChangeViewMode('mushaf')}
            style={styles.recitePill}
            hitSlop={6}
          >
            <Icon name="play" size={10} color={palette.brandDark} fill={palette.brandDark} />
            <Text style={styles.reciteText}>Mushaf</Text>
          </Tappable>
        ) : null}
      </View>

      {loading ? (
        <View style={[styles.flex1, styles.center]}>
          <ActivityIndicator size="large" color={palette.gold} />
        </View>
      ) : error ? (
        <View style={[styles.flex1, styles.center, { paddingHorizontal: 24 }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={ayahs}
          keyExtractor={(item) => `${item.surah_number}:${item.verse_number}`}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListHeaderComponent={<SurahHeaderOrnament surah={surah} styles={styles} />}
          renderItem={({ item }) => <AyahItem item={item} styles={styles} />}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
        />
      )}

      <MorphingFooter
        expanded={pickerOpen}
        onExpand={() => setPickerOpen(true)}
        onCollapse={() => setPickerOpen(false)}
        currentPage={startingPage}
        currentSurah={surah}
        surahs={allSurahs}
        onSelectSurah={(next) => {
          setPickerOpen(false);
          if (onSelectSurah && next.surah_number !== surah.surah_number) {
            onSelectSurah(next);
          }
        }}
      />
    </View>
  );
}

type SurahStyles = ReturnType<typeof makeStyles>;

function SurahHeaderOrnament({ surah, styles }: { surah: Surah; styles: SurahStyles }) {
  return (
    <View style={styles.headerOrnament}>
      <SurahOrnamentTop width={180} height={36} />
      <Text style={styles.headerSurahName}>
        {`سُورَةُ ${surah.name_arabic}`}
      </Text>
      <View style={{ transform: [{ scaleY: -1 }] }}>
        <SurahOrnamentBottom width={180} height={36} />
      </View>
      {shouldShowBismillahHeader(surah) ? (
        <Text style={styles.bismillah}>{BISMILLAH_TEXT}</Text>
      ) : null}
    </View>
  );
}

function AyahItem({ item, styles }: { item: Ayah; styles: SurahStyles }) {
  return (
    <View style={styles.ayahBlock}>
      <View style={styles.ayahRow}>
        <Text style={styles.ayahText}>{item.text_uthmani}</Text>
        <View style={styles.verseMedallion}>
          <Text style={styles.verseMedallionText}>
            {toArabicNum(item.verse_number)}
          </Text>
        </View>
      </View>
      {item.translation ? (
        <Text style={styles.translation}>{item.translation}</Text>
      ) : null}
    </View>
  );
}

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
}

function makeStyles(p: QuranPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: p.cream },
    flex1: { flex: 1 },
    center: { alignItems: 'center', justifyContent: 'center' },
    errorText: { color: '#B00020', textAlign: 'center' },

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
      maxWidth: 140,
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
    recitePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.brandDark,
    },
    reciteText: { ...CENTERED_GLYPH, color: p.brandDark, fontSize: 12, fontWeight: '600' },

    headerOrnament: {
      alignItems: 'center',
      paddingTop: 4,
      paddingBottom: 8,
      paddingHorizontal: 24,
    },
    headerSurahName: {
      fontFamily: 'UthmanicHafs',
      color: p.brandDark,
      fontSize: 18,
      marginVertical: 2,
    },
    bismillah: {
      fontFamily: 'UthmanicHafs',
      color: p.brandDark,
      fontSize: 22,
      marginTop: 14,
      textAlign: 'center',
      writingDirection: 'rtl',
    },

    ayahBlock: {
      paddingHorizontal: 24,
      paddingVertical: 10,
    },
    ayahRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'flex-end',
      gap: 8,
    },
    ayahText: {
      flex: 1,
      fontFamily: 'UthmanicHafs',
      fontSize: 24,
      lineHeight: 48,
      color: p.brandDark,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    verseMedallion: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: p.gold,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    verseMedallionText: {
      fontFamily: 'UthmanicHafs',
      color: p.brandDark,
      fontSize: 10,
    },
    translation: {
      color: p.mutedInk,
      fontSize: 13,
      lineHeight: 20,
      marginTop: 6,
    },

    footerWrap: {
      position: 'absolute',
      left: 14,
      right: 14,
      bottom: 14,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 15,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.divider08,
      backgroundColor: p.cream,
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
  });
}

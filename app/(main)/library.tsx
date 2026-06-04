import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  InteractionManager,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QuranScreen from '@/src/screens/QuranScreen';
import { initQuranDb } from '@/src/db/quranDb';
import { getLastViewed, type LastViewed } from '@/src/lib/quran-tracker';
import { useQuranPalette } from '@/src/hooks/use-quran-palette';

export default function LibraryScreen() {
  const palette = useQuranPalette();
  const s = useMemo(() => makeStyles(palette), [palette]);
  const [quranOpen, setQuranOpen] = useState(false);
  const [resumeTarget, setResumeTarget] = useState<LastViewed | null>(null);
  const params = useLocalSearchParams<{ resumeQuran?: string }>();

  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() => {
      initQuranDb().catch(() => {});
    });
    return () => handle.cancel();
  }, []);

  // Triggered by "Continue Reading" elsewhere in the app: open the Quran modal
  // and, if a resume target exists, hand it to QuranScreen so it lands on the
  // exact page/surah. The query param is consumed (cleared) so it won't re-fire.
  useEffect(() => {
    if (params.resumeQuran !== '1') return;
    setResumeTarget(getLastViewed());
    setQuranOpen(true);
    router.setParams({ resumeQuran: undefined });
  }, [params.resumeQuran]);

  const closeQuran = () => {
    setQuranOpen(false);
    setResumeTarget(null);
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Library</Text>
        <Pressable
          onPress={() => setQuranOpen(true)}
          style={s.quranCard}
        >
          <View style={s.quranIconWrap}>
            <Text style={s.quranIcon}>۝</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.quranTitle}>Quran</Text>
            <Text style={s.quranSubtitle}>
              114 Chapters of the Holy Quran
            </Text>
          </View>
          <Text style={s.chevron}>›</Text>
        </Pressable>
        <View style={s.placeholder}>
          <Text style={s.placeholderText}>
            More resources coming soon.
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={quranOpen}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={closeQuran}
      >
        <QuranScreen onClose={closeQuran} initial={resumeTarget} />
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(p: ReturnType<typeof useQuranPalette>) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: p.cream,
    },
    scroll: {
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 32,
    },
    title: {
      fontFamily: 'PlayfairDisplay_500Medium',
      fontSize: 30,
      color: p.brandDark,
      marginBottom: 20,
    },
    quranCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 15,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.divider,
      backgroundColor: p.cream,
    },
    quranIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: p.goldTint15,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    quranIcon: {
      fontFamily: 'UthmanicHafs',
      color: p.gold,
      fontSize: 22,
    },
    quranTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: p.brandDark,
    },
    quranSubtitle: {
      fontSize: 12,
      color: p.mutedInk,
      marginTop: 2,
    },
    chevron: {
      fontSize: 22,
      color: p.mutedInk,
      marginLeft: 6,
    },
    placeholder: {
      marginTop: 16,
      padding: 18,
      borderRadius: 15,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.divider,
      backgroundColor: p.veryLightBg,
    },
    placeholderText: {
      color: p.mutedInk,
      fontSize: 13,
    },
  });
}

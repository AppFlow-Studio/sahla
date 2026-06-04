import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, withAlpha } from '../config';

// Inline palette (matches useQuranPalette from the real app)
const p = {
  brandDark: COLORS.primary,
  cream: COLORS.background,
  gold: COLORS.accent,
  goldTint15: withAlpha(COLORS.accent, 0.15),
  mutedInk: withAlpha(COLORS.primary, 0.6),
  divider: withAlpha(COLORS.primary, 0.1),
  veryLightBg: withAlpha(COLORS.primary, 0.03),
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: p.cream },
  scroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
  title: { fontSize: 30, fontWeight: '500', color: p.brandDark, marginBottom: 20 },
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
  quranIcon: { color: p.gold, fontSize: 22 },
  quranTitle: { fontSize: 16, fontWeight: '600', color: p.brandDark },
  quranSubtitle: { fontSize: 12, color: p.mutedInk, marginTop: 2 },
  chevron: { fontSize: 22, color: p.mutedInk, marginLeft: 6 },
  placeholder: {
    marginTop: 16,
    padding: 18,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: p.divider,
    backgroundColor: p.veryLightBg,
  },
  placeholderText: { color: p.mutedInk, fontSize: 13 },
});

export default function LibraryScreen() {
  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Library</Text>
        <Pressable style={s.quranCard}>
          <View style={s.quranIconWrap}>
            <Text style={s.quranIcon}>{'\u06DD'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.quranTitle}>Quran</Text>
            <Text style={s.quranSubtitle}>114 Chapters of the Holy Quran</Text>
          </View>
          <Text style={s.chevron}>{'\u203A'}</Text>
        </Pressable>
        <View style={s.placeholder}>
          <Text style={s.placeholderText}>More resources coming soon.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

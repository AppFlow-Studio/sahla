import { useIsFocused } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ReelItem } from '@/app/(main)/watch';
import {
  filterSavedReels,
  useSavedReels,
  type SavedClipsFilter,
  type SavedReel,
} from '@/src/hooks/use-saved-reels';
import { BackButton } from '@/src/components/ui/back-button';

/**
 * Full-screen player for the user's Saved Clips list — opened by tapping a
 * cell in the saved-clips grid. Same TikTok-style vertical feed UX as the
 * Watch tab, but the data source is `useSavedReels()` (the user's saved list)
 * instead of the full feed. The tapped cell's index is passed as a route
 * param so we open at that exact reel.
 */
const VALID_FILTERS: SavedClipsFilter[] = ['all', 'today', 'week', 'month'];

export default function SavedClipsPlayerScreen() {
  const { t } = useTranslation();
  const { index, filter } = useLocalSearchParams<{ index?: string; filter?: string }>();
  // Floor + clamp the param so a malformed value can't break initialScrollIndex.
  const initialIndex = Math.max(0, Math.floor(Number(index ?? 0)) || 0);
  const activeFilter: SavedClipsFilter = VALID_FILTERS.includes(filter as SavedClipsFilter)
    ? (filter as SavedClipsFilter)
    : 'all';

  const { data, isPending } = useSavedReels();
  // Mirror the grid's filter so the swipe-through list matches what the user
  // just saw. If the grid was on "Today", the player only swipes through today.
  const reels = useMemo(
    () => filterSavedReels(data ?? [], activeFilter),
    [data, activeFilter],
  );

  const isFocused = useIsFocused();
  const { height } = useWindowDimensions();
  const listRef = useRef<FlatList<SavedReel>>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const renderItem = useCallback(
    ({ item, index: i }: { item: SavedReel; index: number }) => (
      <ReelItem
        reel={item}
        height={height}
        isActive={i === activeIndex && isFocused}
      />
    ),
    [height, activeIndex, isFocused],
  );

  const keyExtractor = useCallback((item: SavedReel) => item.reel_id, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 });
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
      const idx = viewableItems[0]?.index;
      if (idx != null) setActiveIndex(idx);
    },
  );

  if (isPending) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color="#fffbf2" />
      </View>
    );
  }

  if (!reels.length) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-8">
        <Text style={{ color: '#fffbf2' }}>{t('profile.noSavedClips')}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <FlatList
        ref={listRef}
        data={reels}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={height}
        snapToAlignment="start"
        initialScrollIndex={initialIndex}
        getItemLayout={(_, i) => ({
          length: height,
          offset: height * i,
          index: i,
        })}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig.current}
      />

      {/* Back chevron — overlays the top-left corner of the feed. */}
      <SafeAreaView
        edges={['top']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
      >
        <BackButton
          color="#ffffff"
          variant="circle"
          circleColor="rgba(0,0,0,0.4)"
          style={{ margin: 12 }}
        />
      </SafeAreaView>
    </View>
  );
}

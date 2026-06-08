import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  filterSavedReels,
  useSavedReels,
  type SavedClipsFilter,
  type SavedReel,
} from '@/src/hooks/use-saved-reels';

const COLUMNS = 3;
const GAP = 2; // YouTube Shorts has thin gaps between cells

// Reuses the app's text-on-cream palette (dark green primary).
const INK = '#0a261e';
const INK_MUTED = 'rgba(10,38,30,0.6)';

// Same UI font Discover uses for its tab labels — keep the two screens aligned.
const platformUiFont = Platform.select({
  ios: 'SF Pro Text',
  android: 'Roboto',
  default: 'system-ui',
});

/**
 * Cell preview — when there's a real `thumbnail_url` we use that; otherwise we
 * mount a paused VideoView so the video's first frame acts as the poster.
 * One AVPlayer per visible cell; FlatList only mounts ~9 at a time so it's safe.
 * Replace with server-side thumbnails once `reels.thumbnail_url` is populated.
 */
function ReelThumb({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
    p.muted = true;
    // Intentionally don't .play() — leaves the player at frame 0 (the poster).
  });
  return (
    <VideoView
      player={player}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      contentFit="cover"
      nativeControls={false}
      allowsVideoFrameAnalysis={false}
    />
  );
}

const FILTERS: { value: SavedClipsFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
];

export default function SavedClipsScreen() {
  const { data, isPending, isError, refetch } = useSavedReels();
  const { width } = useWindowDimensions();
  const [filter, setFilter] = useState<SavedClipsFilter>('all');
  const allReels = data ?? [];
  // Bucket client-side — rolling windows (last 24h / 7d / 30d). Cheap, instant
  // switching, no extra round-trip. The player route receives the same filter
  // so the swipe-through list matches what was visible in the grid.
  const reels = useMemo(() => filterSavedReels(allReels, filter), [allReels, filter]);

  const cellWidth = (width - GAP * (COLUMNS - 1)) / COLUMNS;
  const cellHeight = cellWidth * (16 / 9); // portrait 9:16

  const renderItem = ({ item, index }: { item: SavedReel; index: number }) => (
    <Pressable
      onPress={() =>
        router.push(
          `/profile/saved-clips-player?index=${index}&filter=${filter}` as Href,
        )
      }
      style={{
        width: cellWidth,
        height: cellHeight,
        backgroundColor: '#0a261e',
        overflow: 'hidden',
      }}
      className="active:opacity-80"
    >
      {/* Server-side thumbnail when available; otherwise first-frame preview.
          Nothing is drawn on top — the cell is just the video frame. */}
      {item.thumbnail_url ? (
        <Image
          source={{ uri: item.thumbnail_url }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          contentFit="cover"
        />
      ) : (
        <ReelThumb url={item.video_url} />
      )}
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 12,
          paddingVertical: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          className="active:opacity-60"
          style={{ position: 'absolute', left: 12, padding: 4 }}
        >
          <Ionicons name="chevron-back" size={26} color={INK} />
        </Pressable>
        <Text
          style={{
            color: INK,
            fontSize: 18,
            fontWeight: '600',
          }}
        >
          Saved Clips
        </Text>
      </View>

      {/* Filter tabs — rolling Today / Week / Month buckets, or All.
          Visual style mirrors `components/Discover/DiscoverHeader.tsx`
          (plain label + 16px underline on the active tab). */}
      <View className="flex-row items-center gap-4 px-6 pb-3">
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <Pressable key={f.value} onPress={() => setFilter(f.value)} hitSlop={6}>
              <Text
                style={{
                  fontFamily: platformUiFont,
                  fontSize: 12,
                  fontWeight: active ? '600' : '500',
                  color: active ? INK : INK_MUTED,
                }}
              >
                {f.label}
              </Text>
              {active ? (
                <View
                  className="mt-1 h-px w-4"
                  style={{ backgroundColor: INK }}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {/* Body — loading / error / empty / grid */}
      {isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={INK} />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text
            style={{
              color: INK_MUTED,
              textAlign: 'center',
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            Couldn&apos;t load your saved clips.
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="active:opacity-70"
            style={{
              borderWidth: 0.5,
              borderColor: INK_MUTED,
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: 50,
            }}
          >
            <Text style={{ color: INK, fontSize: 13, fontWeight: '600' }}>
              Try again
            </Text>
          </Pressable>
        </View>
      ) : reels.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons
            name="bookmark-outline"
            size={36}
            color="rgba(10,38,30,0.4)"
          />
          <Text
            style={{
              color: INK,
              fontSize: 16,
              fontWeight: '600',
              marginTop: 12,
            }}
          >
            {allReels.length === 0 ? 'No saved clips yet' : 'Nothing in this window'}
          </Text>
          <Text
            style={{
              color: INK_MUTED,
              fontSize: 13,
              textAlign: 'center',
              marginTop: 6,
              lineHeight: 18,
            }}
          >
            {allReels.length === 0
              ? `Tap the bookmark on any reel in\nWatch to save it here.`
              : `No clips saved in the selected\nwindow — try "All".`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={reels}
          keyExtractor={(item) => item.reel_id}
          numColumns={COLUMNS}
          renderItem={renderItem}
          columnWrapperStyle={{ gap: GAP }}
          ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
}

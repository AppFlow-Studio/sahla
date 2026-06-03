import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Reel } from '@/src/hooks/use-reels';
import { useSavedReels } from '@/src/hooks/use-saved-reels';

const COLUMNS = 3;
const GAP = 2; // YouTube Shorts has thin gaps between cells

// Reuses the app's text-on-cream palette (dark green primary).
const INK = '#0a261e';
const INK_MUTED = 'rgba(10,38,30,0.6)';

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

export default function SavedClipsScreen() {
  const { data, isPending, isError, refetch } = useSavedReels();
  const { width } = useWindowDimensions();
  const reels = data ?? [];

  const cellWidth = (width - GAP * (COLUMNS - 1)) / COLUMNS;
  const cellHeight = cellWidth * (16 / 9); // portrait 9:16

  const renderItem = ({ item, index }: { item: Reel; index: number }) => (
    <Pressable
      onPress={() =>
        router.push(`/profile/saved-clips-player?index=${index}` as Href)
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
            No saved clips yet
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
            Tap the bookmark on any reel in{'\n'}Watch to save it here.
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

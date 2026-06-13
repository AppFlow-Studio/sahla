import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';

import { Icon, type IconName } from '@/src/components/ui/icon';
import { useStatusBarStyle } from '@/src/hooks/use-status-bar-style';
import MasjidLogo from '@/assets/masjid-logo.svg';
import NoWifiSignal from '@/assets/images/no_wifi_signal.png';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { useNetInfo } from '@react-native-community/netinfo';

import { useReels, type Reel } from '@/src/hooks/use-reels';
import { useDismissReel } from '@/src/hooks/use-dismissed-reels';
import { useIsReelLiked, useToggleReelLike } from '@/src/hooks/use-liked-reels';
import { useIsReelSaved, useToggleReelSave } from '@/src/hooks/use-saved-reels';
import {
  useReportReel,
  useBlockReelSource,
  REEL_REPORT_REASONS,
  type ReelReportReason,
} from '@/src/hooks/use-report-reel';
import { useConfigStore } from '@/src/stores/config-store';



function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function ActionButton({
  icon,
  label,
  color = '#ffffff',
  onPress,
}: {
  icon: IconName;
  label?: string;
  color?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="items-center active:opacity-70">
      <Icon name={icon} size={28} color={color} />
      {label ? (
        <Text style={{ fontSize: 10, color: '#ffffff', fontWeight: '600', marginTop: 2 }}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

function LikeButton({
  liked,
  count,
  onPress,
}: {
  liked: boolean;
  count: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const prevLiked = useRef(liked);

  useEffect(() => {
    // Only pop on the false → true transition (an actual like, not unlike).
    if (liked && !prevLiked.current) {
      scale.value = withSequence(
        withTiming(1.35, { duration: 130, easing: Easing.out(Easing.quad) }),
        withSpring(1, { damping: 8, stiffness: 230 }),
      );
    }
    prevLiked.current = liked;
  }, [liked, scale]);

  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    if (!liked) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable onPress={handlePress} className="items-center active:opacity-70">
      <Animated.View style={heartStyle}>
        <Icon
          name={liked ? 'heart' : 'heart-outline'}
          size={28}
          color={liked ? '#FF0005' : '#ffffff'}
          fill={liked ? '#FF0005' : 'none'}
        />
      </Animated.View>
      <Text style={{ fontSize: 10, color: '#ffffff', fontWeight: '600', marginTop: 2 }}>
        {count}
      </Text>
    </Pressable>
  );
}

function ReelMenu({
  onNotInterested,
  onReport,
}: {
  onNotInterested: () => void;
  onReport: () => void;
}) {
  return (
    <View
      style={{
        width: 140,
        backgroundColor: 'rgba(253, 249, 240, 0.96)',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
      }}
    >
      <Pressable
        onPress={onNotInterested}
        className="flex-row items-center active:opacity-70"
        style={{ paddingHorizontal: 14, paddingVertical: 12 }}
      >
        <Icon name="ban-outline" size={14} color="#0A261E" />
        <Text style={{ marginLeft: 10, fontSize: 12, color: '#0A261E', fontWeight: '500' }}>
          Not interested
        </Text>
      </Pressable>
      <View style={{ height: 0.5, backgroundColor: 'rgba(10, 38, 30, 0.15)', marginHorizontal: 10 }} />
      <Pressable
        onPress={onReport}
        className="flex-row items-center active:opacity-70"
        style={{ paddingHorizontal: 14, paddingVertical: 12 }}
      >
        <Icon name="flag-outline" size={14} color="#0A261E" />
        <Text style={{ marginLeft: 10, fontSize: 12, color: '#0A261E', fontWeight: '500' }}>
          Report
        </Text>
      </Pressable>
    </View>
  );
}

const DISMISS_THRESHOLD = 120;
const DISMISS_VELOCITY = 800;

function BottomSheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(visible);
  const translateY = useSharedValue(600);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
      backdropOpacity.value = withTiming(1, { duration: 220 });
    } else if (mounted) {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(600, { duration: 250, easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
  }, [visible, mounted, translateY, backdropOpacity]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateY.value = Math.max(0, e.translationY);
      const progress = Math.min(1, e.translationY / 300);
      backdropOpacity.value = 1 - progress * 0.9;
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_THRESHOLD || e.velocityY > DISMISS_VELOCITY) {
        runOnJS(onClose)();
      } else {
        translateY.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
        backdropOpacity.value = withTiming(1, { duration: 220 });
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  if (!mounted) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View
          style={[{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)' }, backdropStyle]}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>
        <Animated.View
          pointerEvents="box-none"
          style={[
            { position: 'absolute', left: 0, right: 0, bottom: 0 },
            sheetStyle,
          ]}
        >
          <GestureDetector gesture={pan}>
            <Animated.View style={{ paddingHorizontal: 10, paddingBottom: 8 }}>
              {children}
            </Animated.View>
          </GestureDetector>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function MasjidCard({ onClose }: { onClose: () => void }) {
  const masjidName = useConfigStore((s) => s.config.displayName);

  return (
    <View
      style={{
        backgroundColor: 'rgba(255, 251, 242, 0.9)',
        borderRadius: 48,
        borderWidth: 1,
        borderColor: 'rgba(10, 38, 30, 0.2)',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 12,
      }}
    >
      <View
        style={{
          alignSelf: 'center',
          width: 36,
          height: 5,
          borderRadius: 3,
          backgroundColor: 'rgba(10, 38, 30, 0.25)',
          marginTop: 10,
        }}
      />

      <View style={{ paddingHorizontal: 22, paddingTop: 22, paddingBottom: 26 }}>
        <View className="flex-row items-center">
          <View
            style={{
              width: 45,
              height: 45,
              borderRadius: 10,
              backgroundColor: '#0A261E',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <MasjidLogo width={32} height={32} />
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#0A261E' }}>
              {masjidName}
            </Text>
            <Text style={{ fontSize: 12, color: 'rgba(10,38,30,0.6)', marginTop: 3 }}>
              Muslim American Society
            </Text>
            <View style={{ marginTop: 4 }} className="flex-row items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Icon
                  key={i}
                  name="star"
                  size={10}
                  color="rgba(10,38,30,0.5)"
                  style={{ marginRight: 2 }}
                />
              ))}
              <Text style={{ fontSize: 10, color: 'rgba(10,38,30,0.6)', marginLeft: 4 }}>4.9</Text>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            className="active:opacity-80"
            style={{
              backgroundColor: '#007AFF',
              paddingHorizontal: 18,
              paddingVertical: 5,
              borderRadius: 12,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#ffffff' }}>GET</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ height: 0.5, backgroundColor: 'rgba(10,38,30,0.1)' }} />

      <View style={{ paddingHorizontal: 22, paddingTop: 22, paddingBottom: 28 }}>
        <Text
          style={{
            fontSize: 11,
            letterSpacing: 1,
            color: 'rgba(10,38,30,0.55)',
            fontWeight: '600',
          }}
        >
          ABOUT THIS APP
        </Text>
        <Text style={{ fontSize: 13, color: '#0A261E', marginTop: 12, lineHeight: 20 }}>
          Your community hub for prayer times, events, programs, and staying connected with{' '}
          {masjidName}
        </Text>
      </View>

      <View style={{ height: 0.5, backgroundColor: 'rgba(10,38,30,0.1)' }} />

      <View className="flex-row" style={{ paddingVertical: 24 }}>
        <StatColumn label="RATING" value="4.9" />
        <StatDivider />
        <StatColumn label="AGE" value="12+" />
        <StatDivider />
        <StatColumn label="PRICE" value="Free" />
      </View>
    </View>
  );
}

function StatColumn({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center">
      <Text style={{ fontSize: 16, fontWeight: '600', color: '#0A261E' }}>{value}</Text>
      <Text
        style={{ fontSize: 10, letterSpacing: 1.2, color: 'rgba(10,38,30,0.55)', marginTop: 6, fontWeight: '500' }}
      >
        {label}
      </Text>
    </View>
  );
}

function StatDivider() {
  return <View style={{ width: 0.5, backgroundColor: 'rgba(10,38,30,0.15)', marginVertical: 4 }} />;
}

function DescriptionPanel({
  reel,
  visible,
  onClose,
}: {
  reel: Reel;
  visible: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const translateY = useSharedValue(500);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) });
      backdropOpacity.value = withTiming(1, { duration: 250 });
    } else if (mounted) {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(500, { duration: 280, easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
  }, [visible, mounted, translateY, backdropOpacity]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // Swipe-down-to-dismiss. Attached to the non-scrolling handle/header so it
  // never fights the description ScrollView.
  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 80 || e.velocityY > 600) {
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
      }
    });

  if (!mounted) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
      <Animated.View style={[{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }, backdropStyle]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#1a1a1a',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '55%',
          },
          panelStyle,
        ]}
      >
        <GestureDetector gesture={pan}>
          <View>
            {/* Drag handle */}
            <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' }} />
            </View>

            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 }}>
              <Text style={{ color: '#ffffff', fontSize: 17, fontWeight: '700' }}>Description</Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <Icon name="close" size={22} color="#ffffff" />
              </Pressable>
            </View>
          </View>
        </GestureDetector>

        <View style={{ height: 0.5, backgroundColor: 'rgba(255,255,255,0.12)' }} />

        {/* Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}
        >
          {reel.caption ? (
            <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600', lineHeight: 22 }}>
              {reel.caption}
            </Text>
          ) : null}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700' }}>
                {formatCount(reel.like_count ?? 0)}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>Likes</Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700' }}>
                {formatCount(reel.view_count ?? 0)}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>Views</Text>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function ReportSheet({
  visible,
  onClose,
  masjidName,
  onSelectReason,
  onBlock,
}: {
  visible: boolean;
  onClose: () => void;
  masjidName: string;
  onSelectReason: (reason: ReelReportReason) => void;
  onBlock: () => void;
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View
        style={{
          backgroundColor: 'rgba(253, 249, 240, 0.98)',
          borderRadius: 28,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 6 },
          elevation: 10,
        }}
      >
        <View
          style={{
            alignSelf: 'center',
            width: 36,
            height: 5,
            borderRadius: 3,
            backgroundColor: 'rgba(10, 38, 30, 0.25)',
            marginTop: 10,
          }}
        />
        <View style={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: 6 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: '#0A261E' }}>
            Report this reel
          </Text>
          <Text style={{ fontSize: 13, color: 'rgba(10,38,30,0.6)', marginTop: 4 }}>
            Why are you reporting this?
          </Text>
        </View>

        {REEL_REPORT_REASONS.map((r) => (
          <Pressable
            key={r.value}
            onPress={() => onSelectReason(r.value)}
            className="flex-row items-center justify-between active:opacity-60"
            style={{ paddingHorizontal: 22, paddingVertical: 14 }}
          >
            <Text style={{ fontSize: 15, color: '#0A261E' }}>{r.label}</Text>
            <Icon name="chevron-forward" size={16} color="rgba(10,38,30,0.4)" />
          </Pressable>
        ))}

        <View style={{ height: 0.5, backgroundColor: 'rgba(10,38,30,0.12)', marginHorizontal: 22 }} />

        <Pressable
          onPress={onBlock}
          className="flex-row items-center active:opacity-60"
          style={{ paddingHorizontal: 22, paddingVertical: 16 }}
        >
          <Icon name="ban-outline" size={16} color="#B00020" />
          <Text style={{ marginLeft: 10, fontSize: 15, fontWeight: '600', color: '#B00020' }}>
            Block {masjidName}
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

export function ReelItem({
  reel,
  height,
  isActive,
}: {
  reel: Reel;
  height: number;
  isActive: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [captionTruncated, setCaptionTruncated] = useState(false);
  // Local pause state — single-tapping the reel toggles play/pause (TikTok-style).
  const [paused, setPaused] = useState(false);
  const masjidName = useConfigStore((s) => s.config.displayName);
  const isSavedQ = useIsReelSaved(reel.reel_id);
  const toggleSave = useToggleReelSave(reel.reel_id, reel.mosque_id);
  const saved = !!isSavedQ.data;
  const isLikedQ = useIsReelLiked(reel.reel_id);
  const toggleLike = useToggleReelLike(reel.reel_id, reel.mosque_id);
  const liked = !!isLikedQ.data;
  const dismissReel = useDismissReel(reel.reel_id, reel.mosque_id);
  const reportReel = useReportReel(reel.reel_id, reel.mosque_id);
  const blockSource = useBlockReelSource(reel.mosque_id);

  const handleSelectReason = (reason: ReelReportReason) => {
    setReportOpen(false);
    reportReel.mutate(
      { reason },
      {
        onSuccess: () =>
          Alert.alert(
            'Report received',
            "Thank you. Our team will review this content. We've also hidden it from your feed.",
          ),
        onError: () =>
          Alert.alert('Couldn’t submit report', 'Please check your connection and try again.'),
      },
    );
  };

  const handleBlock = () => {
    setReportOpen(false);
    Alert.alert(
      `Block ${masjidName}?`,
      `You won't see reels from ${masjidName} anymore. You can’t undo this from the app.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () =>
            blockSource.mutate(undefined, {
              onError: () =>
                Alert.alert('Couldn’t block', 'Please check your connection and try again.'),
            }),
        },
      ],
    );
  };

  const player = useVideoPlayer(reel.video_url, (p) => {
    p.loop = true;
    p.muted = false;
  });

  // On becoming active: restart from 0 + clear any prior tap-pause state.
  // Matches TikTok/IG behavior for short-form video.
  useEffect(() => {
    setPaused(false);
    setDescriptionOpen(false);
    if (isActive) {
      player.currentTime = 0;
    }
  }, [isActive, player]);

  // Drive play/pause from the combined (isActive + paused) state.
  useEffect(() => {
    if (isActive && !paused) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, paused, player]);

  // ── Double-tap-to-like (TikTok/IG style) ───────────────────────────────
  // Manual tap detection so the existing single-tap (play/pause) and the
  // nested action-button Pressables keep working via RN's responder system —
  // swapping the root for an RNGH gesture would double-fire on those buttons.
  const lastTapAt = useRef(0);
  const tapLoc = useRef({ x: 0, y: 0 });
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const burstScale = useSharedValue(0);
  const burstOpacity = useSharedValue(0);
  const burstX = useSharedValue(0);
  const burstY = useSharedValue(0);

  useEffect(() => () => {
    if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
  }, []);

  const burstStyle = useAnimatedStyle(() => ({
    opacity: burstOpacity.value,
    transform: [
      { translateX: burstX.value - 55 },
      { translateY: burstY.value - 55 },
      { scale: burstScale.value },
    ],
  }));

  const fireHeartBurst = () => {
    burstX.value = tapLoc.current.x;
    burstY.value = tapLoc.current.y;
    burstScale.value = 0;
    burstOpacity.value = 1;
    burstScale.value = withSpring(1, { damping: 11, stiffness: 180 });
    burstOpacity.value = withDelay(450, withTiming(0, { duration: 250 }));
  };

  const handleDoubleTapLike = () => {
    // Double-tap always likes, never unlikes (matches TikTok/IG).
    if (!liked) toggleLike.mutate(liked);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fireHeartBurst();
  };

  const onTapVideo = () => {
    const now = Date.now();
    if (now - lastTapAt.current < 280) {
      if (singleTapTimer.current) {
        clearTimeout(singleTapTimer.current);
        singleTapTimer.current = null;
      }
      lastTapAt.current = 0;
      handleDoubleTapLike();
    } else {
      lastTapAt.current = now;
      // Defer the play/pause toggle briefly to see if a second tap arrives.
      singleTapTimer.current = setTimeout(() => {
        setPaused((p) => !p);
        singleTapTimer.current = null;
      }, 280);
    }
  };

  const handleShare = async () => {
    const arabic = 'arabic' in reel ? (reel.arabic as string | undefined) : undefined;
    const translation =
      'translation' in reel ? (reel.translation as string | undefined) : undefined;
    const source = 'source' in reel ? (reel.source as string | undefined) : undefined;
    const message = [arabic, translation, source ? `— ${source}` : null]
      .filter(Boolean)
      .join('\n\n');
    try {
      await Share.share({
        message: message || reel.caption || '',
        title: reel.caption ?? undefined,
      });
    } catch {
      // user dismissed; no-op
    }
  };

  return (
    // Root Pressable: tapping the video toggles pause/play (matching TikTok).
    // Nested Pressables (action buttons, menu, sheet) capture their own taps.
    // FlatList claims vertical pans, so swiping doesn't fire onPress.
    <Pressable
      onPressIn={(e) => {
        tapLoc.current = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY };
      }}
      onPress={onTapVideo}
      style={{ height, width: '100%' }}
      className="bg-black"
    >
      <VideoView
        player={player}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        contentFit="cover"
        nativeControls={false}
      />

      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' }}
      />

      {isActive && paused ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(0,0,0,0.55)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="play" size={40} color="#ffffff" style={{ marginLeft: 4 }} />
          </View>
        </View>
      ) : null}

      {/* Double-tap heart burst — pops at the tap point, then fades. */}
      <Animated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', top: 0, left: 0, width: 110, height: 110, alignItems: 'center', justifyContent: 'center' },
          burstStyle,
        ]}
      >
        <Icon name="heart" size={104} color="#FF0005" fill="#FF0005" style={{ transform: [{ rotate: '-12deg' }] }} />
      </Animated.View>

      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-1 justify-center px-6">
          {'arabic' in reel && reel.arabic ? (
            <Text
              style={{
                fontFamily: 'Amiri_400Regular',
                fontSize: 34,
                color: '#ffffff',
                textAlign: 'center',
                lineHeight: 52,
              }}
            >
              {String(reel.arabic)}
            </Text>
          ) : null}
          {'urdu' in reel && reel.urdu ? (
            <Text
              style={{
                fontFamily: 'Amiri_400Regular',
                fontSize: 18,
                color: '#ffffff',
                textAlign: 'center',
                marginTop: 10,
              }}
            >
              {String(reel.urdu)}
            </Text>
          ) : null}
          {'translation' in reel && reel.translation ? (
            <Text
              style={{
                fontSize: 17,
                color: '#ffffff',
                textAlign: 'center',
                marginTop: 14,
                fontStyle: 'italic',
              }}
            >
              {String(reel.translation)}
            </Text>
          ) : null}
          {'source' in reel && reel.source ? (
            <Text
              style={{
                fontFamily: 'PlayfairDisplay_500Medium',
                fontSize: 14,
                color: 'rgba(255,255,255,0.7)',
                textAlign: 'center',
                marginTop: 16,
              }}
            >
              {String(reel.source)}
            </Text>
          ) : null}
        </View>

        <View
          style={{ position: 'absolute', right: 14, bottom: 280, gap: 28, alignItems: 'center' }}
        >
          <LikeButton
            liked={liked}
            count={formatCount(reel.like_count ?? 0)}
            onPress={() => toggleLike.mutate(liked)}
          />
          <ActionButton icon="paper-plane-outline" onPress={handleShare} />
          <ActionButton
            icon={saved ? 'bookmark' : 'bookmark-outline'}
            color={saved ? '#B8922A' : '#ffffff'}
            onPress={() => toggleSave.mutate(saved)}
          />
          <ActionButton icon="ellipsis-horizontal" onPress={() => setMenuOpen(true)} />
        </View>

        <View style={{ paddingHorizontal: 20, paddingBottom: 90 }}>
          <Pressable onPress={() => setSheetOpen(true)} className="flex-row items-center active:opacity-80">
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: '#ffffff',
                backgroundColor: '#0A261E',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <MasjidLogo width={28} height={28} />
            </View>
            <View className="ml-3 flex-1">
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#ffffff' }}>
                {reel.title ?? masjidName}
              </Text>
              <Text style={{ fontSize: 10, color: '#ffffff' }}>{masjidName}</Text>
            </View>
          </Pressable>
          {reel.caption ? (
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 10 }}>
              <Text
                numberOfLines={2}
                onPress={() => setDescriptionOpen(true)}
                onTextLayout={(e) => setCaptionTruncated(e.nativeEvent.lines.length > 1)}
                style={{ fontSize: 12, color: '#ffffff', flex: 1 }}
              >
                {reel.caption}
              </Text>
              {captionTruncated && (
                <Pressable onPress={() => setDescriptionOpen(true)} hitSlop={8}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#ffffff', marginLeft: 4 }}>
                    more
                  </Text>
                </Pressable>
              )}
            </View>
          ) : null}
        </View>
      </SafeAreaView>

      {/* Description panel — slides up from bottom, edge-to-edge */}
      <DescriptionPanel
        reel={reel}
        visible={descriptionOpen}
        onClose={() => setDescriptionOpen(false)}
      />

      {menuOpen ? (
        <Pressable
          onPress={() => setMenuOpen(false)}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <View style={{ position: 'absolute', right: 54, bottom: 260 }}>
            <ReelMenu
              onNotInterested={() => {
                setMenuOpen(false);
                dismissReel.mutate();
              }}
              onReport={() => {
                setMenuOpen(false);
                setReportOpen(true);
              }}
            />
          </View>
        </Pressable>
      ) : null}

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        <MasjidCard onClose={() => setSheetOpen(false)} />
      </BottomSheet>

      <ReportSheet
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        masjidName={reel.title ?? masjidName}
        onSelectReason={handleSelectReason}
        onBlock={handleBlock}
      />

    </Pressable>
  );
}

export default function WatchScreen() {

  const {reels, isLoading, isError, refetch} = useReels();
  const listRef = useRef<FlatList<Reel>>(null);
  const { height } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  // True while the Watch screen is the focused tab; false when the user
  // switches to Home / Discover / etc. We treat "not focused" as "no reel is
  // active" so all players pause when the screen isn't visible.
  const isFocused = useIsFocused();
  // Device connectivity — drives the no-connection overlay even when no
  // fetch is in flight (so going offline mid-session triggers it instantly).
  const netInfo = useNetInfo();
  const isOffline = netInfo.isConnected === false;
  const showNoConnection = isError || isOffline;
  const renderItem = useCallback(({ item, index }: { item: Reel; index: number }) => {
    // iOS provides only a handful of simultaneous H.264 hardware decoders.
    // Mounting a VideoView/player for every reel at once (the FlatList default
    // keeps them all alive) exhausts that pool and starves even the on-screen
    // reel, which then renders as a black frame. Mount only the active reel and
    // its immediate neighbors (so the next swipe is pre-warmed); render every
    // other row as a cheap black placeholder of the same height so paging and
    // getItemLayout stay exact.
    if (Math.abs(index - activeIndex) > 1) {
      return <View style={{ height, width: '100%' }} className="bg-black" />;
    }
    return (
      <ReelItem
        reel={item}
        height={height}
        // Pause the underlying reel while the no-connection overlay is showing.
        isActive={index === activeIndex && isFocused && !showNoConnection}
      />
    );
  }, [height, activeIndex, isFocused, showNoConnection]);
  const keyExtractor = useCallback((item: Reel) => item.reel_id, []);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 });
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
      const idx = viewableItems[0]?.index;
      if (idx != null) setActiveIndex(idx);
    },
  );

  useStatusBarStyle('light');

  if (isLoading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }
  // First-time no-connection (no cached reels to blur against) — solid-bg takeover.
  if (showNoConnection && !reels.length) {
    return (
      <View
        className="flex-1 items-center justify-center px-8"
        style={{ backgroundColor: '#0a261e' }}
      >
        <Image
          source={NoWifiSignal}
          style={{ width: 24, height: 21, marginBottom: 24 }}
          contentFit="contain"
        />
        <Text
          style={{
            color: '#fffbf2',
            fontSize: 18,
            fontWeight: '500',
            marginBottom: 12,
          }}
        >
          No connection
        </Text>
        <Text
          style={{
            color: 'rgba(255,251,242,0.6)',
            fontSize: 13,
            textAlign: 'center',
            lineHeight: 18,
            marginBottom: 24,
          }}
        >
          Check your internet connection{'\n'}and try again
        </Text>
        <Pressable
          onPress={() => refetch()}
          className="active:opacity-70"
          style={{
            borderWidth: 0.5,
            borderColor: 'rgba(255,251,242,0.6)',
            paddingHorizontal: 18,
            paddingVertical: 14,
            borderRadius: 50,
          }}
        >
          <Text style={{ color: '#fffbf2', fontSize: 13, fontWeight: '600' }}>
            Try again
          </Text>
        </Pressable>
      </View>
    );
  }
  if (!reels.length) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text style={{ color: '#ffffff' }}>No reels yet</Text>
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
        getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig.current}
      />

      {/* No-connection overlay — blurs the last-known reel + dark tint. */}
      {showNoConnection ? (
        <BlurView
          intensity={60}
          tint="dark"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
            backgroundColor: 'rgba(0,0,0,0.3)',
          }}
        >
          <Image
            source={NoWifiSignal}
            style={{ width: 24, height: 21, marginBottom: 24 }}
            contentFit="contain"
          />
          <Text
            style={{
              color: '#fffbf2',
              fontSize: 18,
              fontWeight: '500',
              marginBottom: 12,
            }}
          >
            No connection
          </Text>
          <Text
            style={{
              color: 'rgba(255,251,242,0.6)',
              fontSize: 13,
              textAlign: 'center',
              lineHeight: 18,
              marginBottom: 24,
            }}
          >
            Check your internet connection{'\n'}and try again
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="active:opacity-70"
            style={{
              borderWidth: 0.5,
              borderColor: 'rgba(255,251,242,0.6)',
              paddingHorizontal: 18,
              paddingVertical: 14,
              borderRadius: 50,
            }}
          >
            <Text style={{ color: '#fffbf2', fontSize: 13, fontWeight: '600' }}>
              Try again
            </Text>
          </Pressable>
        </BlurView>
      ) : null}
    </View>
  );
}

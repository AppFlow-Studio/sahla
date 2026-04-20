import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import MasjidLogo from '@/assets/masjid-logo.svg';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
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
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

type Reel = {
  id: string;
  mediaUrl: string;
  arabic?: string;
  urdu?: string;
  translation?: string;
  source?: string;
  creator: { name: string; masjid: string; avatarUrl: string };
  caption: string;
  likes: number;
};

const REELS: Reel[] = [
  {
    id: '1',
    mediaUrl: 'https://picsum.photos/seed/sahla-moon/800/1600',
    arabic: 'قَالَ لَا تَخَافَآ',
    urdu: 'اللہ نے فرمایا: ڈرو نہیں',
    translation: '[Allah] said, "Fear not."',
    source: 'Qur\u2019an',
    creator: {
      name: 'Sheikh Yusuf Rahman',
      masjid: 'MAS Staten Island',
      avatarUrl: 'https://picsum.photos/seed/sheikh-yusuf/80/80',
    },
    caption: 'Every Soul will taste death | Sheikh Yusuf Rahman | Must watch',
    likes: 1100,
  },
  {
    id: '2',
    mediaUrl: 'https://picsum.photos/seed/sahla-mosque/800/1600',
    arabic: 'إِنَّ مَعَ ٱلْعُسْرِ يُسْرًۭا',
    translation: 'Indeed, with hardship comes ease.',
    source: 'Qur\u2019an 94:6',
    creator: {
      name: 'Imam Abdul Hakim',
      masjid: 'MAS Staten Island',
      avatarUrl: 'https://picsum.photos/seed/imam-abdul/80/80',
    },
    caption: 'A reminder for anyone going through hard times.',
    likes: 842,
  },
  {
    id: '3',
    mediaUrl: 'https://picsum.photos/seed/sahla-dome/800/1600',
    arabic: 'وَذَكِّرْ فَإِنَّ ٱلذِّكْرَىٰ تَنفَعُ ٱلْمُؤْمِنِينَ',
    translation: 'And remind, for indeed, the reminder benefits the believers.',
    source: 'Qur\u2019an 51:55',
    creator: {
      name: 'Sheikh Yusuf Rahman',
      masjid: 'MAS Staten Island',
      avatarUrl: 'https://picsum.photos/seed/sheikh-yusuf/80/80',
    },
    caption: 'Short reminder on the power of dhikr.',
    likes: 2300,
  },
];

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
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  color?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="items-center active:opacity-70">
      <Ionicons name={icon} size={28} color={color} />
      {label ? (
        <Text style={{ fontSize: 10, color: '#ffffff', fontWeight: '600', marginTop: 2 }}>
          {label}
        </Text>
      ) : null}
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
        <Ionicons name="ban-outline" size={14} color="#0A261E" />
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
        <Ionicons name="flag-outline" size={14} color="#0A261E" />
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

function MasjidCard({ reel, onClose }: { reel: Reel; onClose: () => void }) {
  const masjidName = reel.creator.masjid;

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
                <Ionicons
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

function ReelItem({ reel, height }: { reel: Reel; height: number }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleShare = async () => {
    const message = [reel.arabic, reel.translation, reel.source ? `— ${reel.source}` : null]
      .filter(Boolean)
      .join('\n\n');
    try {
      await Share.share({ message: message || reel.caption, title: reel.caption });
    } catch {
      // user dismissed; no-op
    }
  };

  return (
    <View style={{ height, width: '100%' }} className="bg-black">
      <Image
        source={{ uri: reel.mediaUrl }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        contentFit="cover"
      />

      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-1 justify-center px-6">
          {reel.arabic ? (
            <Text
              style={{
                fontFamily: 'Amiri_400Regular',
                fontSize: 34,
                color: '#ffffff',
                textAlign: 'center',
                lineHeight: 52,
              }}
            >
              {reel.arabic}
            </Text>
          ) : null}
          {reel.urdu ? (
            <Text
              style={{
                fontFamily: 'Amiri_400Regular',
                fontSize: 18,
                color: '#ffffff',
                textAlign: 'center',
                marginTop: 10,
              }}
            >
              {reel.urdu}
            </Text>
          ) : null}
          {reel.translation ? (
            <Text
              style={{
                fontSize: 17,
                color: '#ffffff',
                textAlign: 'center',
                marginTop: 14,
                fontStyle: 'italic',
              }}
            >
              {reel.translation}
            </Text>
          ) : null}
          {reel.source ? (
            <Text
              style={{
                fontFamily: 'PlayfairDisplay_500Medium',
                fontSize: 14,
                color: 'rgba(255,255,255,0.7)',
                textAlign: 'center',
                marginTop: 16,
              }}
            >
              {reel.source}
            </Text>
          ) : null}
        </View>

        <View
          style={{ position: 'absolute', right: 14, bottom: 220, gap: 22, alignItems: 'center' }}
        >
          <ActionButton
            icon={liked ? 'heart' : 'heart-outline'}
            color={liked ? '#FF0005' : '#ffffff'}
            label={formatCount(reel.likes + (liked ? 1 : 0))}
            onPress={() => setLiked((v) => !v)}
          />
          <ActionButton icon="paper-plane-outline" onPress={handleShare} />
          <ActionButton
            icon={saved ? 'bookmark' : 'bookmark-outline'}
            color={saved ? '#B8922A' : '#ffffff'}
            onPress={() => setSaved((v) => !v)}
          />
          <ActionButton icon="ellipsis-horizontal" onPress={() => setMenuOpen(true)} />
        </View>

        <View style={{ paddingHorizontal: 20, paddingBottom: 130 }}>
          <View className="flex-row items-center">
            <Image
              source={{ uri: reel.creator.avatarUrl }}
              style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#ffffff' }}
            />
            <View className="ml-3 flex-1">
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#ffffff' }}>
                {reel.creator.name}
              </Text>
              <Text style={{ fontSize: 10, color: '#ffffff' }}>{reel.creator.masjid}</Text>
            </View>
            <Pressable
              onPress={() => setSheetOpen(true)}
              className="rounded-full bg-onboarding-surface active:opacity-80"
              style={{
                borderWidth: 0.5,
                borderColor: '#ffffff',
                paddingHorizontal: 16,
                paddingVertical: 4,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#0A261E' }}>Visit</Text>
            </Pressable>
          </View>
          <Text
            numberOfLines={1}
            style={{ fontSize: 10, color: '#ffffff', marginTop: 10 }}
          >
            {reel.caption}
          </Text>
        </View>
      </SafeAreaView>

      {menuOpen ? (
        <Pressable
          onPress={() => setMenuOpen(false)}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <View style={{ position: 'absolute', right: 54, bottom: 260 }}>
            <ReelMenu
              onNotInterested={() => setMenuOpen(false)}
              onReport={() => setMenuOpen(false)}
            />
          </View>
        </Pressable>
      ) : null}

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        <MasjidCard reel={reel} onClose={() => setSheetOpen(false)} />
      </BottomSheet>
    </View>
  );
}

export default function WatchScreen() {
  const { height } = useWindowDimensions();
  const listRef = useRef<FlatList<Reel>>(null);

  const renderItem = useCallback(
    ({ item }: { item: Reel }) => <ReelItem reel={item} height={height} />,
    [height],
  );

  const keyExtractor = useCallback((item: Reel) => item.id, []);

  return (
    <View className="flex-1 bg-black">
      <FlatList
        ref={listRef}
        data={REELS}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={height}
        snapToAlignment="start"
        getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
      />
    </View>
  );
}

import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useSupabase } from '@/src/hooks/use-supabase';

type SavedEvent = {
  content_id: string;
  name: string | null;
  image: string | null;
  start_date: string | null;
  start_time: string | null;
  local_image?: number;
  subtitle_override?: string;
};

const FALLBACK_EVENTS: SavedEvent[] = Array.from({ length: 5 }, (_, i) => ({
  content_id: `fallback-post-fajir-breakfast-${i}`,
  name: 'Post-Fajir Breakfast',
  image: null,
  start_date: 'April 19, 2026',
  start_time: '2 hours',
  local_image: require('@/assets/images/Aboodi.png'),
  subtitle_override: 'April 19, 2026 • 2 hours',
}));

const PAGE_BG = '#FFFBF2';
const STATUS_BG = '#0A261E';
const STATS_BG = '#F1E6CA';
const SEGMENT_TRACK = '#F1EDE4';
const SEGMENT_ACTIVE = '#0A261E';
const INK = '#0A261E';
const INK_MUTED = 'rgba(10,38,30,0.6)';
const GOLD = '#B8922A';
const DIVIDER = 'rgba(10,38,30,0.1)';

const SF_MEDIUM = Platform.select({ ios: 'System', default: 'sans-serif-medium' });
const SF_SEMIBOLD = Platform.select({ ios: 'System', default: 'sans-serif-medium' });
const SF_REGULAR = Platform.select({ ios: 'System', default: 'sans-serif' });

type Tab = 'events' | 'programs';

export default function Saved_Events() {
  const [tab, setTab] = useState<Tab>('events');
  const { userId, isLoaded } = useAuth();
  const supabase = useSupabase();
  const supabaseRef = useRef(supabase);
  supabaseRef.current = supabase;
  const config = useMasjidConfig();
  const { width: screenWidth } = useWindowDimensions();

  const slideX = useSharedValue(0);
  useEffect(() => {
    slideX.value = withTiming(tab === 'events' ? 0 : -screenWidth, {
      duration: 260,
    });
  }, [tab, screenWidth, slideX]);
  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  const [events, setEvents] = useState<SavedEvent[]>([]);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    let cancelled = false;

    (async () => {
      const { data: mosque } = await supabaseRef.current
        .from('mosques')
        .select('id')
        .eq('slug', config.id)
        .maybeSingle();

      if (cancelled || !mosque) return;

      const { data } = await supabaseRef.current
        .from('saved_content')
        .select(
          'content_id, content_items!inner(name, image, type, start_date, start_time)',
        )
        .eq('user_id', userId)
        .eq('mosque_id', mosque.id)
        .eq('content_items.type', 'event');

      if (cancelled) return;

      const rows = (data ?? [])
        .map((r: any) => ({
          content_id: r.content_id,
          name: r.content_items?.name ?? null,
          image: r.content_items?.image ?? null,
          start_date: r.content_items?.start_date ?? null,
          start_time: r.content_items?.start_time ?? null,
        }));

      setEvents(rows);
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId, config.id]);

  return (
    <View className="flex-1" style={{ backgroundColor: STATUS_BG }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: STATUS_BG }} />
      <View className="flex-1" style={{ backgroundColor: PAGE_BG }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="px-6 pt-4">
            <Text
              style={{
                fontFamily: 'PlayfairDisplay_500Medium',
                fontSize: 30,
                lineHeight: 52,
                color: INK,
              }}
            >
              Saved
            </Text>
          </View>

          <StatsCard total={24} lectures={11} events={8} />

          <SegmentedTabs value={tab} onChange={setTab} />

          <View style={{ marginTop: 24, overflow: 'hidden' }}>
            <Animated.View
              style={[
                { flexDirection: 'row', width: screenWidth * 2 },
                slideStyle,
              ]}
            >
              <View style={{ width: screenWidth }}>
                {(events.length > 0 ? events : FALLBACK_EVENTS).map(
                  (item, idx, arr) => (
                    <SavedRow
                      key={`events-${item.content_id}`}
                      item={item}
                      isLast={idx === arr.length - 1}
                    />
                  ),
                )}
              </View>
              <View style={{ width: screenWidth }}>
                {FALLBACK_EVENTS.map((item, idx, arr) => (
                  <SavedRow
                    key={`programs-${item.content_id}`}
                    item={item}
                    isLast={idx === arr.length - 1}
                  />
                ))}
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function StatsCard({
  total,
  lectures,
  events,
}: {
  total: number;
  lectures: number;
  events: number;
}) {
  return (
    <View className="mt-2 px-5">
      <View
        className="flex-row items-center rounded-xl"
        style={{ backgroundColor: STATS_BG, height: 59 }}
      >
        <View
          style={{
            display: 'flex',
            width: 36,
            height: 40,
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: 15,
          }}
        >
          <Text
            style={{
              color: GOLD,
              textAlign: 'center',
              fontFamily: 'Inter',
              fontSize: 20,
              fontWeight: '400',
            }}
          >
            ♥
          </Text>
        </View>
        <View style={{ marginLeft: 8 }}>
          <Stat label="TOTAL" value={total} />
        </View>
        <View style={{ marginLeft: 60 }}>
          <Stat label="LECTURES" value={lectures} />
        </View>
        <View style={{ marginLeft: 75 }}>
          <Stat label="EVENTS" value={events} />
        </View>
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View className="items-center">
      <Text
        style={{
          fontFamily: SF_SEMIBOLD,
          fontWeight: '600',
          fontSize: 10,
          lineHeight: 14,
          color: INK_MUTED,
          letterSpacing: 0.4,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: 'PlayfairDisplay_500Medium',
          fontSize: 20,
          lineHeight: 24,
          color: INK,
          marginTop: 2,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function SegmentedTabs({
  value,
  onChange,
}: {
  value: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <View className="mt-4 px-5">
      <View
        className="flex-row overflow-hidden rounded-[20px]"
        style={{ backgroundColor: SEGMENT_TRACK, height: 31 ,marginTop: 10}}
      >
        <SegmentButton
          label="Events"
          active={value === 'events'}
          onPress={() => onChange('events')}
        />
        <SegmentButton
          label="Programs"
          active={value === 'programs'}
          onPress={() => onChange('programs')}
        />
      </View>
    </View>
  );
}

function SegmentButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center justify-center rounded-[20px]"
      style={{
        backgroundColor: active ? SEGMENT_ACTIVE : 'transparent',
        borderWidth: active ? 0.5 : 0,
        borderColor: 'rgba(10,38,30,0.4)',
      }}
    >
      <Text
        style={{
          fontFamily: SF_MEDIUM,
          fontWeight: '500',
          fontSize: 11,
          color: active ? '#FFFBF2' : INK_MUTED,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SavedRow({ item, isLast }: { item: SavedEvent; isLast: boolean }) {
  const subtitle =
    item.subtitle_override ??
    [item.start_date, item.start_time].filter(Boolean).join(' • ');
  return (
    <View className="px-5">
      <Pressable className="flex-row items-center" style={{ paddingVertical: 14 }}>
        <View
          className="mr-4 overflow-hidden rounded-[10px]"
          style={{ width: 50, height: 50, backgroundColor: '#CFE0EA' }}
        >
          <Image
            source={
              item.image
                ? { uri: item.image }
                : item.local_image
                  ? item.local_image
                  : require('@/assets/images/islamic-pattern.png')
            }
            style={{ width: 50, height: 50 }}
            contentFit="cover"
          />
        </View>
        <View className="flex-1">
          <Text
            style={{
              fontFamily: SF_SEMIBOLD,
              fontWeight: '600',
              fontSize: 11,
              lineHeight: 18,
              color: INK,
            }}
            numberOfLines={1}
          >
            {item.name ?? 'Untitled'}
          </Text>
          <Text
            style={{
              fontFamily: SF_REGULAR,
              fontSize: 10,
              lineHeight: 18,
              color: INK_MUTED,
            }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        </View>
        <Pressable hitSlop={8} className="ml-2 items-center justify-center" style={{ width: 36, height: 40 }}>
          <Text
            style={{
              color: GOLD,
              textAlign: 'center',
              fontFamily: 'Inter',
              fontSize: 20,
              fontWeight: '400',
            }}
          >
            ♥
          </Text>
        </Pressable>
      </Pressable>
      {!isLast && <View style={{ height: 1, backgroundColor: DIVIDER }} />}
    </View>
  );
}

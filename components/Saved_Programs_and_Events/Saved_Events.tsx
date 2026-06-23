import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFontFamily } from '@/src/hooks/use-font-family';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useSupabase } from '@/src/hooks/use-supabase';
import { useToggleSave } from '@/src/hooks/use-saved-content';

type SavedEvent = {
  content_id: string;
  name: string | null;
  image: string | null;
  type: string | null;
  start_date: string | null;
  start_time: string | null;
  local_image?: number;
  subtitle_override?: string;
};

const PAGE_BG = '#FFFBF2';
const STATUS_BG = '#0A261E';
const STATS_BG = '#F1E6CA';
const SEGMENT_TRACK = '#F1EDE4';
const SEGMENT_ACTIVE = '#0A261E';
const INK = '#0A261E';
const INK_MUTED = 'rgba(10,38,30,0.6)';
const GOLD = '#B8922A';
const DIVIDER = 'rgba(10,38,30,0.1)';

type Tab = 'events' | 'programs';

export default function Saved_Events() {
  const [tab, setTab] = useState<Tab>('events');
  const fonts = useFontFamily();
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
  const [loading, setLoading] = useState(true);
  const [mosqueId, setMosqueId] = useState<string | null>(null);

  const removeItem = (contentId: string) =>
    setEvents((prev) => prev.filter((e) => e.content_id !== contentId));

  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data: mosque } = await supabaseRef.current
        .from('mosques')
        .select('id')
        .eq('slug', config.id)
        .maybeSingle();

      if (cancelled) return;
      if (!mosque) {
        setLoading(false);
        return;
      }
      setMosqueId(mosque.id);

      const { data, error } = await supabaseRef.current
        .from('saved_content')
        .select(
          'content_id, content_items!inner(name, image, type, start_date, start_time)',
        )
        .eq('user_id', userId)
        .eq('mosque_id', mosque.id);

      if (cancelled) return;
      if (error) {
        console.warn('[Saved_Events] fetch failed', error);
        setLoading(false);
        return;
      }

      const rows = (data ?? [])
        .map((r: any) => ({
          content_id: r.content_id,
          name: r.content_items?.name ?? null,
          image: r.content_items?.image ?? null,
          type: r.content_items?.type ?? null,
          start_date: r.content_items?.start_date ?? null,
          start_time: r.content_items?.start_time ?? null,
        }))
        .filter((r) => r.type === 'event' || r.type === 'program');

      setEvents(rows);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId, config.id]);

  return (
    <View className="flex-1" style={{ backgroundColor: PAGE_BG }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: PAGE_BG }} />
      <View className="flex-1" style={{ backgroundColor: PAGE_BG }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="px-6 pt-2">
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={{
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: -8,
              }}
            >
              <Ionicons name="chevron-back" size={26} color={INK} />
            </Pressable>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 30,
                lineHeight: 52,
                color: INK,
              }}
            >
              Saved
            </Text>
          </View>

          {(() => {
            const eventItems = events.filter((e) => e.type === 'event');
            const programItems = events.filter((e) => e.type === 'program');
            return (
              <>
                <StatsCard
                  total={events.length}
                  events={eventItems.length}
                  programs={programItems.length}
                />

                <SegmentedTabs value={tab} onChange={setTab} />

                <View style={{ marginTop: 24, overflow: 'hidden' }}>
                  <Animated.View
                    style={[
                      { flexDirection: 'row', width: screenWidth * 2 },
                      slideStyle,
                    ]}
                  >
                    <View style={{ width: screenWidth }}>
                      {loading ? (
                        <SkeletonList />
                      ) : eventItems.length > 0 ? (
                        eventItems.map((item, idx, arr) => (
                          <SavedRow
                            key={`events-${item.content_id}`}
                            item={item}
                            isLast={idx === arr.length - 1}
                            mosqueId={mosqueId}
                            onRemove={removeItem}
                          />
                        ))
                      ) : (
                        <EmptyState label="No saved events yet" />
                      )}
                    </View>
                    <View style={{ width: screenWidth }}>
                      {loading ? (
                        <SkeletonList />
                      ) : programItems.length > 0 ? (
                        programItems.map((item, idx, arr) => (
                          <SavedRow
                            key={`programs-${item.content_id}`}
                            item={item}
                            isLast={idx === arr.length - 1}
                            mosqueId={mosqueId}
                            onRemove={removeItem}
                          />
                        ))
                      ) : (
                        <EmptyState label="No saved programs yet" />
                      )}
                    </View>
                  </Animated.View>
                </View>
              </>
            );
          })()}
        </ScrollView>
      </View>
    </View>
  );
}

function StatsCard({
  total,
  events,
  programs,
}: {
  total: number;
  events: number;
  programs: number;
}) {
  const fonts = useFontFamily();
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
              fontFamily: fonts.body,
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
          <Stat label="EVENTS" value={events} />
        </View>
        <View style={{ marginLeft: 75 }}>
          <Stat label="PROGRAMS" value={programs} />
        </View>
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const fonts = useFontFamily();
  return (
    <View className="items-center">
      <Text
        style={{
          fontFamily: fonts.bodySemibold,
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
          fontFamily: fonts.display,
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
  const fonts = useFontFamily();
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
          fontFamily: fonts.bodyMedium,
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

function EmptyState({ label }: { label: string }) {
  const fonts = useFontFamily();
  return (
    <View
      className="px-5"
      style={{ alignItems: 'center', paddingVertical: 48 }}
    >
      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: 13,
          lineHeight: 18,
          color: INK_MUTED,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function SkeletonPulse({
  width,
  height,
  radius = 6,
  style,
}: {
  width: number | `${number}%`;
  height: number;
  radius?: number;
  style?: any;
}) {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.85, { duration: 850 }), -1, true);
  }, [opacity]);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: 'rgba(10,38,30,0.08)' },
        animStyle,
        style,
      ]}
    />
  );
}

function SkeletonRow({ isLast }: { isLast: boolean }) {
  return (
    <View className="px-5">
      <View className="flex-row items-center" style={{ paddingVertical: 14 }}>
        <SkeletonPulse width={50} height={50} radius={10} style={{ marginRight: 16 }} />
        <View className="flex-1">
          <SkeletonPulse width="55%" height={11} radius={5} />
          <SkeletonPulse width="35%" height={9} radius={5} style={{ marginTop: 7 }} />
        </View>
        <SkeletonPulse width={20} height={20} radius={10} style={{ marginLeft: 8 }} />
      </View>
      {!isLast && <View style={{ height: 1, backgroundColor: DIVIDER }} />}
    </View>
  );
}

function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={`skeleton-${i}`} isLast={i === count - 1} />
      ))}
    </>
  );
}

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatSavedDate(startDate: string | null): string {
  if (!startDate) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(startDate);
  if (!match) return startDate;
  const [, y, m, d] = match;
  const month = SHORT_MONTHS[Number(m) - 1];
  if (!month) return startDate;
  return `${month} ${Number(d)}, ${y}`;
}

function SavedRow({
  item,
  isLast,
  mosqueId,
  onRemove,
}: {
  item: SavedEvent;
  isLast: boolean;
  mosqueId: string | null;
  onRemove: (contentId: string) => void;
}) {
  const fonts = useFontFamily();
  const subtitle = item.subtitle_override ?? formatSavedDate(item.start_date);
  const toggleSave = useToggleSave(item.content_id, mosqueId);
  // Demo placeholder rows have no real saved_content row to remove.
  const isFallback = item.content_id.startsWith('fallback-');

  const handleUnsave = () => {
    if (isFallback || toggleSave.isPending) return;
    onRemove(item.content_id); // optimistic: drop the row immediately
    toggleSave.mutate(true); // persist the un-save (true = currently saved)
  };

  return (
    <View className="px-5">
      <Pressable
        onPress={() => router.push(`/content/${item.content_id}`)}
        className="flex-row items-center active:opacity-70"
        style={{ paddingVertical: 14 }}
      >
        <View
          className="me-4 overflow-hidden rounded-[10px]"
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
              fontFamily: fonts.bodySemibold,
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
              fontFamily: fonts.body,
              fontSize: 10,
              lineHeight: 18,
              color: INK_MUTED,
            }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        </View>
        <Pressable
          onPress={handleUnsave}
          disabled={isFallback || toggleSave.isPending}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${item.name ?? 'item'} from saved`}
          className="ms-2 items-center justify-center active:opacity-60"
          style={{ width: 36, height: 40 }}
        >
          <Text
            style={{
              color: GOLD,
              textAlign: 'center',
              fontFamily: fonts.body,
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

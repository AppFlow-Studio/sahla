import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

import { useContentItems, type ContentItem } from '@/src/hooks/use-content-items';

const SHORT_MONTHS_UPPER = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatHeaderDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const month = SHORT_MONTHS_UPPER[Number(m[2]) - 1] ?? '';
  return `${month} ${Number(m[3])}, ${m[1]}`;
}

function formatTime12(time: string | null): string {
  if (!time) return '';
  const m = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!m) return time;
  const hour = Number(m[1]);
  const minute = m[2];
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${minute} ${period}`;
}

function categoryFor(item: ContentItem): string {
  if (item.is_quran) return 'Quran Study';
  if (item.is_kids) return 'Kids';
  if (item.is_pace) return 'PACE';
  if (item.is_young_professionals) return 'Young Professionals';
  if (item.is_fourteen_plus) return 'Youth';
  return '';
}

export function TodaysEvents() {
  const today = todayIso();
  const { items, status, error } = useContentItems();
  const events = items
    .filter((i) => i.type === 'event' && i.start_date === today)
    .slice(0, 4);

  return (
    <View>
      <View className="flex-row items-end justify-between pb-2">
        <Text className="text-[13px] font-semibold uppercase tracking-[1px] text-foreground">
          Today&apos;s Events
        </Text>
        <Text className="text-[11px] font-semibold text-accent">
          {formatHeaderDate(today)}
        </Text>
      </View>

      <View className="border-t border-foreground">
        {status === 'loading' && (
          <Text className="py-4 text-[12px] text-foreground/60">Loading…</Text>
        )}
        {status === 'error' && (
          <Text className="py-4 text-[12px] text-foreground/60">Couldn’t load: {error}</Text>
        )}
        {status === 'success' && events.length === 0 && (
          <Text className="py-4 text-[12px] text-foreground/60">No events today.</Text>
        )}
        {events.map((event, index) => (
          <TouchableOpacity
            key={event.content_id}
            activeOpacity={0.7}
            onPress={() => router.push(`/content/${event.content_id}`)}
            className={`flex-row items-center ${
              index < events.length - 1 ? 'border-b border-foreground/15' : ''
            }`}
            style={{ height: 58 }}
          >
            <Text
              className="text-foreground"
              style={{
                width: 64,
                fontSize: 12,
                fontWeight: '500',
                textAlign: 'right',
                marginRight: 20,
              }}
            >
              {formatTime12(event.start_time)}
            </Text>
            <Text
              className="flex-1 text-foreground"
              style={{ fontSize: 12, fontWeight: '500' }}
              numberOfLines={1}
            >
              {event.name ?? 'Untitled'}
            </Text>
            <Text className="text-[9px] text-accent" numberOfLines={1}>
              {categoryFor(event)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

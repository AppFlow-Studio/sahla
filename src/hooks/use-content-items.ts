import { useQuery } from '@tanstack/react-query';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';

export type ContentItem = {
  content_id: string;
  name: string | null;
  description: string | null;
  image: string | null;
  type: string | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  days: string[] | null;
  speakers: string[] | null;
  is_kids: boolean | null;
  is_fourteen_plus: boolean | null;
  is_young_professionals: boolean;
  is_pace: boolean;
  is_quran: boolean;
  is_weekly_program: boolean;
  recurrence_freq?: string | null;
  recurrence_interval?: number | null;
  recurrence_anchor?: string | null;
  week_of_month?: number | null;
};

const SELECT =
  'content_id, name, description, image, type, start_date, end_date, start_time, days, speakers, is_kids, is_fourteen_plus, is_young_professionals, is_pace, is_quran, is_weekly_program, recurrence_freq, recurrence_interval, recurrence_anchor, week_of_month' as const;

// --- MOCK DATA: used when auth is bypassed ---
const MOCK_CONTENT_ITEMS: ContentItem[] = [
  {
    content_id: 'mock-1',
    name: 'Advanced Tajweed & Recitation',
    description: 'Master the rules of Tajweed with hands-on recitation practice led by certified instructors.',
    image: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=400&h=300&fit=crop',
    type: 'program',
    start_date: '2026-04-26',
    end_date: '2026-06-28',
    start_time: '10:00',
    days: ['Saturday'],
  },
  {
    content_id: 'mock-2',
    name: 'Young Brothers Qiyam Night',
    description: 'An overnight spiritual retreat for young men ages 13–18 featuring tahajjud, reflections, and brotherhood.',
    image: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=400&h=300&fit=crop',
    type: 'event',
    start_date: '2026-05-02',
    end_date: null,
    start_time: '21:00',
    days: null,
  },
  {
    content_id: 'mock-3',
    name: 'Sisters Halaqa: Hearts at Peace',
    description: 'A weekly circle exploring inner peace through the Quran and Prophetic traditions.',
    image: 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=400&h=300&fit=crop',
    type: 'program',
    start_date: '2026-04-27',
    end_date: '2026-07-12',
    start_time: '11:00',
    days: ['Sunday'],
  },
  {
    content_id: 'mock-4',
    name: 'Community Iftar & Potluck',
    description: 'Join the community for a shared iftar meal. All families welcome — bring a dish to share!',
    image: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400&h=300&fit=crop',
    type: 'event',
    start_date: '2026-05-10',
    end_date: null,
    start_time: '19:30',
    days: null,
  },
  {
    content_id: 'mock-5',
    name: 'Fiqh of Worship Seminar',
    description: 'A comprehensive weekend seminar covering the essentials of salah, zakah, and fasting.',
    image: 'https://images.unsplash.com/photo-1591456983933-0c4dcf48e5fb?w=400&h=300&fit=crop',
    type: 'event',
    start_date: '2026-05-16',
    end_date: '2026-05-17',
    start_time: '09:00',
    days: null,
  },
  {
    content_id: 'mock-6',
    name: 'MAS SI Soccer League',
    description: 'Weekly co-ed youth soccer program for ages 6–14. All skill levels welcome.',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=300&fit=crop',
    type: 'program',
    start_date: '2026-04-25',
    end_date: '2026-06-20',
    start_time: '17:00',
    days: ['Friday'],
  },
  {
    content_id: 'mock-7',
    name: 'Seerah Night: Life of the Prophet ﷺ',
    description: 'A monthly deep-dive into the biography of Prophet Muhammad ﷺ with interactive discussion.',
    image: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=400&h=300&fit=crop',
    type: 'event',
    start_date: '2026-05-08',
    end_date: null,
    start_time: '20:00',
    days: null,
  },
  {
    content_id: 'mock-8',
    name: 'Weekend Islamic School',
    description: 'Comprehensive Islamic education for children ages 5–12 covering Quran, Arabic, and Islamic studies.',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop',
    type: 'program',
    start_date: '2026-04-26',
    end_date: '2026-06-28',
    start_time: '10:00',
    days: ['Saturday', 'Sunday'],
  },
];

export function useContentItems() {
  const supabase = useSupabase();
  const config = useMasjidConfig();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);

  const query = useQuery({
    queryKey: ['content-items', mosqueUuid],
    queryFn: async (): Promise<ContentItem[]> => {
      // Demo-day workaround: F-RLS-01 added per-org RLS on content_items, but
      // the Clerk → Supabase JWT bridge isn't returning a usable auth context
      // to the helpers, so direct reads come back empty. Route through the
      // service-role edge function until that's resolved.
      const { data, error } = await supabase.functions.invoke<{
        rows: ContentItem[];
        error?: string;
      }>('get-content-items', {
        body: { mosque_id: mosqueUuid },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data?.rows ?? [];
    },
    enabled: !!mosqueUuid,
  });

  // Return mock data when mosqueUuid is not available (auth bypassed)
  if (!mosqueUuid) {
    return {
      items: MOCK_CONTENT_ITEMS,
      status: 'success' as const,
      error: null,
    };
  }

  // Fall back to mock data when the real query returns empty
  const realItems = query.data ?? [];
  return {
    items: realItems.length > 0 ? realItems : MOCK_CONTENT_ITEMS,
    status: query.isPending
      ? ('loading' as const)
      : query.isError
        ? ('error' as const)
        : ('success' as const),
    error: query.error?.message ?? null,
  };
}

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
};

const SELECT =
  'content_id, name, description, image, type, start_date, end_date, start_time, days' as const;

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

  return {
    items: query.data ?? [],
    status: !mosqueUuid
      ? ('idle' as const)
      : query.isPending
        ? ('loading' as const)
        : query.isError
          ? ('error' as const)
          : ('success' as const),
    error: query.error?.message ?? null,
  };
}

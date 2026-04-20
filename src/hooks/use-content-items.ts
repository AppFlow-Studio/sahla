import { useEffect, useRef, useState } from 'react';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useSupabase } from '@/src/hooks/use-supabase';

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

type Status = 'idle' | 'loading' | 'success' | 'error';

const SELECT =
  'content_id, name, description, image, type, start_date, end_date, start_time, days' as const;

export function useContentItems() {
  const supabase = useSupabase();
  const supabaseRef = useRef(supabase);
  supabaseRef.current = supabase;
  const config = useMasjidConfig();

  const [items, setItems] = useState<ContentItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    (async () => {
      const { data: mosque, error: mosqueErr } = await supabaseRef.current
        .from('mosques')
        .select('id')
        .eq('slug', config.id)
        .maybeSingle();

      if (cancelled) return;
      if (mosqueErr) {
        setError(mosqueErr.message);
        setStatus('error');
        return;
      }
      if (!mosque) {
        setError(`Mosque not found for slug "${config.id}"`);
        setStatus('error');
        return;
      }

      const { data, error: qError } = await supabaseRef.current
        .from('content_items')
        .select(SELECT)
        .eq('mosque_id', mosque.id)
        .order('created_at', { ascending: false });

      if (cancelled) return;
      if (qError) {
        setError(qError.message);
        setStatus('error');
        return;
      }

      setItems((data ?? []) as ContentItem[]);
      setError(null);
      setStatus('success');
    })();

    return () => {
      cancelled = true;
    };
  }, [config.id]);

  return { items, status, error };
}

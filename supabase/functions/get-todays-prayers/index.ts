/**
 * TEMPORARY READ-ONLY WORKAROUND for PT-MA.
 *
 * The `todays_prayers` table is currently locked behind a `sahla_team`
 * SELECT policy. Until F-RLS-01 ships an `org_members_select` policy,
 * regular authenticated mobile users cannot read prayer times directly.
 *
 * This edge function uses the service-role key to fetch a single mosque's
 * row set on behalf of the caller. It is read-only and scoped to a single
 * mosque per request — safe to expose because prayer times are public
 * information by their nature.
 *
 * **Delete this file (and revert use-prayer-times.ts to a direct table
 * read) once F-RLS-01 lands.**
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Body = {
  mosque_id?: string;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await req.json()) as Body;
    if (!body.mosque_id) {
      return new Response(JSON.stringify({ error: 'mosque_id required' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data, error } = await supabase
      .from('todays_prayers')
      .select('prayer_name, athan_time, iqamah_time')
      .eq('mosque_id', body.mosque_id)
      .order('athan_time', { ascending: true });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ rows: data ?? [] }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});

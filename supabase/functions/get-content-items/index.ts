/**
 * DEMO WORKAROUND — created 2026-04-25.
 *
 * F-RLS-01 added an `org_members_select` policy on `content_items` scoped by
 * `requesting_mosque_id()`, but the Clerk → Supabase third-party auth path
 * isn't returning a non-null JWT context to those helpers right now, so
 * direct reads via `supabase.from('content_items')` come back empty.
 *
 * Service-role read bypass for the demo. Mirrors `get-todays-prayers`. Retire
 * when Clerk third-party auth is verified working in Supabase.
 *
 * verify_jwt is disabled to match the rest of this project's edge functions.
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SELECT =
  'content_id, name, description, image, type, start_date, end_date, start_time, days';

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
      .from('content_items')
      .select(SELECT)
      .eq('mosque_id', body.mosque_id)
      .order('created_at', { ascending: false });

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

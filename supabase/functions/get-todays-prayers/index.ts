/**
 * DEMO WORKAROUND — re-introduced 2026-04-25.
 *
 * F-RLS-01 added an `org_members_select` policy on `todays_prayers` scoped by
 * `requesting_mosque_id()`, but the Clerk → Supabase third-party auth path
 * isn't returning a non-null JWT context to those helpers right now, so direct
 * reads via `supabase.from('todays_prayers')` come back empty.
 *
 * This service-role read bypass restores prayer-time visibility for the
 * demo. Retire it once either:
 *   (a) Clerk third-party auth is verified working in Supabase, OR
 *   (b) prayer times are sourced from the external API (per the Sahla team
 *       roadmap — see project_sahla_prayer_times_api memory).
 *
 * verify_jwt is disabled to match the rest of this project's edge functions
 * (clerk-webhooks, recommend, join-org, sync-onboarding).
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
  /** YYYY-MM-DD in the mosque's local timezone. Defaults to UTC today if absent. */
  date?: string;
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

    const date = body.date ?? new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('todays_prayers')
      .select('prayer_name, athan_time, iqamah_time')
      .eq('mosque_id', body.mosque_id)
      .eq('date', date)
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

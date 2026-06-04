/**
 * DEMO WORKAROUND — created 2026-04-25.
 *
 * Consolidated service-role bypass for CT-02 reads + mutations until the
 * Clerk → Supabase third-party auth path is verified working in staging.
 * Mirrors the pattern of `get-todays-prayers` / `get-content-items`.
 *
 * Actions:
 *   - get_detail     → fetch a single content_items row by content_id
 *   - is_saved       → saved_content existence by (user_id, content_id)
 *   - is_notif       → content_notifications existence by (user_id, content_id)
 *   - list_notif_optins → all content the user opted into reminders for, joined
 *                         with item details (powers the Notification Center)
 *   - get_settings   → notification_settings text[] for (user_id, content_id), or null if no row
 *   - toggle_save    → upsert/delete saved_content + log interaction
 *   - toggle_notif   → upsert/delete content_notifications + log interaction
 *   - set_timings    → upsert/delete content_notification_settings (empty array = delete)
 *
 * Retire when the JWT bridge is fixed; the calling hooks revert to direct
 * supabase.from() calls and rely on F-RLS-01 policies.
 *
 * **Security note:** user_id is taken from the request body, NOT from a
 * verified JWT. Anyone with the function URL could spoof it. Acceptable for
 * staging demo only — DO NOT promote this pattern to main.
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type GetDetail = { action: 'get_detail'; content_id: string };
type IsSaved = { action: 'is_saved'; user_id: string; content_id: string };
type IsNotif = { action: 'is_notif'; user_id: string; content_id: string };
type GetSettings = { action: 'get_settings'; user_id: string; content_id: string };
type ListNotifOptins = { action: 'list_notif_optins'; user_id: string };
type ToggleSave = {
  action: 'toggle_save';
  user_id: string;
  mosque_id: string;
  content_id: string;
  currently_saved: boolean;
};
type ToggleNotif = {
  action: 'toggle_notif';
  user_id: string;
  mosque_id: string;
  content_id: string;
  currently_opted_in: boolean;
};
type SetTimings = {
  action: 'set_timings';
  user_id: string;
  mosque_id: string;
  content_id: string;
  offsets: string[];
};
type Body =
  | GetDetail
  | IsSaved
  | IsNotif
  | GetSettings
  | ListNotifOptins
  | ToggleSave
  | ToggleNotif
  | SetTimings;

function jsonOk(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
function jsonError(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') return jsonError('Method not allowed', 405);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const body = (await req.json()) as Body;

    switch (body.action) {
      case 'get_detail': {
        const { data, error } = await supabase
          .from('content_items')
          .select(
            'content_id, name, description, image, type, start_date, start_time, speakers',
          )
          .eq('content_id', body.content_id)
          .maybeSingle();
        if (error) return jsonError(error.message);
        return jsonOk({ row: data });
      }
      case 'is_saved': {
        const { data, error } = await supabase
          .from('saved_content')
          .select('content_id')
          .eq('user_id', body.user_id)
          .eq('content_id', body.content_id)
          .maybeSingle();
        if (error) return jsonError(error.message);
        return jsonOk({ is_saved: !!data });
      }
      case 'is_notif': {
        const { data, error } = await supabase
          .from('content_notifications')
          .select('content_id')
          .eq('user_id', body.user_id)
          .eq('content_id', body.content_id)
          .maybeSingle();
        if (error) return jsonError(error.message);
        return jsonOk({ is_opted_in: !!data });
      }
      case 'list_notif_optins': {
        // The content this user opted into reminders for, newest opt-in first,
        // joined with the item details the Notification Center renders.
        type OptinRow = { content_id: string; created_at: string | null };
        const { data: optins, error: optinErr } = await supabase
          .from('content_notifications')
          .select('content_id, created_at')
          .eq('user_id', body.user_id)
          .order('created_at', { ascending: false });
        if (optinErr) return jsonError(optinErr.message);

        const optinRows = (optins ?? []) as OptinRow[];
        const ids = optinRows.map((o) => o.content_id);
        if (ids.length === 0) return jsonOk({ items: [] });

        const { data: rows, error: rowsErr } = await supabase
          .from('content_items')
          .select(
            'content_id, name, type, image, start_date, end_date, start_time, days, is_weekly_program',
          )
          .in('content_id', ids);
        if (rowsErr) return jsonError(rowsErr.message);

        // Stitch each item's opt-in timestamp back on, preserving opt-in order.
        const byId = new Map(
          ((rows ?? []) as { content_id: string }[]).map((r) => [r.content_id, r]),
        );
        const items = ids
          .map((id: string) => {
            const row = byId.get(id);
            if (!row) return null;
            const optedAt = optinRows.find((o) => o.content_id === id)?.created_at ?? null;
            return { ...row, opted_in_at: optedAt };
          })
          .filter(Boolean);

        return jsonOk({ items });
      }
      case 'get_settings': {
        const { data, error } = await supabase
          .from('content_notification_settings')
          .select('notification_settings')
          .eq('user_id', body.user_id)
          .eq('content_id', body.content_id)
          .maybeSingle();
        if (error) return jsonError(error.message);
        return jsonOk({
          settings: data ? (data.notification_settings ?? []) : null,
        });
      }
      case 'toggle_save': {
        if (body.currently_saved) {
          const { error } = await supabase
            .from('saved_content')
            .delete()
            .eq('user_id', body.user_id)
            .eq('content_id', body.content_id);
          if (error) return jsonError(error.message);
        } else {
          const { error } = await supabase
            .from('saved_content')
            .insert({
              user_id: body.user_id,
              content_id: body.content_id,
              mosque_id: body.mosque_id,
            });
          if (error) return jsonError(error.message);
        }
        await supabase.from('user_content_interactions').insert({
          user_id: body.user_id,
          content_id: body.content_id,
          mosque_id: body.mosque_id,
          interaction_type: body.currently_saved ? 'unsave' : 'save',
        });
        return jsonOk({ is_saved: !body.currently_saved });
      }
      case 'toggle_notif': {
        if (body.currently_opted_in) {
          const { error } = await supabase
            .from('content_notifications')
            .delete()
            .eq('user_id', body.user_id)
            .eq('content_id', body.content_id);
          if (error) return jsonError(error.message);
        } else {
          const { error } = await supabase
            .from('content_notifications')
            .insert({
              user_id: body.user_id,
              content_id: body.content_id,
              mosque_id: body.mosque_id,
            });
          if (error) return jsonError(error.message);
        }
        await supabase.from('user_content_interactions').insert({
          user_id: body.user_id,
          content_id: body.content_id,
          mosque_id: body.mosque_id,
          interaction_type: body.currently_opted_in
            ? 'notification_opt_off'
            : 'notification_opt_in',
        });
        return jsonOk({ is_opted_in: !body.currently_opted_in });
      }
      case 'set_timings': {
        if (body.offsets.length === 0) {
          const { error } = await supabase
            .from('content_notification_settings')
            .delete()
            .eq('user_id', body.user_id)
            .eq('content_id', body.content_id);
          if (error) return jsonError(error.message);
          return jsonOk({ settings: null });
        }
        const { error } = await supabase
          .from('content_notification_settings')
          .upsert(
            {
              user_id: body.user_id,
              content_id: body.content_id,
              mosque_id: body.mosque_id,
              notification_settings: body.offsets,
            },
            { onConflict: 'user_id,content_id' },
          );
        if (error) return jsonError(error.message);
        return jsonOk({ settings: body.offsets });
      }
      default:
        return jsonError('Unknown action', 400);
    }
  } catch (err) {
    const m = err instanceof Error ? err.message : 'Unknown error';
    return jsonError(m);
  }
});

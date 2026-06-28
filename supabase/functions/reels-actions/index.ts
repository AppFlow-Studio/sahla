/**
 * reels-actions — user-facing edge function  [SCAFFOLD]
 * --------------------------------------------------------------------------
 * Service-role bypass for the reels Save feature. Mirrors `ct02-actions`.
 *
 * The `reels` / `saved_reels` RLS policies gate on requesting_user_id() /
 * requesting_mosque_id(), which resolve to NULL under the unverified Clerk →
 * Supabase JWT bridge — so direct .from() calls from the app come back empty.
 * Everything routes through here (service role) until that bridge is fixed.
 *
 * Actions:
 *   list_reels         → published reels for a mosque (unscored — admin/debug)
 *   list_reels_scored  → published reels ranked by the user's interest weights
 *                        (the Watch feed calls this once a user is signed in)
 *   is_reel_saved      → has this user saved this reel?
 *   toggle_reel_save   → insert / delete a saved_reels row
 *   list_saved_reels   → the user's saved reels (Saved Clips screen)
 *   is_reel_liked      → has this user liked this reel?
 *   toggle_reel_like   → insert / delete a liked_reels row; also bumps the
 *                        user's interest_level for each tag the reel carries
 *   dismiss_reel       → "Not interested": record a dismissed_reels row (so the
 *                        reel never resurfaces) and decrement the user's
 *                        interest_level for each of the reel's tags
 *   report_reel        → record a reel_reports row (objectionable content) and
 *                        hide the reel from the reporter (writes dismissed_reels)
 *   block_source       → block a masjid's reels: record a blocked_reel_sources
 *                        row; the feed filters every reel from that mosque_id
 *
 * ⚠️  SECURITY — staging/demo only. `user_id` comes from the request body, not
 * a verified JWT — it's spoofable. Acceptable for the demo; do not promote to
 * main. Retire when the Clerk JWT bridge is fixed.
 *
 * Deploy:
 *   supabase functions deploy reels-actions --no-verify-jwt \
 *     --project-ref rpepxdgdiqeirdqsazuc
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// ─── Boilerplate (done — you shouldn't need to touch this) ──────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

/** Expected request body — one shape per action. */
type Body =
  | { action: 'list_reels'; mosque_id: string }
  | { action: 'list_reels_scored'; user_id: string; mosque_id: string }
  | { action: 'is_reel_saved'; user_id: string; reel_id: string }
  | {
      action: 'toggle_reel_save';
      user_id: string;
      mosque_id: string;
      reel_id: string;
      currently_saved: boolean;
    }
  | { action: 'list_saved_reels'; user_id: string }
  | { action: 'is_reel_liked'; user_id: string; reel_id: string }
  | {
      action: 'toggle_reel_like';
      user_id: string;
      mosque_id: string;
      reel_id: string;
      currently_liked: boolean;
    }
  | {
      action: 'dismiss_reel';
      user_id: string;
      mosque_id: string;
      reel_id: string;
    }
  | {
      action: 'report_reel';
      user_id: string;
      mosque_id: string;
      reel_id: string;
      reason: string;
      details?: string;
    }
  | {
      action: 'block_source';
      user_id: string;
      mosque_id: string;
    };

// ─── Handler ────────────────────────────────────────────────────────────────

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
      case 'list_reels': {
        const {data: mosque, error:mosqueError} = await supabase.from("mosques").select("reels_scope").eq("id",body.mosque_id).maybeSingle();
        if (mosqueError){
          return jsonError(mosqueError.message, 500);
        }
        const scope = mosque?.reels_scope ?? 'own';
        let query = supabase.from("reels").select("*").eq("is_published",true).order("display_order",{ascending:true});
        if (scope === "own"){
          query = query.eq("mosque_id", body.mosque_id);
        }
        const {data,error} = await query;
        if (error){
          return jsonError(error.message, 500);
        }
        return jsonOk({ reels: data ?? []});
    }
  

      case 'list_reels_scored': {
        // Personalized feed. Three small fetches → in-memory score.
        // 1. published reels (this masjid only, or every masjid — see scope)
        // 2. each reel's interest tags
        // 3. this user's interest weights
        // Score(reel) = Σ user.interest_level for each matching tag.
        // Untagged reels and users with no interests both fall through to
        // display_order, which means the feed degrades gracefully into the
        // unscored behavior.
        //
        // Scope-aware: 'own' filters to this masjid, 'global' pulls every
        // masjid's published reels into the same pool. Scoring + dismissed
        // are already user-scoped so they work either way.
        const { data: mosque, error: mosqueError } = await supabase
          .from('mosques').select('reels_scope').eq('id', body.mosque_id).maybeSingle();
        if (mosqueError) return jsonError(mosqueError.message, 500);
        const scope = mosque?.reels_scope ?? 'own';

        let reelsQuery = supabase.from('reels').select('*').eq('is_published', true);
        if (scope === 'own') reelsQuery = reelsQuery.eq('mosque_id', body.mosque_id);

        const [reelsRes, tagsRes, prefsRes, dismissedRes, blockedRes] = await Promise.all([
          reelsQuery,
          supabase.from('reel_islamic_interests').select('reel_id, interest_id'),
          supabase.from('user_islamic_interests').select('interest_id, interest_level').eq('user_id', body.user_id).eq('mosque_id', body.mosque_id),
          supabase.from('dismissed_reels').select('reel_id').eq('user_id', body.user_id),
          supabase.from('blocked_reel_sources').select('mosque_id').eq('user_id', body.user_id),
        ]);
        if (reelsRes.error) return jsonError(reelsRes.error.message, 500);
        if (tagsRes.error)  return jsonError(tagsRes.error.message, 500);
        if (prefsRes.error) return jsonError(prefsRes.error.message, 500);
        if (dismissedRes.error) return jsonError(dismissedRes.error.message, 500);
        if (blockedRes.error) return jsonError(blockedRes.error.message, 500);

        const weight = new Map<number, number>();
        for (const row of prefsRes.data ?? []) {
          weight.set(row.interest_id as number, row.interest_level as number);
        }

        const tagsByReel = new Map<string, number[]>();
        for (const row of tagsRes.data ?? []) {
          const list = tagsByReel.get(row.reel_id as string) ?? [];
          list.push(row.interest_id as number);
          tagsByReel.set(row.reel_id as string, list);
        }

        // Reels this user said "Not interested" to — drop them from the feed.
        const dismissed = new Set<string>(
          (dismissedRes.data ?? []).map((row) => row.reel_id as string),
        );

        // Masjids this user has blocked — drop every reel they authored.
        const blockedMosques = new Set<string>(
          (blockedRes.data ?? []).map((row) => row.mosque_id as string),
        );

        const reels = (reelsRes.data ?? [])
          .filter((r) => !dismissed.has(r.reel_id as string))
          .filter((r) => !blockedMosques.has(r.mosque_id as string))
          .map((r) => {
          const tags = tagsByReel.get(r.reel_id as string) ?? [];
          const score = tags.reduce((sum, tagId) => sum + (weight.get(tagId) ?? 0), 0);
          return { ...r, _score: score };
        });

        // Sort: high score first; tie-break on display_order asc, then newer first.
        reels.sort((a, b) => {
          if (b._score !== a._score) return b._score - a._score;
          const ao = a.display_order ?? Number.MAX_SAFE_INTEGER;
          const bo = b.display_order ?? Number.MAX_SAFE_INTEGER;
          if (ao !== bo) return ao - bo;
          return (b.created_at ?? '').localeCompare(a.created_at ?? '');
        });

        return jsonOk({ reels });
      }

      case 'is_reel_saved': {
        // ── TODO — does this user have this reel saved? ────────────────────
        const {data,error} = await supabase.from("saved_reels").select("*").eq("user_id", body.user_id).eq("reel_id", body.reel_id).maybeSingle();
        if (error) { 
          return jsonError(error.message, 500);
        }
        return jsonOk({ is_saved: !!data});
      }

      case 'toggle_reel_save': {
        if (body.currently_saved) {
          const {error} = await supabase.from("saved_reels").delete().eq("user_id", body.user_id).eq("reel_id", body.reel_id);
          if (error){
            return jsonError(error.message, 500);
          }
        }
        else{
          const {error} = await supabase.from("saved_reels").upsert({user_id: body.user_id, reel_id: body.reel_id, mosque_id: body.mosque_id});
          if (error) {
            return jsonError(error.message, 500);
          }
          
        }
         return jsonOk({ is_saved: !body.currently_saved });
      }

      case 'list_saved_reels': {
        const {data,error} = await supabase.from("saved_reels").select("created_at, reels(*)").eq("user_id",body.user_id).order("created_at", {ascending: false});
        if (error) {
          return jsonError(error.message, 500);
        }
        // Flatten `saved_reels.created_at` onto the reel as `saved_at` — the UI
        // buckets the list by when the user saved it (Today / Week / Month).
        return jsonOk({
          reels: (data ?? []).map((row) => ({ ...row.reels, saved_at: row.created_at })),
        });
      }

      case 'is_reel_liked': {
        const {data,error} = await supabase.from('liked_reels').select('*').eq('user_id',body.user_id).eq('reel_id',body.reel_id).maybeSingle();
        if (error){
          return jsonError(error.message, 500);
        }
        return jsonOk({ is_liked: !!data });
      }

      case 'toggle_reel_like': {
        if (body.currently_liked){
          const {error} = await supabase.from('liked_reels').delete().eq("user_id",body.user_id).eq("reel_id",body.reel_id);
          if (error) {
            return jsonError(error.message,500);
          }
        }
        else{
          const {error} = await supabase.from('liked_reels').upsert({user_id: body.user_id, reel_id:body.reel_id,mosque_id:body.mosque_id});
          if (error){
            return jsonError(error.message,500);
          }
        }

        // Bump the user's interest_level for each tag this reel carries:
        //   like   → +1 per tag (capped at 10)
        //   unlike → -1 per tag (floored at 0)
        // The cap/floor keeps the signal bounded so a runaway user can't
        // saturate the score. Onboarding seeds 1-5; engagement can push to 10.
        //
        // NOTE: this is a read-then-write per tag. Two concurrent likes from
        // the same user on different reels with overlapping tags could race
        // and lose one increment. Acceptable for staging — production should
        // move this to an atomic UPSERT via a Postgres RPC.
        const { data: tags } = await supabase
          .from('reel_islamic_interests')
          .select('interest_id')
          .eq('reel_id', body.reel_id);

        const delta = body.currently_liked ? -1 : 1;
        const MIN = 0;
        const MAX = 10;

        for (const { interest_id } of tags ?? []) {
          const { data: existing } = await supabase
            .from('user_islamic_interests')
            .select('interest_level')
            .eq('user_id', body.user_id)
            .eq('mosque_id', body.mosque_id)
            .eq('interest_id', interest_id)
            .maybeSingle();

          if (existing) {
            const next = Math.max(MIN, Math.min(MAX, (existing.interest_level ?? 0) + delta));
            await supabase
              .from('user_islamic_interests')
              .update({ interest_level: next })
              .eq('user_id', body.user_id)
              .eq('mosque_id', body.mosque_id)
              .eq('interest_id', interest_id);
          } else if (delta > 0) {
            // No row yet + user is liking → seed at 1. (On unlike of an unseen
            // tag we do nothing — can't decrement what doesn't exist.)
            await supabase
              .from('user_islamic_interests')
              .insert({
                user_id: body.user_id,
                mosque_id: body.mosque_id,
                interest_id,
                interest_level: 1,
              });
          }
        }

        return jsonOk({ is_liked: !body.currently_liked });
      }

      case 'dismiss_reel': {
         const {error} = await supabase.from('dismissed_reels').upsert({user_id: body.user_id, mosque_id: body.mosque_id, reel_id: body.reel_id},{onConflict: 'user_id,reel_id', ignoreDuplicates: true});
         if (error) {
          return jsonError(error.message,500);
         }
         const {data : tags, error : tagsError} = await supabase.from("reel_islamic_interests").select("interest_id").eq("reel_id",body.reel_id);
         if (tagsError){
          return jsonError(tagsError.message,500);
         }
         // "Not interested" is a stronger negative than a like's +1 — drop by 2,
         // floored at 0. No seeding: if the user has no row for a tag there's
         // nothing to pull down. (Racy read-then-write like the like path —
         // fine for staging, should become an atomic RPC for production.)
         const delta = -2;
         const MIN = 0;
         for (const {interest_id} of tags ?? []){
          const {data : existing} = await supabase.from("user_islamic_interests").select("interest_level").eq('user_id',body.user_id).eq("mosque_id",body.mosque_id).eq("interest_id",interest_id).maybeSingle();
          if (existing) {
            const next = Math.max(MIN, (existing.interest_level ?? 0) + delta);
            await supabase.from("user_islamic_interests").update({interest_level: next}).eq("user_id",body.user_id).eq('mosque_id', body.mosque_id).eq('interest_id', interest_id);
          }
         }
         
      
        return jsonOk({ dismissed: true });
      }

      case 'report_reel': {
        // Durable report record (one per user+reel; re-reporting updates it).
        const { error: reportError } = await supabase.from('reel_reports').upsert(
          {
            user_id: body.user_id,
            mosque_id: body.mosque_id,
            reel_id: body.reel_id,
            reason: body.reason,
            details: body.details ?? null,
            status: 'pending',
          },
          { onConflict: 'user_id,reel_id' },
        );
        if (reportError) return jsonError(reportError.message, 500);

        // Hide the reported reel from the reporter straight away — same row a
        // "Not interested" writes, so it never resurfaces in their feed.
        const { error: hideError } = await supabase.from('dismissed_reels').upsert(
          { user_id: body.user_id, mosque_id: body.mosque_id, reel_id: body.reel_id },
          { onConflict: 'user_id,reel_id', ignoreDuplicates: true },
        );
        if (hideError) return jsonError(hideError.message, 500);

        return jsonOk({ reported: true });
      }

      case 'block_source': {
        const { error } = await supabase.from('blocked_reel_sources').upsert(
          { user_id: body.user_id, mosque_id: body.mosque_id },
          { onConflict: 'user_id,mosque_id', ignoreDuplicates: true },
        );
        if (error) return jsonError(error.message, 500);
        return jsonOk({ blocked: true });
      }

      default:
        return jsonError('Unknown action', 400);
    }
  } catch (err) {
    const m = err instanceof Error ? err.message : 'Unknown error';
    return jsonError(m);
  }
});

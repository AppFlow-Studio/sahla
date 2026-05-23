/**
 * reels-upload — admin edge function  [SCAFFOLD]
 * --------------------------------------------------------------------------
 * Creates a reel in two steps:
 *   1. uploads the video file to Bunny Edge Storage (via _shared/bunny-storage)
 *   2. inserts the matching row into the `reels` table
 *
 * This is the ADMIN side of reels — masjid staff / the Sahla team publish
 * content; end users only watch + save.
 *
 * Request:  POST  multipart/form-data
 *   file          (required) the video file
 *   mosque_id     (required) owning mosque — FK to mosques.id
 *   title         (optional)
 *   caption       (optional)
 *   interest_ids  (optional) comma-separated islamic_interest_categories ids,
 *                            e.g. "6,28,50" → tag the reel with Hadith,
 *                            Character Building, Seeking Knowledge
 *
 * Response: 201 { reel: <inserted reels row>, tags: number[] }
 *
 * ⚠️  SECURITY — staging/demo only.
 * Deploy with `--no-verify-jwt` to match this project's other functions. It
 * does NOT check that the caller is an admin — before production it MUST
 * verify the caller's identity and admin role for `mosque_id`.
 *
 * Deploy:
 *   supabase functions deploy reels-upload --no-verify-jwt \
 *     --project-ref rpepxdgdiqeirdqsazuc
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

import {
  assertConfigured,
  deleteFile,
  uploadFile,
} from '../_shared/bunny-storage.ts';

// ─── Boilerplate (done — you shouldn't need to touch this) ──────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonOk(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
function jsonError(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

/**
 * Map a file extension to a video MIME type. Used to recover a real type when
 * the upload client sends a missing or generic `application/octet-stream`
 * content-type (curl's `-F`, for example, does this for `.mp4`).
 */
const VIDEO_TYPES: Record<string, string> = {
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  m4v: 'video/x-m4v',
  webm: 'video/webm',
};

// ─── Handler ────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') return jsonError('Method not allowed', 405);

  try {
    // ── TODO 1 — Guard the config ──────────────────────────────────────────
    // Call assertConfigured() so the function fails fast with a clear error
    // if the BUNNY_* secrets aren't set on this project.
    assertConfigured();
    // ── TODO 2 — Parse the multipart/form-data request ─────────────────────
    //  • const form = await req.formData();
    //  • pull out: file, mosque_id, title, caption  (form.get('...'))
    //  • validate:
    //      - `file` must be a File  →  if (!(file instanceof File)) ...
    //      - `mosque_id` must be a non-empty string
    //    return jsonError(<message>, 400) when a required field is missing.
    const form = await req.formData();
    const file = form.get("file") as File;
    if (!(file instanceof File)) {
      return jsonError("File is required", 400);
    }
    const mosque_id = form.get("mosque_id") as string;
    if (typeof mosque_id !== 'string' || mosque_id.length === 0) {
      return jsonError("Mosque ID is required", 400);
    }
    const title = form.get("title") as string;
    const caption = form.get("caption") as string;

    // Parse interest_ids (optional). Accepts "6,28,50" → [6, 28, 50]. Empty
    // string or missing field → no tags. Non-numeric tokens → 400.
    const interestIdsRaw = form.get("interest_ids");
    let interestIds: number[] = [];
    if (typeof interestIdsRaw === "string" && interestIdsRaw.trim() !== "") {
      interestIds = interestIdsRaw.split(",").map((s) => s.trim()).map(Number);
      if (interestIds.some((n) => !Number.isInteger(n) || n <= 0)) {
        return jsonError("interest_ids must be comma-separated positive integers", 400);
      }
    }


    // ── TODO 3 — Build a unique storage path ───────────────────────────────
    // Filenames collide, so don't upload to the bare name. Build something
    // like:  `reels/${crypto.randomUUID()}-${safeName}`
    // where safeName is file.name with spaces/odd characters stripped.
    const uuid = self.crypto.randomUUID();
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-]/g, '');
    // Per-masjid folder so each mosque's content is grouped + easy to audit/clean.
    const storagePath = `reels/${mosque_id}/${uuid}-${safeName}`;
    // ── TODO 4 — Upload the video to Bunny ─────────────────────────────────
    // Don't blindly trust file.type — some clients (curl's -F) send a generic
    // `application/octet-stream`. Treat that (and an empty type) as unknown,
    // and recover a real video type from the file extension.
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const contentType =
      file.type && file.type !== 'application/octet-stream'
        ? file.type
        : VIDEO_TYPES[ext] ?? 'video/mp4';
    const CDN_URL = await uploadFile(storagePath, file.stream(), contentType);
    // ── TODO 5 — Insert the reels row ──────────────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const {data, error} = await supabase.from("reels").insert({
      mosque_id,
      title,
      caption,
      video_url: CDN_URL,
      is_published: true,
    }).select().single();
    if (error) {
      await deleteFile(storagePath).catch(() => {});
      return jsonError(error.message, 500);
    }

    // Tag the reel. If this fails, roll back the reel row + CDN file so we
    // don't leave a half-tagged reel — easier to retry the whole upload.
    if (interestIds.length > 0) {
      const tagRows = interestIds.map((interest_id) => ({
        reel_id: data.reel_id,
        interest_id,
      }));
      const { error: tagError } = await supabase
        .from("reel_islamic_interests")
        .insert(tagRows);
      if (tagError) {
        await supabase.from("reels").delete().eq("reel_id", data.reel_id);
        await deleteFile(storagePath).catch(() => {});
        return jsonError(`tag insert failed: ${tagError.message}`, 500);
      }
    }

    return jsonOk({ reel: data, tags: interestIds }, 201);
  } catch (err) {
    const m = err instanceof Error ? err.message : 'Unknown error';
    return jsonError(m);
  }
});

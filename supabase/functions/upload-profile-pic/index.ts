/**
 * upload-profile-pic — uploads an avatar to Bunny Edge Storage and writes the
 * resulting CDN URL onto `profiles.profile_pic`.  [SCAFFOLD]
 * --------------------------------------------------------------------------
 * Replaces the Supabase Storage `profile-pics` bucket flow. Avatars are read
 * on nearly every screen, so we want them on the Bunny pull zone (cheap egress
 * + edge-cached) like reels and ad flyers already are.
 *
 * Request:  POST  multipart/form-data
 *   file        (required) the avatar image (png/jpeg/webp)
 *
 * Response: 200 { url: <public CDN url> }
 *
 * ⚠️  AUTH NOTE.
 * Unlike the other Bunny upload functions, this one DOES need to know who is
 * calling — otherwise anyone with the anon key could overwrite anyone else's
 * avatar (`{some_other_user_id}/avatar.jpg`). The TODOs below extract the
 * Clerk JWT from the Authorization header and use its `sub` claim as the
 * folder name.
 *
 * Deploy:
 *   supabase functions deploy upload-profile-pic --no-verify-jwt \
 *     --project-ref rpepxdgdiqeirdqsazuc
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

import { assertConfigured, uploadFile } from '../_shared/bunny-storage.ts';

// ─── Boilerplate ────────────────────────────────────────────────────────────

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

const IMAGE_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

// ─── Handler ────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') return jsonError('Method not allowed', 405);

  try {
    assertConfigured();

    // TODO: verify against Clerk JWKS before prod — right now we only decode
    // the payload, which means anyone with the anon key could forge a token
    // and overwrite any user's avatar.
    const authHeader = req.headers.get('Authorization');
    console.log('[upload-profile-pic] auth header present:', !!authHeader);
    if (!authHeader) return jsonError('Unauthorized', 401);
    const token = authHeader.split(' ')[1];
    console.log('[upload-profile-pic] token len:', token?.length ?? 0);
    if (!token) return jsonError('Unauthorized', 401);
    // atob is strict — JWT payload segments aren't always a multiple of 4
    // base64 chars, so pad before decoding or some tokens throw.
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - b64.length % 4) % 4);
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(atob(padded));
    } catch (e) {
      console.log('[upload-profile-pic] jwt decode failed:', (e as Error).message);
      return jsonError('Unauthorized', 401);
    }
    const userId = payload?.sub as string | undefined;
    console.log('[upload-profile-pic] decoded sub:', userId, 'iss:', payload?.iss);
    if (!userId) return jsonError('Unauthorized', 401);

    const form = await req.formData();
    const file = form.get('file');
    console.log(
      '[upload-profile-pic] file:',
      file instanceof File
        ? { name: file.name, size: file.size, type: file.type }
        : `<not a File: ${typeof file}>`,
    );
    if (!(file instanceof File)) return jsonError('File is required', 400);
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    if (!IMAGE_TYPES[ext]) {
      console.log('[upload-profile-pic] rejected ext:', ext);
      return jsonError('Avatar must be a PNG, JPG, or WebP image', 400);
    }
    const contentType =
      file.type && file.type !== 'application/octet-stream'
        ? file.type
        : IMAGE_TYPES[ext];

    const storagePath = `profile-pics/${userId}/avatar.${ext}`;
    console.log('[upload-profile-pic] uploading to Bunny:', storagePath, 'as', contentType);
    const cdnUrl = await uploadFile(storagePath, file.stream(), contentType);
    console.log('[upload-profile-pic] Bunny upload ok:', cdnUrl);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const cacheBusted = `${cdnUrl}?t=${Date.now()}`;
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, profile_pic: cacheBusted }, { onConflict: 'id' });
    if (error) {
      console.log('[upload-profile-pic] profiles upsert failed:', error.message);
      return jsonError(error.message, 500);
    }
    console.log('[upload-profile-pic] done');
    return jsonOk({ url: cacheBusted }, 200);
  } catch (err) {
    const m = err instanceof Error ? err.message : 'Unknown error';
    console.log('[upload-profile-pic] caught:', m, err instanceof Error ? err.stack : '');
    return jsonError(m);
  }
});

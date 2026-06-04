/**
 * business-ad-flyer-upload — uploads a business-ad flyer image to Bunny Edge
 * Storage and returns its public CDN URL. The mobile app can't upload to Bunny
 * directly (that needs the secret storage AccessKey), so it posts the file here.
 *
 * The returned URL is later persisted on the submission by
 * `create-ad-subscription` (business_flyer_img); this function does no DB work.
 *
 * Request:  POST  multipart/form-data
 *   file        (required) the flyer image (png/jpeg/webp)
 *   mosque_id   (required) owning mosque — used only to group files in storage
 *
 * Response: 200 { url: <public CDN url> }
 *
 * verify_jwt = false (see config.toml): the app calls it with the anon key,
 * matching the other reels/payment functions.
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

import { assertConfigured, uploadFile } from '../_shared/bunny-storage.ts';

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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') return jsonError('Method not allowed', 405);

  try {
    assertConfigured();

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return jsonError('File is required', 400);
    }
    const mosque_id = form.get('mosque_id');
    if (typeof mosque_id !== 'string' || mosque_id.length === 0) {
      return jsonError('mosque_id is required', 400);
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    if (!IMAGE_TYPES[ext]) {
      return jsonError('Flyer must be a PNG, JPG, or WebP image', 400);
    }
    // Don't blindly trust file.type — RN/curl may send octet-stream.
    const contentType =
      file.type && file.type !== 'application/octet-stream'
        ? file.type
        : IMAGE_TYPES[ext];

    const uuid = self.crypto.randomUUID();
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-]/g, '');
    const storagePath = `business-ads/${mosque_id}/${uuid}-${safeName}`;

    const cdnUrl = await uploadFile(storagePath, file.stream(), contentType);

    return jsonOk({ url: cdnUrl }, 200);
  } catch (err) {
    const m = err instanceof Error ? err.message : 'Unknown error';
    return jsonError(m);
  }
});

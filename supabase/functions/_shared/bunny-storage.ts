import * as BunnyStorageSDK from 'https://esm.sh/@bunny.net/storage-sdk@0.3.1';
/**
 * Bunny.net Edge Storage helper
 * --------------------------------
 * Thin wrapper around the Bunny Edge Storage HTTP API so Supabase edge
 * functions can upload / list / delete reel video files in the `sahla-co`
 * storage zone. Files are then served publicly through the `sahla.b-cdn.net`
 * pull zone.
 *
 * ⚠️  SERVER-SIDE ONLY.
 * This module uses the storage-zone AccessKey (password), which is a SECRET.
 * Never import it into the mobile app and never expose the key through an
 * EXPO_PUBLIC_* variable. It belongs in Supabase edge functions only.
 *
 * Docs to read while implementing the TODOs below:
 *   Edge Storage API → https://docs.bunny.net/reference/storage-api
 *
 * Required edge-function secrets (set with `supabase secrets set ...`):
 *   BUNNY_STORAGE_ZONE    storage zone name                e.g. "sahla-co"
 *   BUNNY_STORAGE_KEY     storage zone password/AccessKey  (SECRET)
 *   BUNNY_STORAGE_REGION  region code; "" = default DE zone  e.g. "ny"
 *   BUNNY_PULL_ZONE_HOST  public CDN hostname              e.g. "sahla.b-cdn.net"
 */

const ZONE = Deno.env.get('BUNNY_STORAGE_ZONE') ?? '';
const KEY = Deno.env.get('BUNNY_STORAGE_KEY') ?? '';
const PULL_ZONE_HOST = Deno.env.get('BUNNY_PULL_ZONE_HOST') ?? '';




/** Strip leading slashes so path segments join cleanly. */
function clean(path: string): string {
  return path.replace(/^\/+/, '');
}



/**
 * Public, playable URL for a stored file — this is what goes into
 * `reels.video_url`. Served by the pull zone; no AccessKey needed.
 */
export function publicUrl(path: string): string {
  return `https://${PULL_ZONE_HOST}/${clean(path)}`;
}




/** Throws if required config is missing — call this at the top of a handler. */
export function assertConfigured(): void {
  const missing = [
    ['BUNNY_STORAGE_ZONE', ZONE],
    ['BUNNY_STORAGE_KEY', KEY],
    ['BUNNY_PULL_ZONE_HOST', PULL_ZONE_HOST],
  ]
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length) {
    throw new Error(
      `Bunny storage not configured — missing env: ${missing.join(', ')}`,
    );
  }
}


const storageZone = BunnyStorageSDK.zone.connect_with_accesskey(
  BunnyStorageSDK.regions.StorageRegion.Falkenstein,
  ZONE,
  KEY,
);


/** Upload (create or overwrite) a file; returns its public CDN URL. */
export async function uploadFile(
  path: string,
  stream: ReadableStream<Uint8Array>,
  contentType: string,
): Promise<string> {
  await BunnyStorageSDK.file.upload(storageZone, path, stream, { contentType });
  return publicUrl(path);
}

/** List the objects inside a folder of the storage zone (root = ''). */
export async function listFiles(path = '') {
  return await BunnyStorageSDK.file.list(storageZone, path);
}

/** Delete a file from the storage zone. */
export async function deleteFile(path: string): Promise<void> {
  await BunnyStorageSDK.file.remove(storageZone, path);
}



import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { useEffect, useReducer } from 'react';

import { getMushafPageSvgAsset } from '@/src/db/mushafSvgRegistry';

/**
 * Reads a bundled mushaf-page SVG and returns its XML string for rendering
 * via `react-native-svg`'s <SvgXml />. Caches the most recent N pages in
 * memory so common back/forward swipes don't re-read the filesystem.
 *
 * Returns `null` while loading; consumer renders a spinner in that state.
 */

const xmlCache = new Map<number, string>();
const LRU_LIMIT = 12;
const inflight = new Map<number, Promise<void>>();

// SVG groups whose contents we strip before render. The mushaf SVGs embed
// surah/juz/page-number headers that sit at viewBox x≈73 (left) and x≈315
// (right) — outside the visible window once we center on the body bbox —
// so they render as clipped-letter strips at the screen edges. The app
// already shows page number + surah + back arrow in its own chrome, so
// the SVG headers are redundant; stripping them eliminates the edge
// fragments without touching the body content.
const HEADER_GROUP_IDS = [
  'md-non-quranic-header-juz-name',
  'md-non-quranic-header-surah-name',
  'md-non-quranic-page-number',
];

function stripHeaderGroups(xml: string): string {
  let out = xml;
  for (const id of HEADER_GROUP_IDS) {
    const re = new RegExp(`<g\\s+id="${id}"[^>]*>[\\s\\S]*?<\\/g>`, 'g');
    out = out.replace(re, '');
  }
  return out;
}

function touchCacheWrite(pageNumber: number, value: string) {
  if (xmlCache.has(pageNumber)) xmlCache.delete(pageNumber);
  xmlCache.set(pageNumber, value);
  if (xmlCache.size > LRU_LIMIT) {
    const oldest = xmlCache.keys().next().value;
    if (typeof oldest === 'number') xmlCache.delete(oldest);
  }
}

export function useMushafPageSvg(pageNumber: number): string | null {
  // Derive directly from the cache on every render so the returned XML always
  // matches the current pageNumber. Buffering it in useState would carry the
  // previous page's XML across the first render of a new pageNumber, which
  // — combined with per-page centering — causes a one-frame flash where the
  // previous page's content is rendered with the new page's centering offset.
  const cached = xmlCache.get(pageNumber) ?? null;
  const [, forceUpdate] = useReducer((c: number) => c + 1, 0);

  useEffect(() => {
    if (xmlCache.has(pageNumber)) return;
    const assetModule = getMushafPageSvgAsset(pageNumber);
    if (!assetModule) return;

    // De-dupe concurrent loads of the same page when multiple instances mount.
    let cancelled = false;
    const existing = inflight.get(pageNumber);
    const load =
      existing ??
      (async () => {
        try {
          const asset = await Asset.fromModule(assetModule).downloadAsync();
          const uri = asset.localUri ?? asset.uri;
          if (!uri) return;
          const text = await FileSystem.readAsStringAsync(uri);
          touchCacheWrite(pageNumber, stripHeaderGroups(text));
        } finally {
          inflight.delete(pageNumber);
        }
      })();
    if (!existing) inflight.set(pageNumber, load);

    load.then(() => {
      if (!cancelled) forceUpdate();
    });

    return () => {
      cancelled = true;
    };
  }, [pageNumber]);

  return cached;
}

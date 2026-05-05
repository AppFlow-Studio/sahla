import { create } from 'zustand';

import { mergeConfig, resolveBundledConfig } from '@/src/config/resolver';
import type { MasjidConfig, RemoteMasjidOverrides } from '@/src/config/types';
import { kv } from '@/src/lib/mmkv';

const MMKV_KEY = 'masjid-config.v2';

type PersistedShape = {
  config: MasjidConfig;
  lastSyncedAt: number | null;
};

type ConfigState = {
  config: MasjidConfig;
  lastSyncedAt: number | null;
  /** Resolved UUID from the `mosques` table (not the slug). */
  mosqueUuid: string | null;
  /** Replace the current config with a freshly-merged one and persist it. */
  applyRemoteOverrides: (overrides: RemoteMasjidOverrides) => void;
  /** Store the resolved mosque UUID from the `mosques.id` column. */
  setMosqueUuid: (id: string) => void;
  /** Wipe the cache and fall back to the bundled default. */
  reset: () => void;
};

/**
 * Boot-time hydration: prefer the MMKV cache if one exists AND its `id`
 * matches the current build's bundled `id`. A mismatch means the user
 * reinstalled over a different variant (or we changed the build-time
 * MASJID_ID), and we should discard the old cache.
 */
function hydrate(): PersistedShape {
  const bundled = resolveBundledConfig();
  const cached = kv.getJSON<PersistedShape>(MMKV_KEY);
  if (cached && cached.config.id === bundled.id) {
    // Merge bundled over cached so a new field added to the bundled default
    // (e.g. a new feature flag) becomes visible even without a re-sync.
    return {
      config: {
        ...bundled,
        ...cached.config,
        colors: { ...bundled.colors, ...cached.config.colors },
        features: { ...bundled.features, ...cached.config.features },
      },
      lastSyncedAt: cached.lastSyncedAt,
    };
  }
  return { config: bundled, lastSyncedAt: null };
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  ...hydrate(),
  mosqueUuid: null,
  applyRemoteOverrides: (overrides) => {
    const merged = mergeConfig(get().config, overrides);
    const next: PersistedShape = { config: merged, lastSyncedAt: Date.now() };
    kv.setJSON(MMKV_KEY, next);
    set(next);
  },
  setMosqueUuid: (id) => set({ mosqueUuid: id }),
  reset: () => {
    kv.delete(MMKV_KEY);
    set({ config: resolveBundledConfig(), lastSyncedAt: null, mosqueUuid: null });
  },
}));

/** Non-React access (e.g. from a plain function). */
export const getMasjidConfig = (): MasjidConfig => useConfigStore.getState().config;

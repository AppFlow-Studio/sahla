import { create } from 'zustand';

import { kv } from '@/src/lib/mmkv';

/**
 * Whether the first-run coach-mark walkthrough has been seen. Persisted in MMKV
 * so it survives relaunches (local minimum required by CT-ONBOARD-01). Mirroring
 * the `onboarding-store` pattern: a tiny zustand store reading/writing a single
 * JSON blob so the flag is reactive across screens (the Profile "Replay" row can
 * flip it back to unseen and the mounted walkthrough re-shows immediately).
 *
 * A future enhancement can additionally mirror this into `user_preferences` so
 * it survives a reinstall — the local flag is the source of truth for showing.
 */
const MMKV_KEY = 'tutorial.v1';

type PersistedShape = {
  seen: boolean;
};

type TutorialState = {
  seen: boolean;
  /** Mark the walkthrough as completed/skipped so it never auto-shows again. */
  markSeen: () => void;
  /** Re-arm the walkthrough (Profile → "Replay tutorial"); flips `seen` to false. */
  replay: () => void;
};

function hydrate(): PersistedShape {
  const cached = kv.getJSON<PersistedShape>(MMKV_KEY);
  return cached ?? { seen: false };
}

function persist(shape: PersistedShape) {
  kv.setJSON(MMKV_KEY, shape);
}

export const useTutorialStore = create<TutorialState>((set) => ({
  ...hydrate(),
  markSeen: () => {
    persist({ seen: true });
    set({ seen: true });
  },
  replay: () => {
    persist({ seen: false });
    set({ seen: false });
  },
}));

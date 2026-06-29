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
  /** Whether the walkthrough should no longer auto-show (finished OR skipped). */
  seen: boolean;
  /**
   * Whether the user actually finished the whole tour (reached the final step's
   * "Done"). `seen && !completed` means they skipped — which drives the Profile
   * "finish your tour" nudge dot.
   */
  completed: boolean;
};

type TutorialState = PersistedShape & {
  /** Finished the whole tour — clears the nudge and stops auto-show. */
  complete: () => void;
  /** Dismissed before finishing — stops auto-show but leaves the nudge active. */
  skip: () => void;
  /** Re-arm the walkthrough (Profile → "Replay tutorial"); flips `seen` to false. */
  replay: () => void;
};

function hydrate(): PersistedShape {
  const cached = kv.getJSON<PersistedShape>(MMKV_KEY);
  return { seen: cached?.seen ?? false, completed: cached?.completed ?? false };
}

function persist(shape: PersistedShape) {
  kv.setJSON(MMKV_KEY, shape);
}

export const useTutorialStore = create<TutorialState>((set) => ({
  ...hydrate(),
  complete: () => {
    persist({ seen: true, completed: true });
    set({ seen: true, completed: true });
  },
  skip: () => {
    persist({ seen: true, completed: false });
    set({ seen: true, completed: false });
  },
  replay: () =>
    set((s) => {
      // Re-arm for another run but remember whether they'd previously finished,
      // so abandoning a replay doesn't resurrect the nudge for someone who had
      // already completed it.
      persist({ seen: false, completed: s.completed });
      return { seen: false };
    }),
}));

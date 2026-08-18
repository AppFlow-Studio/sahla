import { create } from 'zustand';

import { kv } from '@/src/lib/mmkv';

const MMKV_KEY = 'guest.v1';

type PersistedShape = { isGuest: boolean };

type GuestState = {
  /** True while browsing without an account. */
  isGuest: boolean;
  /** Enter guest mode from the welcome screen. */
  enterGuest: () => void;
  /** Leave guest mode — called when a real session starts, and on sign-out. */
  exitGuest: () => void;
};

function hydrate(): PersistedShape {
  return kv.getJSON<PersistedShape>(MMKV_KEY) ?? { isGuest: false };
}

/**
 * Guest browsing.
 *
 * Prayer times, programs, events, reels and the Quran all read either through
 * edge functions (service role) or through tables whose RLS select policy is
 * plainly `true`, so none of that needs a session — which is what makes signed
 * out browsing possible at all. Anything tied to a person (saving, liking,
 * notification preferences, the profile itself) does need one, and those call
 * sites gate on `isGuest` and offer to sign in.
 *
 * Persisted so a guest who closes the app comes back to the same place instead
 * of the welcome screen.
 */
export const useGuestStore = create<GuestState>((set) => ({
  ...hydrate(),
  enterGuest: () => {
    kv.setJSON<PersistedShape>(MMKV_KEY, { isGuest: true });
    set({ isGuest: true });
  },
  exitGuest: () => {
    kv.delete(MMKV_KEY);
    set({ isGuest: false });
  },
}));

/** Non-React access, for code that runs outside a component. */
export const isGuestMode = () => useGuestStore.getState().isGuest;

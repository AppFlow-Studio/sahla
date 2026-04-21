import { create } from 'zustand';

import { kv } from '@/src/lib/mmkv';

const MMKV_KEY = 'onboarding.v1';

type PersistedShape = {
  firstName: string;
  complete: boolean;
};

type OnboardingState = {
  firstName: string;
  complete: boolean;
  setFirstName: (value: string) => void;
  markComplete: () => void;
  reset: () => void;
};

function hydrate(): PersistedShape {
  const cached = kv.getJSON<PersistedShape>(MMKV_KEY);
  return cached ?? { firstName: '', complete: false };
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ...hydrate(),
  setFirstName: (value) => {
    const next: PersistedShape = { firstName: value, complete: get().complete };
    kv.setJSON(MMKV_KEY, next);
    set({ firstName: value });
  },
  markComplete: () => {
    const next: PersistedShape = { firstName: get().firstName, complete: true };
    kv.setJSON(MMKV_KEY, next);
    set({ complete: true });
  },
  reset: () => {
    kv.delete(MMKV_KEY);
    set({ firstName: '', complete: false });
  },
}));

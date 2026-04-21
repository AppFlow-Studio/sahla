import { create } from 'zustand';

import { kv } from '@/src/lib/mmkv';

const MMKV_KEY = 'onboarding.v1';

type PersistedShape = {
  firstName: string;
};

type OnboardingState = {
  firstName: string;
  setFirstName: (value: string) => void;
  reset: () => void;
};

function hydrate(): PersistedShape {
  const cached = kv.getJSON<PersistedShape>(MMKV_KEY);
  return cached ?? { firstName: '' };
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...hydrate(),
  setFirstName: (value) => {
    const next: PersistedShape = { firstName: value };
    kv.setJSON(MMKV_KEY, next);
    set(next);
  },
  reset: () => {
    kv.delete(MMKV_KEY);
    set({ firstName: '' });
  },
}));

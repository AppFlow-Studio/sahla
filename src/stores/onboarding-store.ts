import { create } from 'zustand';

import { kv } from '@/src/lib/mmkv';

const MMKV_KEY = 'onboarding.v1';

type PersistedShape = {
  firstName: string;
  complete: boolean;
  userId: string;
};

type OnboardingState = {
  firstName: string;
  complete: boolean;
  userId: string;
  setFirstName: (value: string) => void;
  markComplete: () => void;
  reset: () => void;
  /** Atomically replace all persisted fields for a new user (single set + MMKV write). */
  switchUser: (userId: string, data?: { firstName?: string; complete?: boolean }) => void;
};

function hydrate(): PersistedShape {
  const cached = kv.getJSON<PersistedShape>(MMKV_KEY);
  return cached ?? { firstName: '', complete: false, userId: '' };
}

function persist(shape: PersistedShape) {
  kv.setJSON(MMKV_KEY, shape);
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ...hydrate(),
  setFirstName: (value) => {
    const s = get();
    persist({ firstName: value, complete: s.complete, userId: s.userId });
    set({ firstName: value });
  },
  markComplete: () => {
    const s = get();
    persist({ firstName: s.firstName, complete: true, userId: s.userId });
    set({ complete: true });
  },
  reset: () => {
    kv.delete(MMKV_KEY);
    set({ firstName: '', complete: false, userId: '' });
  },
  switchUser: (userId, data) => {
    const next: PersistedShape = {
      userId,
      firstName: data?.firstName ?? '',
      complete: data?.complete ?? false,
    };
    persist(next);
    set(next);
  },
}));

import { create } from 'zustand';

import i18n from '@/src/i18n';
import {
  LANGUAGE_MMKV_KEY,
  resolveInitialLanguage,
  type LanguageCode,
} from '@/src/i18n/languages';
import { applyRTLDirection } from '@/src/i18n/rtl';
import { storage } from '@/src/lib/mmkv';

type LanguageState = {
  language: LanguageCode;
  /**
   * Persist + apply a new UI language. Updates i18next immediately so all text
   * re-renders, then aligns the native layout direction. Returns
   * `{ needsReload }` — when the text direction flips (LTR<->RTL) the caller
   * must reload the app (e.g. `expo-updates` `reloadAsync()`) for the native
   * layout mirroring to take effect.
   */
  setLanguage: (code: LanguageCode) => Promise<{ needsReload: boolean }>;
};

export const useLanguageStore = create<LanguageState>((set) => ({
  language: resolveInitialLanguage(),
  setLanguage: async (code) => {
    storage.set(LANGUAGE_MMKV_KEY, code);
    await i18n.changeLanguage(code);
    set({ language: code });
    const needsReload = applyRTLDirection(code);
    return { needsReload };
  },
}));

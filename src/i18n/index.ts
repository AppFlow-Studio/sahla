import 'intl-pluralrules';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ar from '@/src/i18n/locales/ar.json';
import bs from '@/src/i18n/locales/bs.json';
import en from '@/src/i18n/locales/en.json';
import es from '@/src/i18n/locales/es.json';
import sq from '@/src/i18n/locales/sq.json';
import tr from '@/src/i18n/locales/tr.json';
import ur from '@/src/i18n/locales/ur.json';
import { DEFAULT_LANGUAGE, resolveInitialLanguage } from '@/src/i18n/languages';
import { applyRTLDirection } from '@/src/i18n/rtl';

export const resources = {
  en: { translation: en },
  ar: { translation: ar },
  tr: { translation: tr },
  es: { translation: es },
  bs: { translation: bs },
  sq: { translation: sq },
  ur: { translation: ur },
} as const;

const initialLanguage = resolveInitialLanguage();

// Synchronous init — resources are bundled (no async backend), so i18n is
// ready immediately and we don't need to gate rendering on it.
i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false },
  returnNull: false,
});

/**
 * Sync the native layout direction to the boot language. `true` means the
 * direction flipped and the app must reload for it to take visual effect —
 * `app/_layout.tsx` watches this and reloads once. Almost always `false`
 * after the first launch (native state persists the last forced direction).
 */
export const bootDirectionChanged = applyRTLDirection(initialLanguage);

export default i18n;

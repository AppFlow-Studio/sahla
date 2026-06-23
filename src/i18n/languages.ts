import { getLocales } from 'expo-localization';

import { getMasjidConfig } from '@/src/stores/config-store';
import { storage } from '@/src/lib/mmkv';

/** MMKV key holding the user's chosen UI language (a `LanguageCode`). */
export const LANGUAGE_MMKV_KEY = 'ui-language.v1';

/**
 * Languages the app currently ships translations for. Adding a new LTR
 * language is: drop a `locales/<code>.json`, register it in `i18n/index.ts`
 * `resources`, and add a row here. Arabic (RTL) additionally needs the font +
 * layout work — see `src/i18n/rtl.ts` and `docs/i18n-rtl-plan.md`.
 */
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
  { code: 'tr', label: 'Turkish', nativeLabel: 'Türkçe' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'bs', label: 'Bosnian', nativeLabel: 'Bosanski' },
  { code: 'sq', label: 'Albanian', nativeLabel: 'Shqip' },
  { code: 'ur', label: 'Urdu', nativeLabel: 'اردو' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

const SUPPORTED_CODES = SUPPORTED_LANGUAGES.map((l) => l.code) as readonly string[];

function isSupported(code: string | null | undefined): code is LanguageCode {
  return !!code && SUPPORTED_CODES.includes(code);
}

/**
 * Resolve the language to boot with, in priority order:
 *   1. the user's persisted choice (MMKV)
 *   2. the device's first preferred locale (expo-localization)
 *   3. the masjid's configured default `locale`
 *   4. English
 */
export function resolveInitialLanguage(): LanguageCode {
  const stored = storage.getString(LANGUAGE_MMKV_KEY);
  if (isSupported(stored)) return stored;

  const device = getLocales()?.[0]?.languageCode ?? undefined;
  if (isSupported(device)) return device;

  const masjid = getMasjidConfig().locale?.split('-')[0];
  if (isSupported(masjid)) return masjid;

  return DEFAULT_LANGUAGE;
}

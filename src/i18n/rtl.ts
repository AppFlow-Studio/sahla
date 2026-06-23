import { I18nManager } from 'react-native';

/** Base language codes that render right-to-left. */
export const RTL_LANGUAGES: readonly string[] = ['ar', 'he', 'fa', 'ur'];

export function isRTLLang(lang: string): boolean {
  return RTL_LANGUAGES.includes(lang.split('-')[0].toLowerCase());
}

/**
 * Align the native layout direction with `lang`.
 *
 * React Native only honors a *forced* direction after a full app reload, so
 * this returns `true` when the direction actually changed — the caller is
 * responsible for reloading (e.g. `expo-updates` `reloadAsync()`) so the new
 * direction takes effect. Returns `false` (no reload needed) when the native
 * direction already matches, which is the common case on every launch after
 * the first switch.
 */
export function applyRTLDirection(lang: string): boolean {
  const shouldBeRTL = isRTLLang(lang);
  I18nManager.allowRTL(true);
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.forceRTL(shouldBeRTL);
    return true;
  }
  return false;
}

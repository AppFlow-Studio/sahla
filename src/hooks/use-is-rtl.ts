import { I18nManager } from 'react-native';

import { useLanguageStore } from '@/src/stores/language-store';
import { isRTLLang } from '@/src/i18n/rtl';

/**
 * Whether the UI is currently right-to-left.
 *
 * Reads the active native direction (`I18nManager.isRTL`) — the source of
 * truth for layout — but also subscribes to the language store so components
 * re-render the instant the language changes, even before the reload that
 * makes the native flip take full effect.
 */
export function useIsRTL(): boolean {
  const language = useLanguageStore((s) => s.language);
  return I18nManager.isRTL || isRTLLang(language);
}

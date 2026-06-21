/**
 * Curated font themes. A masjid admin picks one (in onboarding / the CRM) and
 * the choice is stored on `mosques.font_theme`, then flows through the same
 * rails as `brand_color`:
 *
 *   mosques.font_theme  → config-provider override  → MasjidConfig.fontTheme
 *   → ThemeRoot injects --font-display / --font-body → Tailwind `font-display`
 *     / `font-body` classes resolve at runtime.
 *
 * Every family name referenced below MUST be registered in the `useFonts`
 * call in `app/_layout.tsx` or it will silently fall back to the system font.
 *
 * The Quran/Arabic font (UthmanicHafs) is intentionally NOT part of any theme
 * — it stays locked so a masjid can never break Arabic rendering.
 */

export type FontTheme = {
  /** Display / headings — primary (medium) weight. */
  display: string;
  /** Display / headings — lighter (regular) weight, for large hero text. */
  displayRegular: string;
  /** Body / UI — regular. */
  body: string;
  /** Body / UI — medium emphasis. */
  bodyMedium: string;
  /** Body / UI — semibold emphasis (labels, section titles). */
  bodySemibold: string;
};

export const FONT_THEMES = {
  classic: {
    display: 'PlayfairDisplay_500Medium',
    displayRegular: 'PlayfairDisplay_400Regular',
    body: 'Inter_400Regular',
    bodyMedium: 'Inter_500Medium',
    bodySemibold: 'Inter_600SemiBold',
  },
  modern: {
    display: 'Inter_600SemiBold',
    displayRegular: 'Inter_500Medium',
    body: 'Inter_400Regular',
    bodyMedium: 'Inter_500Medium',
    bodySemibold: 'Inter_600SemiBold',
  },
  elegant: {
    display: 'CormorantGaramond_500Medium',
    displayRegular: 'CormorantGaramond_400Regular',
    body: 'Inter_400Regular',
    bodyMedium: 'Inter_500Medium',
    bodySemibold: 'Inter_600SemiBold',
  },
} as const satisfies Record<string, FontTheme>;

export type FontThemeKey = keyof typeof FONT_THEMES;

export const DEFAULT_FONT_THEME: FontThemeKey = 'classic';

/** Quran/Arabic font — locked, never themable. */
export const QURAN_FONT = 'UthmanicHafs';

/** Ordered list for building admin pickers (key + human label). */
export const FONT_THEME_OPTIONS: { key: FontThemeKey; label: string }[] = [
  { key: 'classic', label: 'Classic' },
  { key: 'modern', label: 'Modern' },
  { key: 'elegant', label: 'Elegant' },
];

/** Resolve a (possibly unknown / undefined) key to a concrete theme. */
export function resolveFontTheme(key: string | undefined | null): FontTheme {
  if (key && key in FONT_THEMES) {
    return FONT_THEMES[key as FontThemeKey];
  }
  return FONT_THEMES[DEFAULT_FONT_THEME];
}

/**
 * Home-screen header styles. A masjid admin picks one (in onboarding / the CRM)
 * and the choice is stored on `mosques.header_style`, then flows through the same
 * rails as `brand_color` / `font_theme`:
 *
 *   mosques.header_style → config-provider override → MasjidConfig.headerStyle
 *   → the <HomeHeader/> dispatcher renders the matching header layout.
 *
 * Unlike fonts (which fan out into CSS vars), a header style is a discrete
 * layout choice, so it is consumed directly by the home header rather than
 * injected through ThemeRoot.
 *
 *   - `classic`            — the original header (greeting + live clock + Hijri
 *                            date + "iqamah in 1h 38m" + prayer row). Default.
 *   - `countdown-centered` — masjid bar (logo + name + bell) + a live H:MM:SS
 *                            countdown to the next prayer, hero block centered.
 *   - `countdown-left`     — same as above, hero block left-aligned.
 */

export const HEADER_STYLES = {
  classic: { countdown: false, align: 'center' },
  'countdown-centered': { countdown: true, align: 'center' },
  'countdown-left': { countdown: true, align: 'left' },
} as const satisfies Record<string, { countdown: boolean; align: 'center' | 'left' }>;

export type HeaderStyleKey = keyof typeof HEADER_STYLES;

export const DEFAULT_HEADER_STYLE: HeaderStyleKey = 'classic';

/** Ordered list for building admin pickers (key + human label). */
export const HEADER_STYLE_OPTIONS: { key: HeaderStyleKey; label: string }[] = [
  { key: 'classic', label: 'Classic' },
  { key: 'countdown-centered', label: 'Countdown (Centered)' },
  { key: 'countdown-left', label: 'Countdown (Left-aligned)' },
];

/** Resolve a (possibly unknown / undefined) key to a concrete header style key. */
export function resolveHeaderStyle(key: string | undefined | null): HeaderStyleKey {
  if (key && key in HEADER_STYLES) return key as HeaderStyleKey;
  return DEFAULT_HEADER_STYLE;
}

/**
 * In-app type scale. Sibling to `fonts.ts` — `fonts.ts` decides which families
 * to use (per-masjid theming + Arabic override), `typeScale.ts` decides the
 * sizes / weights / line heights those families render at.
 *
 * Why this lives separately from `fonts.ts`:
 *   - Brand System v1.1 explicitly does NOT govern in-product UI yet, so the
 *     scale below is an internal opinion that absorbs ~95% of the existing
 *     inline `fontSize` uses across `app/(main)/*` and `src/screens/*`. The
 *     audit found 7 sizes account for the bulk of usage; sizes 8–11 (93 inline
 *     uses) are the worst legibility offenders and get retired by floor=12.
 *   - When the brand team locks an in-app type system, the numbers below are
 *     the only knobs to adjust — no consumer change needed.
 *
 * Consumers should NOT inline `fontSize:` / `fontWeight:` in component styles.
 * Use `<Text variant="…">` from `src/components/ui/Text.tsx`, which threads the
 * variant through `useFontFamily()` so the per-masjid font theme + the Arabic
 * font override both apply automatically.
 *
 * Sizes outside this scale (Mushaf Arabic 23/44/56, etc.) live in the screen
 * that owns them — those are screen-specific typographic decisions, not
 * application-wide tokens.
 */

export type TypeVariant =
  | 'display'   // page hero titles
  | 'heading'   // section heroes
  | 'subhead'   // card titles
  | 'body-lg'   // primary body
  | 'body'      // standard body
  | 'label'     // buttons, tab labels, dense labels
  | 'caption';  // meta, captions, hint copy

export type TypeWeight = 'regular' | 'medium' | 'semibold' | 'bold';

export type TypeToken = {
  fontSize: number;
  lineHeight: number;
  weight: TypeWeight;
  /** Which `fonts.ts` slot this variant uses. Resolved at runtime by `<Text>`. */
  family: 'display' | 'displayRegular' | 'body' | 'bodyMedium' | 'bodySemibold';
};

/**
 * Numeric fontWeight matching the four TypeWeight tiers. Used when the chosen
 * font family is a system family without baked-in weights (very rare in
 * practice — most of our families ship as `_400Regular` / `_500Medium` /
 * `_600SemiBold` so `family` already implies the weight).
 */
export const FONT_WEIGHTS: Record<TypeWeight, '400' | '500' | '600' | '700'> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const TYPE_SCALE: Record<TypeVariant, TypeToken> = {
  display:  { fontSize: 30, lineHeight: 36, weight: 'medium',   family: 'display' },
  heading:  { fontSize: 22, lineHeight: 28, weight: 'semibold', family: 'bodySemibold' },
  subhead:  { fontSize: 18, lineHeight: 24, weight: 'semibold', family: 'bodySemibold' },
  'body-lg':{ fontSize: 16, lineHeight: 22, weight: 'regular',  family: 'body' },
  body:     { fontSize: 14, lineHeight: 20, weight: 'regular',  family: 'body' },
  label:    { fontSize: 13, lineHeight: 18, weight: 'semibold', family: 'bodySemibold' },
  caption:  { fontSize: 12, lineHeight: 16, weight: 'regular',  family: 'body' },
};

/** Minimum legible size in the app. Audit floor; sizes below this are bugs. */
export const MIN_BODY_SIZE = 12;

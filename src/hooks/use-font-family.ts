import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { resolveFontTheme, type FontTheme } from '@/src/theme/fonts';

/**
 * Returns the active masjid's resolved font families for use in imperative /
 * inline `style={{ fontFamily }}` code:
 *
 *   const fonts = useFontFamily();
 *   <Text style={{ fontFamily: fonts.display }}>…</Text>   // heading
 *   <Text style={{ fontFamily: fonts.body }}>…</Text>      // body
 *   <Text style={{ fontFamily: fonts.bodySemibold }}>…</Text>
 *
 * For className-based code use the Tailwind classes instead (`font-display`,
 * `font-body`, `font-body-medium`, `font-body-semibold`, `font-display-regular`)
 * — both paths resolve from the same FONT_THEMES source of truth.
 *
 * The Quran/Arabic font (UthmanicHafs / Amiri) is intentionally NOT here — it
 * stays locked and is referenced directly where Arabic is rendered.
 */
export function useFontFamily(): FontTheme {
  return resolveFontTheme(useMasjidConfig().fontTheme);
}

import type { TextStyle } from 'react-native';

/**
 * Makes a `<Text>` sit where you'd expect inside a fixed-size, centred box.
 *
 * Android reserves the font's full ascent/descent inside every `<Text>`
 * (`includeFontPadding`, on by default) — iOS has no equivalent. In flowing
 * copy that's invisible, but a single glyph centred in a circle or pill gets
 * pushed visibly off-centre, because the padding is asymmetric for most fonts.
 * Turning it off is what makes Android match iOS.
 *
 * Spread this into any text style whose job is to be an icon, a badge number,
 * or a label centred in a fixed-height control.
 */
export const CENTERED_GLYPH: TextStyle = {
  includeFontPadding: false,
  textAlignVertical: 'center',
};

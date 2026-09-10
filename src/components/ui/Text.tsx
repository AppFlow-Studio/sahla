import { forwardRef, useMemo } from 'react';
import {
  Text as RNText,
  type TextProps as RNTextProps,
  type TextStyle,
} from 'react-native';

import { useFontFamily } from '@/src/hooks/use-font-family';
import {
  FONT_WEIGHTS,
  TYPE_SCALE,
  type TypeVariant,
} from '@/src/theme/typeScale';

/**
 * App-wide typography component. Resolves the in-app type token table
 * (`src/theme/typeScale.ts`) and threads the per-masjid font theme so the
 * caller doesn't have to look up family / size / weight separately. The
 * `style` prop still wins for one-off color / alignment / margin overrides.
 *
 * Use this everywhere instead of inline `fontSize:` / `fontFamily:` to keep
 * vertical rhythm consistent and to make brand-led type changes a single-file
 * edit. Mushaf Arabic text, hero countdown clocks, and other intentionally
 *-out-of-scale strings should remain inline — typed text in plain UI is the
 * target.
 *
 *   <Text variant="heading">Surahs</Text>
 *   <Text variant="body" style={{ color: c.muted }}>114 chapters</Text>
 */
export type TextProps = Omit<RNTextProps, 'children'> & {
  variant?: TypeVariant;
  children?: React.ReactNode;
};

export const Text = forwardRef<RNText, TextProps>(function Text(
  { variant = 'body', style, children, ...rest },
  ref,
) {
  const fonts = useFontFamily();
  const resolved: TextStyle = useMemo(() => {
    const token = TYPE_SCALE[variant];
    return {
      fontFamily: fonts[token.family],
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      fontWeight: FONT_WEIGHTS[token.weight],
    };
  }, [variant, fonts]);

  return (
    <RNText ref={ref} style={[resolved, style]} {...rest}>
      {children}
    </RNText>
  );
});

export default Text;

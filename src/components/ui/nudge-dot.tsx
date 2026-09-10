import { View, type ViewStyle } from 'react-native';

/** Attention red — the conventional "something needs you" notification color. */
export const NUDGE_COLOR = '#EF4444';

/**
 * A small filled dot used to flag an unfinished setup step (notifications,
 * tutorial) on Profile rows. The tab-bar dot is the native `<Badge>`; this is
 * the in-screen equivalent.
 */
export function NudgeDot({
  size = 8,
  color = NUDGE_COLOR,
  style,
}: {
  size?: number;
  color?: string;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        style,
      ]}
    />
  );
}

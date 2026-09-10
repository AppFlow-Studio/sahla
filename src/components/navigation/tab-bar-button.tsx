import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NudgeDot } from '@/src/components/ui/nudge-dot';
import { useSetupCompleteness } from '@/src/hooks/use-setup-completeness';

/**
 * Matched Ionicons outline/filled pairs, kept in sync with the `<NativeTabs>`
 * config in `(main)/_layout` so both bars show the same silhouettes — the
 * active tab simply fills in.
 */
export const TAB_ICONS: Record<string, { default: string; selected: string }> = {
  index: { default: 'home-outline', selected: 'home' },
  discover: { default: 'compass-outline', selected: 'compass' },
  watch: { default: 'play-circle-outline', selected: 'play-circle' },
  prayer: { default: 'time-outline', selected: 'time' },
  profile: { default: 'person-outline', selected: 'person' },
};

/**
 * The Profile attention dot, deliberately isolated in its own component.
 *
 * `useSetupCompleteness` pulls in `useNotificationStatus`, which runs a
 * `useFocusEffect` that re-checks OS permission and invalidates a Supabase
 * query on EVERY tab focus. Calling it from `TabBar` made each tab tap
 * re-render the whole bar — rebuilding the pan gesture and the BlurView — so
 * taps felt sluggish. Keeping it in a leaf confines those re-renders to the dot.
 */
function ProfileNudgeDot({ ringColor }: { ringColor: string }) {
  const setup = useSetupCompleteness();
  if (setup.incompleteCount === 0) return null;
  return (
    <NudgeDot
      size={9}
      style={{
        position: 'absolute',
        top: -2,
        right: -4,
        borderWidth: 1.5,
        borderColor: ringColor,
      }}
    />
  );
}

type Props = {
  onPress: () => void;
  onLongPress: () => void;
  isFocused: boolean;
  routeName: string;
  label: string;
  activeColor: string;
  inactiveColor: string;
  dotRingColor: string;
};

export function TabBarButton({
  onPress,
  onLongPress,
  isFocused,
  routeName,
  label,
  activeColor,
  inactiveColor,
  dotRingColor,
}: Props) {
  const icons = TAB_ICONS[routeName] ?? TAB_ICONS.index;
  const color = isFocused ? activeColor : inactiveColor;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.container}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
    >
      <View style={styles.buttonWrapper}>
        <View style={styles.content}>
          <View style={styles.iconWrapper}>
            <Ionicons
              name={(isFocused ? icons.selected : icons.default) as never}
              size={24}
              color={color}
            />
            {routeName === 'profile' ? <ProfileNudgeDot ringColor={dotRingColor} /> : null}
          </View>
          <Text style={[styles.label, { color, fontWeight: isFocused ? '700' : '500' }]}>
            {label}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWrapper: {
    width: 64,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconWrapper: {
    position: 'relative',
  },
  label: {
    fontSize: 10,
  },
});

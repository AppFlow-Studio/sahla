import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/src/components/ui/icon';

type OptionRowProps = {
  label: string;
  selected: boolean;
  onToggle: () => void;
  /** When false the row hides its bottom hairline — used for the last row in a list. */
  showDivider?: boolean;
};

/**
 * Multi-select row for personalization steps: label on the left, circular
 * checkbox on the right, hairline divider underneath. Matches Figma node
 * 1:538 (rows for "Prayer & Worship", "Learning & lectures", etc.).
 */
export function OptionRow({ label, selected, onToggle, showDivider = true }: OptionRowProps) {
  return (
    <Pressable onPress={onToggle} className="active:opacity-70">
      <View className="flex-row items-center justify-between py-5">
        <Text className="flex-1 text-onboarding-bg" style={{ fontSize: 14 }}>
          {label}
        </Text>
        <View
          className={
            selected
              ? 'h-[22px] w-[22px] items-center justify-center rounded-full bg-onboarding-bg'
              : 'h-[22px] w-[22px] items-center justify-center rounded-full border border-onboarding-bg/30'
          }
        >
          {selected && <Icon name="checkmark" size={14} color="#FFFBF2" />}
        </View>
      </View>
      {showDivider && <View className="h-px bg-onboarding-bg/10" />}
    </Pressable>
  );
}

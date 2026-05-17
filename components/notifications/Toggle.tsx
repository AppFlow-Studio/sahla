import { Pressable, View } from 'react-native';

const INK = '#0A261E';
const TOGGLE_OFF_BG = 'rgba(10,38,30,0.2)';
const THUMB = '#FCFCFD';

type Props = {
  value: boolean;
  onChange: (next: boolean) => void;
};

export function Toggle({ value, onChange }: Props) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      hitSlop={10}
      style={{
        width: 36,
        height: 20,
        borderRadius: 12,
        backgroundColor: value ? INK : TOGGLE_OFF_BG,
        padding: 2,
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 16,
          height: 16,
          borderRadius: 999,
          backgroundColor: THUMB,
          marginLeft: value ? 16 : 0,
          shadowColor: '#101828',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 1,
        }}
      />
    </Pressable>
  );
}

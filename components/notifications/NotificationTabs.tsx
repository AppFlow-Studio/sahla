import { Pressable, Text, View } from 'react-native';

const INK = '#0A261E';
const INK_MUTED = 'rgba(10,38,30,0.6)';

const SF_MEDIUM = 'System';

type Props<T extends string> = {
  tabs: readonly T[];
  active: T;
  onChange: (tab: T) => void;
};

export function NotificationTabs<T extends string>({
  tabs,
  active,
  onChange,
}: Props<T>) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 24,
        paddingTop: 16,
        gap: 24,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab === active;
        return (
          <Pressable
            key={tab}
            onPress={() => onChange(tab)}
            hitSlop={8}
            style={{ alignItems: 'flex-start' }}
          >
            <Text
              style={{
                fontFamily: SF_MEDIUM,
                fontWeight: '500',
                fontSize: 13,
                color: isActive ? INK : INK_MUTED,
              }}
            >
              {tab}
            </Text>
            {isActive ? (
              // Stretch to the Pressable's content width — which equals the
              // label width because the Pressable sizes to its child Text.
              <View
                style={{
                  marginTop: 4,
                  height: 1,
                  alignSelf: 'stretch',
                  backgroundColor: INK,
                }}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

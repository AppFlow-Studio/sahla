import { Text, View } from 'react-native';

/**
 * Small red "1" pill used to mark a setup row as incomplete. Shared so the
 * Profile / Personalization / Notifications rows all read consistently.
 */
export function IncompleteBadge() {
  return (
    <View
      style={{
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#E53935',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 5,
      }}
      accessibilityLabel="Incomplete"
    >
      <Text
        style={{
          color: '#FFFFFF',
          fontSize: 11,
          fontWeight: '700',
          lineHeight: 14,
        }}
      >
        1
      </Text>
    </View>
  );
}

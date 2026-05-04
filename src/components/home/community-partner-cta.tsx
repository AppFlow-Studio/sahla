import { View, Text, TouchableOpacity } from 'react-native';

export function CommunityPartnerCta() {
  return (
    <TouchableOpacity activeOpacity={0.85}>
      <View className="items-center rounded-full bg-primary px-5 py-3">
        <Text className="text-[14px] text-primary-foreground">
          Become a Community Partner →
        </Text>
      </View>
    </TouchableOpacity>
  );
}

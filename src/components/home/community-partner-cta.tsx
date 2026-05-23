import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export function CommunityPartnerCta() {
  const router = useRouter();

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/advertise')}>
      <View className="items-center rounded-full bg-primary px-5 py-3">
        <Text className="text-[14px] text-primary-foreground">
          Become a Community Partner →
        </Text>
      </View>
    </TouchableOpacity>
  );
}

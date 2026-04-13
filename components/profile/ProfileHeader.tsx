import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import { useProfile } from '@/src/hooks/use-profile';

const HEADER_BG_DARK = '#0A261E';
const HEADER_BG_LIGHT = '#0D2B1A';

export default function ProfileHeader() {
  const { profile, status, error } = useProfile();
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ PlayfairDisplay_700Bold });

  if (status === 'idle' || status === 'loading' || !fontsLoaded) {
    return (
      <View
        className="w-full items-center justify-center bg-primary"
        style={{ paddingTop: insets.top, minHeight: 160 }}
      >
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View className="w-full items-center justify-center p-6">
        <Text className="text-red-500">{error}</Text>
      </View>
    );
  }

  const hasPhoto = Boolean(profile?.profile_pic);
  const url = profile?.profile_pic;
  const firstName = profile?.first_name;
  const lastName = profile?.last_name;
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';
  const createdYear = profile?.created_at
    ? new Date(profile.created_at).getFullYear()
    : undefined;

  const nonEmpty = (s: string | null | undefined) => (s?.trim().length ?? 0) > 0;
  const isProfileComplete =
    nonEmpty(firstName) &&
    nonEmpty(lastName) &&
    nonEmpty(profile?.profile_email) &&
    nonEmpty(profile?.phone_number) &&
    hasPhoto;

  const initial = firstName?.charAt(0) ?? '?';

  return (
    <LinearGradient
      colors={[HEADER_BG_LIGHT, HEADER_BG_DARK]}
      className="w-full"
      style={{ paddingTop: insets.top - 20, paddingBottom: 18 }}
    >
      {/* Geometric pattern overlay */}
      <Image
        source={require('@/assets/images/islamic-pattern.png')}
        className="absolute inset-0 h-full w-full"
        contentFit="cover"
        style={{ opacity: 0.12 }}
      />

      <View className="w-full items-center px-4">
        {/* Avatar */}
        <Pressable className="relative h-20 w-20">
          {hasPhoto && url ? (
            <Image
              source={{ uri: url }}
              className="h-full w-full rounded-full"
              contentFit="cover"
            />
          ) : (
            <View className="h-full w-full items-center justify-center rounded-full bg-[#5A6652]">
              <Text
                className="text-3xl text-primary-foreground text-center"
                style={{ fontFamily: 'PlayfairDisplay_700Bold' }}
              >
                {initial}
              </Text>
            </View>
          )}
          <View className="absolute bottom-0 right-0 rounded-full bg-accent p-1">
            <EvilIcons name="pencil" size={14} color="#FFFBF2" />
          </View>
        </Pressable>

        {/* Name */}
        <Text
          className="mt-2 text-center text-xl text-primary-foreground"
          style={{ fontFamily: 'PlayfairDisplay_700Bold' }}
        >
          {fullName}
        </Text>

        {/* Member since */}
        <Text className="mt-0.5 text-center text-xs text-muted-foreground">
          Member Since {createdYear}
        </Text>

        {/* Action buttons */}
        <View className="mt-3 flex-row items-center justify-center gap-3">
          {!isProfileComplete && (
            <Pressable className="flex-row items-center rounded-full border border-accent px-4 py-2">
              <View className="mr-2 h-1.5 w-1.5 rounded-full bg-accent" />
              <Text className="text-sm font-medium text-accent">Complete Profile</Text>
            </Pressable>
          )}
          <Pressable className="rounded-full border border-primary-foreground px-4 py-2">
            <Text className="text-sm font-medium text-primary-foreground">Edit Profile</Text>
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

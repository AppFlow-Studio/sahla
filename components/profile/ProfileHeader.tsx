import { useState } from 'react';
import { ActivityIndicator, ImageBackground, Platform, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import { useProfile } from '@/src/hooks/use-profile';

import {
  useFonts,
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
} from '@expo-google-fonts/cormorant-garamond';
const HEADER_BG_DARK = '#0A261E';
const HEADER_BG_LIGHT = '#0D2B1A';

export default function ProfileHeader() {
  const { profile, status, error } = useProfile();
  const insets = useSafeAreaInsets();
  /** Measured header height so the vector can be exactly half (RN % height on absolute children is unreliable). */
  const [headerHeight, setHeaderHeight] = useState(0);
  const [fontsLoaded] = useFonts({
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
  });

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

  /** ~54% of header (~8% taller than half; tune 0.525–0.55 for 5–10% more than 50%). */
  const vectorHeight =
    headerHeight > 0 ? Math.round(headerHeight * 0.54) : undefined;

  return (
    <View className="relative w-full overflow-hidden bg-[#0A261E]">
      <LinearGradient
        colors={[HEADER_BG_LIGHT, HEADER_BG_DARK]}
        className="w-full"
        style={{ paddingTop: insets.top - 40, paddingBottom: 36 }}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0) setHeaderHeight(h);
        }}
      >
        {/* Geometric pattern overlay */}
        <Image
          source={require('@/assets/images/islamic-pattern.png')}
          className="absolute inset-0 h-full w-full"
          contentFit="cover"
          style={{ opacity: 0.12 }}
        />

        {/* Vector art: top half of header only, behind content (not a separate block above) */}
        <ImageBackground
          source={require('@/assets/images/Vector.png')}
          resizeMode="cover"
          className="absolute left-0 right-0 top-0 w-full"
          style={{
            height: vectorHeight ?? 200,
            opacity: 0.78,
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />

        <View className="relative z-10 w-full items-center px-4">
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
                className="text-5xl text-primary-foreground text-center "
                style={{
                  fontFamily: 'CormorantGaramond_500Medium',
                  lineHeight: 48,
                  marginLeft: 5,
                  marginTop: 3,
                }}
              >
                {initial}
              </Text>
            </View>
          )}
          <View className="absolute bottom-0 right-0 rounded-full bg-[#B8922A] p-1">
            <EvilIcons name="pencil" size={14} color="#FFFBF2" />
          </View>
        </Pressable>

        {/* Name */}
        <Text
          className="mt-2 text-center text-3xl text-primary-foreground"
          style={{ fontFamily: 'CormorantGaramond_600SemiBold' }}
        >
          {fullName}
        </Text>

        {/* Member since — SF Pro Text Regular on iOS (system UI font for small copy) */}
        <Text
          className="mb-0.5 text-center text-xs text-[#FFFBF299] "
          style={{
            fontFamily: Platform.select({
              android: 'Roboto',
              default: 'sans-serif',
            }),
            fontWeight: '400',
          }}
        >
          Member Since {createdYear}
        </Text>

        {/* Action buttons */}
        <View className="mt-3 flex-row items-center justify-center gap-3">
  {!isProfileComplete && (
    <Pressable className="flex-row items-center justify-center rounded-full border border-accent px-5 py-2.5" style={{ minWidth: 130 }}>
      <View className="mr-2 items-center justify-center">
    {/* Glow */}
    <View className="absolute h-4 w-4 rounded-full bg-accent opacity-20" />
    {/* Dot */}
    <View className="h-2.5 w-2.5 rounded-full bg-accent" />
  </View>
      <Text className="text-xs font-medium text-accent">Complete Profile</Text>
    </Pressable>
  )}
  <Pressable
    className="items-center justify-center rounded-full border border-[#FFFBF280] px-5 py-2.5 "
    style={{ minWidth: 130 }}
  >
    <Text className="text-xs font-medium text-[#FFFBF2]">Edit Profile</Text>
  </Pressable>
</View>
        </View>
      </LinearGradient>
    </View>
  );
}

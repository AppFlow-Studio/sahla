import { useAuth, useUser } from '@clerk/clerk-expo';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useProfile } from '@/src/hooks/use-profile';
import { useOnboardingStore } from '@/src/stores/onboarding-store';

import {
  useFonts,
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
} from '@expo-google-fonts/cormorant-garamond';

function tripletToRgb(triplet: string) {
  return `rgb(${triplet.replace(/ /g, ',')})`;
}

export default function ProfileHeader() {
  const { profile, status, error } = useProfile();
  const { signOut } = useAuth();
  const { user } = useUser();
  const { clerkOrgId, colors } = useMasjidConfig();
  const primaryRgb = tripletToRgb(colors.primary);
  const accentRgb = tripletToRgb(colors.accent);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const router = useRouter();
  const passwordEnabled = (user as any)?.passwordEnabled ?? false;

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          useOnboardingStore.getState().reset();
          queryClient.clear();
          await signOut();
        },
      },
    ]);
  }, [signOut, queryClient]);
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

  if (status === 'error' && !user) {
    return (
      <View className="w-full items-center justify-center p-6">
        <Text className="text-red-500">{error}</Text>
      </View>
    );
  }

  // Resolve user info: Supabase profile → Clerk metadata (org-keyed) → onboarding store → Clerk user
  const meta = user?.publicMetadata as Record<string, any> | undefined;
  const metaFirstName = clerkOrgId ? meta?.[clerkOrgId]?.firstName : null;
  const storedFirstName = useOnboardingStore.getState().firstName;

  const hasPhoto = Boolean(profile?.profile_pic ?? user?.imageUrl);
  const url = profile?.profile_pic ?? user?.imageUrl;
  const firstName =
    profile?.first_name ?? metaFirstName ?? (storedFirstName.trim() || null) ?? user?.firstName;
  const lastName = profile?.last_name ?? user?.lastName;
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || (user?.primaryEmailAddress?.emailAddress ?? 'Unknown');
  const createdYear = profile?.created_at
    ? new Date(profile.created_at).getFullYear()
    : user?.createdAt
      ? new Date(user.createdAt).getFullYear()
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
    <View className="relative w-full overflow-hidden bg-primary">
      <LinearGradient
        colors={[primaryRgb, primaryRgb]}
        className="w-full"
        style={{ paddingTop: insets.top + 5, paddingBottom: 28 }}
      >
        <Image
          source={require('@/assets/islamic-pattern.png')}
          tintColor={accentRgb}
          style={{
            position: 'absolute',
            top: -10,
            left: 0,
            right: 0,
            height: 340,
            opacity: 0.35,
            transform: [{ rotate: '180deg' }],
          }}
          contentFit="cover"
          pointerEvents="none"
        />

        <View className="relative z-10 w-full items-center px-4">
        {/* Avatar */}
        <Pressable className="relative h-20 w-20">
          {hasPhoto && url ? (
            <Image
              source={{ uri: url }}
              style={{ width: 80, height: 80, borderRadius: 40 }}
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
          <View className="absolute -bottom-2 -right-2 rounded-full bg-accent p-1">
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

        {/* Signed-in email */}
        {user?.primaryEmailAddress?.emailAddress && (
          <Text
            className="mt-0.5 text-center text-xs text-[#FFFBF280]"
            style={{ fontWeight: '400' }}
          >
            {user.primaryEmailAddress.emailAddress}
          </Text>
        )}

        {/* Member since */}
        {createdYear && (
          <Text
            className="mb-0.5 text-center text-xs text-[#FFFBF260]"
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
        )}

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

        <View className="mt-3 flex-row items-center justify-center gap-3">
          {passwordEnabled && (
            <Pressable
              onPress={() => router.push('/change-password')}
              className="items-center justify-center rounded-full border border-[#FFFBF280] px-5 py-2.5"
              style={{ minWidth: 130 }}
            >
              <Text className="text-xs font-medium text-[#FFFBF2]">Change Password</Text>
            </Pressable>
          )}
          <Pressable
            onPress={handleSignOut}
            className="items-center justify-center rounded-full border border-red-500/50 px-5 py-2.5"
            style={{ minWidth: 130 }}
          >
            <Text className="text-xs font-medium text-red-400">Sign Out</Text>
          </Pressable>
        </View>
        </View>
      </LinearGradient>
    </View>
  );
}

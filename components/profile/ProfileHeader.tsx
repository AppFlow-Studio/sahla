import { useUser } from '@clerk/clerk-expo';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ImageBackground, Platform, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import { ProfilePhotoModal } from '@/components/profile/ProfilePhotoModal';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useProfile } from '@/src/hooks/use-profile';
import { useUploadProfilePhoto } from '@/src/hooks/use-upload-profile-photo';
import { useOnboardingStore } from '@/src/stores/onboarding-store';
import EditProfileSheet from './EditProfileSheet';

import {
  useFonts,
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
} from '@expo-google-fonts/cormorant-garamond';

export default function ProfileHeader() {
  const { profile, status, error } = useProfile();
  const { user } = useUser();
  const { clerkOrgId, colors } = useMasjidConfig();
  const insets = useSafeAreaInsets();

  const primaryRgb = `rgb(${colors.primary.replace(/ /g, ',')})`;
  const depthRgb = `rgb(${colors.depth.replace(/ /g, ',')})`;
  const fgRgb = `rgb(${colors.primaryForeground.replace(/ /g, ',')})`;
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;

  const [headerHeight, setHeaderHeight] = useState(0);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const { takePhoto, chooseFromGallery, isUploading } = useUploadProfilePhoto();
  const [editVisible, setEditVisible] = useState(false);

  const handlePhotoSource = useCallback(
    async (source: 'camera' | 'gallery') => {
      try {
        const result = source === 'camera' ? await takePhoto() : await chooseFromGallery();
        setPhotoModalOpen(false);
        return result;
      } catch (e) {
        Alert.alert(
          'Could not update photo',
          e instanceof Error ? e.message : 'Unknown error',
        );
      }
    },
    [takePhoto, chooseFromGallery],
  );

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
        <ActivityIndicator size="large" color={accentRgb} />
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

  const vectorHeight =
    headerHeight > 0 ? Math.round(headerHeight * 0.60) : undefined;

  return (
    <View className="relative w-full overflow-hidden bg-primary">
      <LinearGradient
        colors={[depthRgb, primaryRgb]}
        className="w-full"
        style={{ paddingTop: insets.top + 5, paddingBottom: 48 }}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0) setHeaderHeight(h);
        }}
      >
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
        <View className="relative h-20 w-20">
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
                }}
              >
                {initial}
              </Text>
            </View>
          )}
          <Pressable
            onPress={() => setPhotoModalOpen(true)}
            hitSlop={10}
            className="absolute -bottom-2 -right-2 rounded-full bg-accent p-1 active:opacity-80"
          >
            <EvilIcons name="pencil" size={14} color={fgRgb} />
          </Pressable>
        </View>

          {/* Name */}
          <Text
            className="mt-3 text-center text-primary-foreground"
            style={{
              fontFamily: 'CormorantGaramond_600SemiBold',
              fontSize: 20,
            }}
          >
            {fullName}
          </Text>

          {/* Member since */}
          {createdYear && (
            <Text
              className="text-center text-primary-foreground/60"
              style={{
                fontFamily: Platform.select({
                  android: 'Roboto',
                  default: undefined,
                }),
                fontWeight: '400',
                fontSize: 8,
              }}
            >
              Member Since {createdYear}
            </Text>
          )}

          {/* Action buttons */}
          <View className="mt-2 flex-row items-center justify-center gap-2">
            {!isProfileComplete && (
              <Pressable
                className="flex-row items-center justify-center rounded-full border-accent/50"
                style={{
                  borderWidth: 0.5,
                  paddingHorizontal: 14,
                  paddingVertical: 4,
                }}
              >
                <View className="mr-1.5 items-center justify-center">
                  <View className="absolute h-3 w-3 rounded-full bg-accent opacity-20" />
                  <View className="rounded-full bg-accent" style={{ width: 4, height: 4 }} />
                </View>
                <Text className="text-accent" style={{ fontSize: 8, fontWeight: '400' }}>
                  Complete Profile
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => setEditVisible(true)}
              className="items-center justify-center rounded-full border-primary-foreground/50"
              style={{
                borderWidth: 0.5,
                paddingHorizontal: 14,
                paddingVertical: 4,
              }}
            >
              <Text className="text-primary-foreground" style={{ fontSize: 8, fontWeight: '400' }}>
                Edit Profile
              </Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>

      <ProfilePhotoModal
        visible={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        onTakePhoto={() => handlePhotoSource('camera')}
        onChooseFromGallery={() => handlePhotoSource('gallery')}
        isUploading={isUploading}
      />
      <EditProfileSheet visible={editVisible} onClose={() => setEditVisible(false)} />
    </View>
  );
}

import { useUser } from '@clerk/clerk-expo';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Pattern from '@/assets/onboarding/pattern.svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/src/components/ui/icon';
import { ProfilePhotoModal } from '@/components/profile/ProfilePhotoModal';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useFontFamily } from '@/src/hooks/use-font-family';
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
  const { t } = useTranslation();
  const { profile, status, error } = useProfile();
  const { user } = useUser();
  const { clerkOrgId, colors } = useMasjidConfig();
  const fonts = useFontFamily();
  const insets = useSafeAreaInsets();

  const primaryRgb = `rgb(${colors.primary.replace(/ /g, ',')})`;
  const primaryRgba0 = `rgba(${colors.primary.replace(/ /g, ',')}, 0)`;
  const fgRgb = `rgb(${colors.primaryForeground.replace(/ /g, ',')})`;
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;

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
          t('profile.couldNotUpdatePhoto'),
          e instanceof Error ? e.message : t('profile.unknownError'),
        );
      }
    },
    [takePhoto, chooseFromGallery, t],
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
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || (user?.primaryEmailAddress?.emailAddress ?? t('profile.unknownName'));
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
      <View
        className="w-full"
        style={{ backgroundColor: primaryRgb, paddingTop: insets.top + 20, paddingBottom: 48 }}
      >
        {/* Golden geometric pattern (same SVG as the create-account screen),
            flush to the top edge. Rendered once at the SVG's natural aspect so
            the full motif shows (zoomed out, not a tight crop), then faded so it
            dissolves into the header with no seam. */}
        <View
          pointerEvents="none"
          className="absolute left-0 right-0 top-0"
          style={{ zIndex: 1, aspectRatio: 424 / 262 }}
        >
          <View style={{ ...StyleSheet.absoluteFillObject, opacity: 0.55 }}>
            <Pattern width="100%" height="100%" preserveAspectRatio="xMidYMin meet" />
          </View>
          <LinearGradient
            colors={[primaryRgba0, primaryRgb]}
            locations={[0, 1]}
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        <View className="relative z-10 w-full items-center px-4">
        {/* Avatar */}
        <View className="relative h-20 w-20 items-center justify-center self-center">
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
                  fontFamily: fonts.display,
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
            <Icon name="pencil" size={14} color={fgRgb} />
          </Pressable>
        </View>

          {/* Name */}
          <Text
            className="mt-3 text-center text-primary-foreground"
            style={{
              fontFamily: fonts.display,
              fontSize: 21,
            }}
          >
            {fullName}
          </Text>

          {/* Member since */}
          {createdYear && (
            <Text
              className="text-center text-primary-foreground/60"
              style={{
                fontFamily: fonts.body,
                fontWeight: '400',
                fontSize: 10,
              }}
            >
              {t('profile.memberSince', { year: createdYear })}
            </Text>
          )}

          {/* Action buttons */}
          <View className="mt-2.5 flex-row items-center justify-center gap-2">
            {!isProfileComplete && (
              <Pressable
                className="flex-row items-center justify-center rounded-full border-accent/50 active:opacity-80"
                style={{
                  borderWidth: 0.75,
                  paddingHorizontal: 11,
                  paddingVertical: 4,
                }}
              >
                <View className="me-1 items-center justify-center">
                  <View className="absolute h-2.5 w-2.5 rounded-full bg-accent opacity-20" />
                  <View className="rounded-full bg-accent" style={{ width: 4, height: 4 }} />
                </View>
                <Text className="text-accent" style={{ fontSize: 9, fontWeight: '500' }}>
                  {t('profile.completeProfile')}
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => setEditVisible(true)}
              className="items-center justify-center rounded-full border-primary-foreground/50 active:opacity-80"
              style={{
                borderWidth: 0.75,
                // When the profile is complete this is the only button, so make
                // it a prominent, centered standalone action.
                paddingHorizontal: isProfileComplete ? 18 : 11,
                paddingVertical: isProfileComplete ? 5 : 4,
              }}
            >
              <Text
                className="text-primary-foreground"
                style={{ fontSize: isProfileComplete ? 10.5 : 9, fontWeight: '500' }}
              >
                {t('profile.editProfile')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

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

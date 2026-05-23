import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useProfile, useUpdateProfile } from '@/src/hooks/use-profile';

const SCREEN_H = Dimensions.get('window').height;

type Props = {
  visible: boolean;
  onClose: () => void;
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  labelColor,
  textColor,
  borderColor,
  placeholderColor,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: TextInput['props']['keyboardType'];
  autoCapitalize?: TextInput['props']['autoCapitalize'];
  labelColor: string;
  textColor: string;
  borderColor: string;
  placeholderColor: string;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          color: labelColor,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={{
          fontSize: 14,
          fontWeight: '500',
          color: textColor,
          borderBottomWidth: 1,
          borderBottomColor: borderColor,
          paddingBottom: 8,
          paddingTop: 2,
        }}
      />
    </View>
  );
}

export default function EditProfileSheet({ visible, onClose }: Props) {
  const { colors } = useMasjidConfig();
  const { profile } = useProfile();
  const updateProfile = useUpdateProfile();

  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ',')})`;
  const bgRgb = `rgb(${colors.card.replace(/ /g, ',')})`;
  const labelColor = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.6)`;
  const borderColor = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.1)`;
  const placeholderColor = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.25)`;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [mounted, setMounted] = useState(false);
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && profile) {
      setFirstName(profile.first_name ?? '');
      setLastName(profile.last_name ?? '');
      setEmail(profile.profile_email ?? '');
      setPhone(profile.phone_number ?? '');
    }
  }, [visible, profile]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 0,
          duration: 160,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: SCREEN_H,
          duration: 260,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [visible, translateY, backdrop, mounted]);

  const handleSave = () => {
    updateProfile.mutate(
      {
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        profile_email: email.trim() || null,
        phone_number: phone.trim() || null,
      },
      { onSuccess: onClose },
    );
  };

  const hasChanges =
    firstName !== (profile?.first_name ?? '') ||
    lastName !== (profile?.last_name ?? '') ||
    email !== (profile?.profile_email ?? '') ||
    phone !== (profile?.phone_number ?? '');

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end px-2 pb-3"
      >
        {/* Backdrop */}
        <Animated.View
          pointerEvents={visible ? 'auto' : 'none'}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: `rgba(${colors.foreground.replace(/ /g, ',')}, 0.4)`,
            opacity: backdrop,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View
          style={{
            backgroundColor: bgRgb,
            borderRadius: 48,
            transform: [{ translateY }],
            shadowColor: fgRgb,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 24,
            elevation: 12,
          }}
        >
          {/* Handle */}
          <View className="items-center pb-2 pt-3">
            <View className="h-1 w-10 rounded-full bg-foreground/20" />
          </View>

          {/* Header */}
          <View className="px-6 pt-2 pb-4">
            <Text
              className="text-center text-foreground/40"
              style={{
                fontSize: 13,
                fontWeight: '600',
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              Edit Profile
            </Text>
          </View>

          {/* Fields */}
          <View className="px-6">
            <Field
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
              autoCapitalize="words"
              labelColor={labelColor}
              textColor={fgRgb}
              borderColor={borderColor}
              placeholderColor={placeholderColor}
            />
            <Field
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
              autoCapitalize="words"
              labelColor={labelColor}
              textColor={fgRgb}
              borderColor={borderColor}
              placeholderColor={placeholderColor}
            />
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email"
              keyboardType="email-address"
              autoCapitalize="none"
              labelColor={labelColor}
              textColor={fgRgb}
              borderColor={borderColor}
              placeholderColor={placeholderColor}
            />
            <Field
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              labelColor={labelColor}
              textColor={fgRgb}
              borderColor={borderColor}
              placeholderColor={placeholderColor}
            />
          </View>

          {/* Save Button */}
          <View className="px-6 pb-8 pt-4">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSave}
              disabled={!hasChanges || updateProfile.isPending}
              className="items-center justify-center rounded-full bg-primary"
              style={{
                height: 43,
                opacity: hasChanges && !updateProfile.isPending ? 1 : 0.5,
              }}
            >
              <Text className="text-[14px] font-semibold text-primary-foreground">
                {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>

            {updateProfile.isError && (
              <Text className="mt-2 text-center text-[11px] text-red-500">
                {updateProfile.error?.message ?? 'Failed to save'}
              </Text>
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

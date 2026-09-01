import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/src/components/ui/back-button';

export default function ChangePasswordScreen() {
  const { user } = useUser();
  const router = useRouter();
  const { t } = useTranslation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clerkError = (err: unknown) => {
    if (err && typeof err === 'object' && 'errors' in err) {
      // @ts-expect-error Clerk error shape
      return err.errors?.[0]?.message ?? t('misc.somethingWentWrong');
    }
    return t('misc.somethingWentWrong');
  };

  const onSubmit = useCallback(async () => {
    if (!user || submitting) return;

    if (newPassword.length < 8) {
      setError(t('misc.passwordTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('misc.passwordsDoNotMatch'));
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await user.updatePassword({
        currentPassword,
        newPassword,
      });
      Alert.alert(t('misc.passwordChangedTitle'), t('misc.passwordChangedMessage'), [
        { text: t('misc.ok'), onPress: () => router.back() },
      ]);
    } catch (err) {
      setError(clerkError(err));
    } finally {
      setSubmitting(false);
    }
  }, [user, currentPassword, newPassword, confirmPassword, submitting, router]);

  return (
    <View className="flex-1 bg-[#0A261E]">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-row items-center px-5 pt-2">
          <BackButton color="rgba(255,251,242,0.6)" />
          <Text
            className="ms-3 text-[#FFFBF2]"
            style={{ fontSize: 16, fontWeight: '600' }}
          >
            {t('misc.changePassword')}
          </Text>
        </View>

        <View className="flex-1 justify-start px-6 pt-8">
          <Text
            className="mb-2 text-[#FFFBF2]/40"
            style={{ fontSize: 10, letterSpacing: 1.5 }}
          >
            {t('misc.currentPasswordLabel')}
          </Text>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder={t('misc.currentPasswordPlaceholder')}
            placeholderTextColor="rgba(255,251,242,0.25)"
            secureTextEntry
            autoComplete="current-password"
            className="mb-5 border-b border-[#FFFBF2]/20 pb-2 text-[#FFFBF2]"
            style={{ fontSize: 16 }}
          />

          <Text
            className="mb-2 text-[#FFFBF2]/40"
            style={{ fontSize: 10, letterSpacing: 1.5 }}
          >
            {t('misc.newPasswordLabel')}
          </Text>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder={t('misc.newPasswordPlaceholder')}
            placeholderTextColor="rgba(255,251,242,0.25)"
            secureTextEntry
            autoComplete="new-password"
            className="mb-5 border-b border-[#FFFBF2]/20 pb-2 text-[#FFFBF2]"
            style={{ fontSize: 16 }}
          />

          <Text
            className="mb-2 text-[#FFFBF2]/40"
            style={{ fontSize: 10, letterSpacing: 1.5 }}
          >
            {t('misc.confirmPasswordLabel')}
          </Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder={t('misc.confirmPasswordPlaceholder')}
            placeholderTextColor="rgba(255,251,242,0.25)"
            secureTextEntry
            autoComplete="new-password"
            className="mb-6 border-b border-[#FFFBF2]/20 pb-2 text-[#FFFBF2]"
            style={{ fontSize: 16 }}
          />

          {error ? (
            <Text className="mb-4 text-danger" style={{ fontSize: 13 }}>
              {error}
            </Text>
          ) : null}

          <View style={{ paddingHorizontal: 30 }}>
            <Pressable
              onPress={onSubmit}
              disabled={submitting}
              className="h-[43px] items-center justify-center rounded-full bg-[#FFFBF2] active:opacity-90 disabled:opacity-50"
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#0A261E" />
              ) : (
                <Text
                  className="text-[#0A261E]"
                  style={{ fontSize: 14, fontWeight: '600' }}
                >
                  {t('misc.updatePassword')}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

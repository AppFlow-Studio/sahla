import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChangePasswordScreen() {
  const { user } = useUser();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clerkError = (err: unknown) => {
    if (err && typeof err === 'object' && 'errors' in err) {
      // @ts-expect-error Clerk error shape
      return err.errors?.[0]?.message ?? 'Something went wrong';
    }
    return 'Something went wrong';
  };

  const onSubmit = useCallback(async () => {
    if (!user || submitting) return;

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await user.updatePassword({
        currentPassword,
        newPassword,
      });
      Alert.alert('Password Changed', 'Your password has been updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
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
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="h-6 w-6 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={20} color="rgba(255,251,242,0.6)" />
          </Pressable>
          <Text
            className="ml-3 text-[#FFFBF2]"
            style={{ fontSize: 16, fontWeight: '600' }}
          >
            Change Password
          </Text>
        </View>

        <View className="flex-1 justify-start px-6 pt-8">
          <Text
            className="mb-2 text-[#FFFBF2]/40"
            style={{ fontSize: 10, letterSpacing: 1.5 }}
          >
            CURRENT PASSWORD
          </Text>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
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
            NEW PASSWORD
          </Text>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="At least 8 characters"
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
            CONFIRM NEW PASSWORD
          </Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter new password"
            placeholderTextColor="rgba(255,251,242,0.25)"
            secureTextEntry
            autoComplete="new-password"
            className="mb-6 border-b border-[#FFFBF2]/20 pb-2 text-[#FFFBF2]"
            style={{ fontSize: 16 }}
          />

          {error ? (
            <Text className="mb-4" style={{ fontSize: 13, color: '#EF4444' }}>
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
                  Update Password
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

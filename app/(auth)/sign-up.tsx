import { useSignUp } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const masjid = useMasjidConfig();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clerkError = (err: unknown) => {
    if (err && typeof err === 'object' && 'errors' in err) {
      // @ts-expect-error Clerk error shape
      return err.errors?.[0]?.message ?? 'Something went wrong';
    }
    return 'Something went wrong';
  };

  const onCreate = useCallback(async () => {
    if (!isLoaded || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err) {
      setError(clerkError(err));
    } finally {
      setSubmitting(false);
    }
  }, [isLoaded, signUp, email, password, submitting]);

  const onVerify = useCallback(async () => {
    if (!isLoaded || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code });
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        router.replace('/');
      } else {
        setError(`Unexpected verification status: ${attempt.status}`);
      }
    } catch (err) {
      setError(clerkError(err));
    } finally {
      setSubmitting(false);
    }
  }, [isLoaded, signUp, code, setActive, router, submitting]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center px-6">
        <View className="mb-8">
          <Text className="text-3xl font-bold text-foreground">Join {masjid.displayName}</Text>
          <Text className="mt-1 text-muted-foreground">
            {pendingVerification
              ? 'Enter the 6-digit code we emailed you.'
              : 'Create an account to get started.'}
          </Text>
        </View>

        {!pendingVerification ? (
          <>
            <Text className="mb-2 text-sm font-medium text-foreground">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              className="mb-4 rounded-lg border border-border bg-background px-4 py-3 text-foreground"
            />
            <Text className="mb-2 text-sm font-medium text-foreground">Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              secureTextEntry
              autoComplete="new-password"
              className="mb-4 rounded-lg border border-border bg-background px-4 py-3 text-foreground"
            />
            {error ? <Text className="mb-3 text-red-600">{error}</Text> : null}
            <Pressable
              onPress={onCreate}
              disabled={submitting || !isLoaded}
              className="items-center justify-center rounded-lg bg-primary px-4 py-3 active:opacity-80 disabled:opacity-50"
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="font-semibold text-primary-foreground">Create account</Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <Text className="mb-2 text-sm font-medium text-foreground">Verification code</Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              keyboardType="number-pad"
              className="mb-4 rounded-lg border border-border bg-background px-4 py-3 text-foreground"
            />
            {error ? <Text className="mb-3 text-red-600">{error}</Text> : null}
            <Pressable
              onPress={onVerify}
              disabled={submitting || !isLoaded}
              className="items-center justify-center rounded-lg bg-primary px-4 py-3 active:opacity-80 disabled:opacity-50"
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="font-semibold text-primary-foreground">Verify email</Text>
              )}
            </Pressable>
          </>
        )}

        <View className="mt-6 flex-row justify-center">
          <Text className="text-muted-foreground">Already have an account? </Text>
          <Link href="/(auth)/sign-in" className="font-semibold text-primary">
            Sign in
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

import { useSignIn } from '@clerk/clerk-expo';
import { useSSO } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const masjid = useMasjidConfig();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = useCallback(async () => {
    if (!isLoaded || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const attempt = await signIn.create({ identifier: email, password });
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        router.replace('/');
      } else {
        setError(`Additional step required: ${attempt.status}`);
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'errors' in err
          ? // @ts-expect-error — Clerk's error shape
            (err.errors?.[0]?.message ?? 'Sign-in failed')
          : 'Sign-in failed';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }, [isLoaded, signIn, email, password, setActive, router, submitting]);

  const handleGoogleSSO = useCallback(async () => {
    try {
      const result = await startSSOFlow({ strategy: 'oauth_google' });
      if (result.authSessionResult?.type === 'dismiss') return;
      if (result.createdSessionId && result.setActive) {
        await result.setActive({ session: result.createdSessionId });
        router.replace('/');
      }
    } catch (err) {
      console.warn('[Auth] Google sign-in error:', err);
    }
  }, [startSSOFlow, router]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center px-6">
        <View className="mb-8">
          <Text className="text-3xl font-bold text-foreground">{masjid.displayName}</Text>
          {masjid.tagline ? (
            <Text className="mt-1 text-muted-foreground">{masjid.tagline}</Text>
          ) : null}
        </View>

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
          placeholder="••••••••"
          secureTextEntry
          autoComplete="password"
          className="mb-4 rounded-lg border border-border bg-background px-4 py-3 text-foreground"
        />

        {error ? <Text className="mb-3 text-red-600">{error}</Text> : null}

        <Pressable
          onPress={onSubmit}
          disabled={submitting || !isLoaded}
          className="items-center justify-center rounded-lg bg-primary px-4 py-3 active:opacity-80 disabled:opacity-50"
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="font-semibold text-primary-foreground">Sign in</Text>
          )}
        </Pressable>

        {Platform.OS !== 'web' && (
          <Pressable
            onPress={handleGoogleSSO}
            className="mt-3 items-center justify-center rounded-lg border border-border px-4 py-3 active:opacity-80"
          >
            <Text className="font-semibold text-foreground">Sign in with Google</Text>
          </Pressable>
        )}

        <View className="mt-6 flex-row justify-center">
          <Text className="text-muted-foreground">Don&apos;t have an account? </Text>
          <Link href="/(auth)/sign-up" className="font-semibold text-primary">
            Sign up
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

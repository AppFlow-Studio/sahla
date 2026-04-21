import { useSignIn, useSSO, useSignInWithApple } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Pattern from '@/assets/onboarding/pattern.svg';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

const SERIF = 'PlayfairDisplay_500Medium';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const router = useRouter();
  const config = useMasjidConfig();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<'apple' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = useCallback(async () => {
    if (!isLoaded || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const attempt = await signIn.create({ identifier: email, password });
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId, organization: config.clerkOrgId });
        // Guards redirect to (onboarding) or (main)
      } else {
        setError(`Additional step required: ${attempt.status}`);
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'errors' in err
          ? // @ts-expect-error Clerk error shape
            (err.errors?.[0]?.message ?? 'Sign-in failed')
          : 'Sign-in failed';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }, [isLoaded, signIn, email, password, setActive, config.clerkOrgId, submitting]);

  const handleApple = useCallback(async () => {
    setSsoLoading('apple');
    try {
      let result;
      if (Platform.OS === 'ios') {
        result = await startAppleAuthenticationFlow();
      } else {
        result = await startSSOFlow({ strategy: 'oauth_apple' });
      }
      if (result.createdSessionId && result.setActive) {
        await result.setActive({ session: result.createdSessionId, organization: config.clerkOrgId });
      }
    } catch (err: any) {
      if (err?.code === 'ERR_REQUEST_CANCELED') return;
      console.warn('[Auth] Apple sign-in error:', err);
    } finally {
      setSsoLoading(null);
    }
  }, [startAppleAuthenticationFlow, startSSOFlow, config.clerkOrgId]);

  const handleGoogle = useCallback(async () => {
    setSsoLoading('google');
    try {
      const result = await startSSOFlow({ strategy: 'oauth_google' });
      if (result.authSessionResult?.type === 'dismiss') return;
      if (result.createdSessionId && result.setActive) {
        await result.setActive({ session: result.createdSessionId, organization: config.clerkOrgId });
      }
    } catch (err) {
      console.warn('[Auth] Google sign-in error:', err);
    } finally {
      setSsoLoading(null);
    }
  }, [startSSOFlow, config.clerkOrgId]);

  const surfaceHex = `rgb(${config.colors.onboardingSurface.replace(/ /g, ',')})`;

  return (
    <View className="flex-1 bg-onboarding-bg">
      <View pointerEvents="none" className="absolute inset-x-0 top-0" style={{ height: '30%' }}>
        <Pattern width="100%" height="100%" preserveAspectRatio="xMidYMin slice" />
      </View>

      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-row items-center px-5 pt-2">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="h-6 w-6 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={20} color="rgba(255,251,242,0.6)" />
          </Pressable>
        </View>

        <View className="flex-1 justify-center px-6">
          <Text
            className="text-onboarding-surface"
            style={{ fontFamily: SERIF, fontSize: 30, fontWeight: '500', marginBottom: 8 }}
          >
            Welcome back
          </Text>
          <Text className="text-onboarding-accent mb-8" style={{ fontSize: 12 }}>
            {config.displayName}
          </Text>

          <Text
            className="text-onboarding-surface/40 mb-2"
            style={{ fontSize: 10, letterSpacing: 1.5 }}
          >
            EMAIL
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="rgba(255,251,242,0.25)"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            className="border-onboarding-surface/20 text-onboarding-surface mb-5 border-b pb-2"
            style={{ fontSize: 16 }}
          />
          <Text
            className="text-onboarding-surface/40 mb-2"
            style={{ fontSize: 10, letterSpacing: 1.5 }}
          >
            PASSWORD
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            placeholderTextColor="rgba(255,251,242,0.25)"
            secureTextEntry
            autoComplete="password"
            className="border-onboarding-surface/20 text-onboarding-surface mb-6 border-b pb-2"
            style={{ fontSize: 16 }}
          />

          {error ? (
            <Text className="mb-4" style={{ fontSize: 13, color: '#EF4444' }}>
              {error}
            </Text>
          ) : null}

          <View style={{ paddingHorizontal: 30, gap: 12 }}>
            <Pressable
              onPress={onSubmit}
              disabled={submitting || !isLoaded}
              className="h-[43px] items-center justify-center rounded-full bg-onboarding-surface active:opacity-90 disabled:opacity-50"
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#0A261E" />
              ) : (
                <Text className="text-onboarding-bg" style={{ fontSize: 14, fontWeight: '600' }}>
                  Sign in
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={handleApple}
              disabled={!!ssoLoading}
              className="h-[43px] flex-row items-center justify-center rounded-full bg-onboarding-surface/5 active:opacity-80"
              style={{ gap: 8 }}
            >
              {ssoLoading === 'apple' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={14} color={surfaceHex} />
                  <Text className="text-onboarding-surface" style={{ fontSize: 14, fontWeight: '500' }}>
                    Continue with Apple
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={handleGoogle}
              disabled={!!ssoLoading}
              className="h-[43px] flex-row items-center justify-center rounded-full bg-onboarding-surface/5 active:opacity-80"
              style={{ gap: 8 }}
            >
              {ssoLoading === 'google' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={12} color={surfaceHex} />
                  <Text className="text-onboarding-surface" style={{ fontSize: 14, fontWeight: '500' }}>
                    Continue with Google
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          <View className="mt-6 flex-row justify-center">
            <Text className="text-onboarding-surface/50" style={{ fontSize: 12 }}>
              Don&apos;t have an account?{' '}
            </Text>
            <Link
              href="/(auth)/create-account"
              className="text-onboarding-accent"
              style={{ fontSize: 12, fontWeight: '500' }}
            >
              Sign up
            </Link>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

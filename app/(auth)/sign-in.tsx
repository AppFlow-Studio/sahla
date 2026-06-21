import { useClerk, useSignIn, useSSO, useSignInWithApple } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { Icon } from '@/src/components/ui/icon';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';

import Pattern from '@/assets/onboarding/pattern.svg';
import { useFontFamily } from '@/src/hooks/use-font-family';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { joinOrgDirect } from '@/src/lib/join-org-direct';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const clerk = useClerk();
  const router = useRouter();
  const config = useMasjidConfig();
  const fonts = useFontFamily();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<'apple' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const joinAndActivateOrg = useCallback(
    async (userId: string) => {
      const orgId = config.clerkOrgId;
      if (!orgId) return;
      const result = await joinOrgDirect(userId, orgId);
      if (result === 'error') {
        setError('Failed to join organization. Please try again.');
        return;
      }
      await clerk.setActive({ organization: orgId });
    },
    [clerk, config.clerkOrgId],
  );

  const onSubmit = useCallback(async () => {
    if (!isLoaded || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const attempt = await signIn.create({ identifier: email, password });
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        // clerk.user is not available synchronously after setActive;
        // wait for the session to propagate then join org.
        setTimeout(async () => {
          const userId = clerk.user?.id;
          if (userId) await joinAndActivateOrg(userId);
        }, 500);
      } else if (attempt.status === 'needs_second_factor') {
        router.push('/(auth)/two-factor');
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
  }, [isLoaded, signIn, email, password, setActive, submitting, joinAndActivateOrg, clerk, router]);

  const activateOAuthSession = useCallback(
    async (result: any) => {
      const { createdSessionId, setActive: setActiveOAuth, signIn: oauthSignIn, signUp } = result;

      console.log('[Auth] OAuth result:', JSON.stringify({
        createdSessionId,
        signUpStatus: signUp?.status,
        signUpSessionId: signUp?.createdSessionId,
        signInStatus: oauthSignIn?.status,
        signInSessionId: oauthSignIn?.createdSessionId,
        externalAccountStatus: signUp?.verifications?.externalAccount?.status,
      }, null, 2));

      let sessionId =
        createdSessionId ??
        signUp?.createdSessionId ??
        oauthSignIn?.createdSessionId ??
        null;

      // Handle transfer: Clerk created both signUp + signIn
      if (!sessionId && oauthSignIn) {
        try {
          console.log('[Auth] No session yet, attempting sign-in transfer.');
          const transfer = await oauthSignIn.create({ transfer: true });
          sessionId = transfer.createdSessionId;
        } catch (transferErr) {
          console.warn('[Auth] Transfer failed:', transferErr);
        }
      }

      // Handle sign-up with missing_requirements — fill missing fields from OAuth profile
      if (!sessionId && signUp && signUp.status === 'missing_requirements') {
        try {
          const missing = signUp.missingFields || [];
          console.log('[Auth] Sign-up missing fields:', missing);

          const ext = signUp.verifications?.externalAccount;
          const firstName = signUp.firstName || ext?.firstName || 'User';
          const lastName = signUp.lastName || ext?.lastName || '';

          const updates: Record<string, string> = {};
          if (missing.includes('first_name') || missing.includes('last_name')) {
            updates.firstName = firstName;
            updates.lastName = lastName;
          }
          if (missing.includes('username')) {
            updates.username = `user_${Date.now()}`;
          }

          if (Object.keys(updates).length > 0) {
            console.log('[Auth] Updating sign-up with:', updates);
            const updated = await signUp.update(updates);
            sessionId = updated.createdSessionId;
          }

          if (!sessionId) {
            await signUp.reload();
            sessionId = signUp.createdSessionId;
          }
        } catch (updateErr) {
          console.warn('[Auth] Sign-up update failed:', updateErr);
        }
      }

      if (!sessionId || !setActiveOAuth) {
        console.warn('[Auth] OAuth flow did not produce a session.');
        setError('Sign-in could not be completed. Please try again.');
        return;
      }

      await setActiveOAuth({ session: sessionId });
      setTimeout(async () => {
        const userId = clerk.user?.id;
        if (userId) await joinAndActivateOrg(userId);
      }, 500);
    },
    [clerk, joinAndActivateOrg],
  );

  const handleApple = useCallback(async () => {
    setSsoLoading('apple');
    try {
      let result;
      if (Platform.OS === 'ios') {
        result = await startAppleAuthenticationFlow();
      } else {
        result = await startSSOFlow({ strategy: 'oauth_apple', redirectUrl: Linking.createURL('/') });
        if (result.authSessionResult?.type === 'dismiss') return;
      }
      await activateOAuthSession(result);
    } catch (err: any) {
      if (err?.code === 'ERR_REQUEST_CANCELED') return;
      console.error('[Auth] Apple error:', err);
    } finally {
      setSsoLoading(null);
    }
  }, [startAppleAuthenticationFlow, startSSOFlow, activateOAuthSession]);

  const handleGoogle = useCallback(async () => {
    setSsoLoading('google');
    try {
      const result = await startSSOFlow({ strategy: 'oauth_google', redirectUrl: Linking.createURL('/') });
      if (result.authSessionResult?.type === 'dismiss') return;
      await activateOAuthSession(result);
    } catch (err) {
      console.error('[Auth] Google error:', err);
    } finally {
      setSsoLoading(null);
    }
  }, [startSSOFlow, activateOAuthSession]);

  const surface = config.colors.onboardingSurface.replace(/ /g, ',');
  const surfaceHex = `rgb(${surface})`;
  const surfaceAlpha60 = `rgba(${surface}, 0.6)`;
  const surfaceAlpha25 = `rgba(${surface}, 0.25)`;
  const bgHex = `rgb(${config.colors.onboardingBackground.replace(/ /g, ',')})`;

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
            <Icon name="arrow-back" size={20} color={surfaceAlpha60} />
          </Pressable>
        </View>

        <View className="flex-1 justify-center px-6">
          <Text
            className="text-onboarding-surface"
            style={{ fontFamily: fonts.display, fontSize: 30, fontWeight: '500', marginBottom: 8 }}
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
            placeholderTextColor={surfaceAlpha25}
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
            placeholderTextColor={surfaceAlpha25}
            secureTextEntry
            autoComplete="password"
            className="border-onboarding-surface/20 text-onboarding-surface mb-2 border-b pb-2"
            style={{ fontSize: 16 }}
          />
          <Link
            href="/(auth)/forgot-password"
            className="text-onboarding-accent mb-4 self-end"
            style={{ fontSize: 11, fontWeight: '500' }}
          >
            Forgot password?
          </Link>

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
                <ActivityIndicator size="small" color={bgHex} />
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
                <ActivityIndicator size="small" color={surfaceHex} />
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
                <ActivityIndicator size="small" color={surfaceHex} />
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

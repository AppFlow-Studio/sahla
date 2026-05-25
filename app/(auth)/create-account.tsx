import { useAuth, useClerk, useSignInWithApple } from '@clerk/clerk-expo';
import { useSSO } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import Pattern from '@/assets/onboarding/pattern.svg';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { joinOrgDirect } from '@/src/lib/join-org-direct';

const SERIF = 'PlayfairDisplay_500Medium';

// Warm up the browser on Android for faster OAuth redirects.
if (Platform.OS === 'android') {
  WebBrowser.warmUpAsync();
}

type AuthButtonProps = {
  label: string;
  variant: 'primary' | 'secondary';
  icon?: React.ReactNode;
  onPress: () => void;
  loading?: boolean;
};

function AuthButton({ label, variant, icon, onPress, loading }: AuthButtonProps) {
  const { colors } = useMasjidConfig();
  const bgColor = `rgb(${colors.onboardingBackground.replace(/ /g, ',')})`;
  const surfaceColor = `rgb(${colors.onboardingSurface.replace(/ /g, ',')})`;
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className={[
        'h-10 flex-row items-center justify-center rounded-full active:opacity-80',
        isPrimary ? 'bg-onboarding-surface' : 'bg-onboarding-surface/5',
        loading ? 'opacity-60' : '',
      ].join(' ')}
      style={{ gap: 8 }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isPrimary ? bgColor : surfaceColor} />
      ) : (
        <>
          {icon}
          <Text
            className={isPrimary ? 'text-onboarding-bg' : 'text-onboarding-surface'}
            style={{ fontSize: 14, fontWeight: '500' }}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export default function CreateAccountScreen() {
  const router = useRouter();
  const { isSignedIn, signOut } = useAuth();
  const clerk = useClerk();
  const config = useMasjidConfig();
  const bgHex = `rgb(${config.colors.onboardingBackground.replace(/ /g, ',')})`;
  const surfaceHex = `rgb(${config.colors.onboardingSurface.replace(/ /g, ',')})`;

  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const { startSSOFlow } = useSSO();
  const [loading, setLoading] = useState<'apple' | 'google' | null>(null);
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

  const activateOAuthSession = useCallback(
    async (result: any) => {
      const { createdSessionId, setActive, signIn, signUp } = result;

      const sessionId =
        createdSessionId ??
        (signUp?.status === 'complete' ? signUp.createdSessionId : null) ??
        (signIn?.status === 'complete' ? signIn.createdSessionId : null);

      if (!sessionId || !setActive) {
        console.warn('[Auth] OAuth flow did not produce a session.');
        return;
      }

      await setActive({ session: sessionId });
      const userId = clerk.user?.id;
      if (userId) await joinAndActivateOrg(userId);
    },
    [clerk, joinAndActivateOrg],
  );

  const handleApple = useCallback(async () => {
    console.log('[Auth] handleApple pressed');
    if (isSignedIn) await signOut().catch(() => {});
    setLoading('apple');
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
      setLoading(null);
    }
  }, [isSignedIn, signOut, startAppleAuthenticationFlow, startSSOFlow, activateOAuthSession]);

  const handleGoogle = useCallback(async () => {
    console.log('[Auth] handleGoogle pressed');
    if (isSignedIn) await signOut().catch(() => {});
    setLoading('google');
    try {
      const result = await startSSOFlow({ strategy: 'oauth_google', redirectUrl: Linking.createURL('/') });
      if (result.authSessionResult?.type === 'dismiss') return;
      await activateOAuthSession(result);
    } catch (err) {
      console.error('[Auth] Google error:', err);
    } finally {
      setLoading(null);
    }
  }, [isSignedIn, signOut, startSSOFlow, activateOAuthSession]);

  const handleEmail = useCallback(() => {
    router.push('/(auth)/sign-up');
  }, [router]);

  return (
    <View className="flex-1 bg-onboarding-bg">
      <View
        pointerEvents="none"
        className="absolute inset-x-0 top-0"
        style={{ height: '30%' }}
      >
        <Pattern width="100%" height="100%" preserveAspectRatio="xMidYMin slice" />
      </View>
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-1 justify-center" style={{ paddingHorizontal: 55 }}>
          <Text
            className="text-onboarding-surface"
            style={{
              fontFamily: SERIF,
              fontSize: 30,
              fontWeight: '500',
              textAlign: 'center',
              marginBottom: 36,
            }}
          >
            Create Account
          </Text>

          {error ? (
            <Text className="mb-4 text-center" style={{ fontSize: 13, color: '#EF4444' }}>
              {error}
            </Text>
          ) : null}

          <View style={{ gap: 16 }}>
            <AuthButton
              label="Continue with Apple"
              variant="primary"
              icon={<Ionicons name="logo-apple" size={14} color={bgHex} />}
              onPress={handleApple}
              loading={loading === 'apple'}
            />
            <AuthButton
              label="Continue with Google ID"
              variant="secondary"
              icon={<Ionicons name="logo-google" size={12} color={surfaceHex} />}
              onPress={handleGoogle}
              loading={loading === 'google'}
            />
            <AuthButton
              label="Continue with Email"
              variant="secondary"
              onPress={handleEmail}
            />
          </View>

          <View className="mt-8 items-center">
            <Text className="text-onboarding-surface/20" style={{ fontSize: 10 }}>
              By continuing you agree to our Terms of Service & privacy policy
            </Text>
            <View className="mt-1.5 flex-row">
              <Text className="text-onboarding-surface/60" style={{ fontSize: 10 }}>
                Already have an account?{' '}
              </Text>
              <Link
                href="/(auth)/sign-in"
                className="text-onboarding-accent"
                style={{ fontSize: 10, fontWeight: '500' }}
              >
                Sign in
              </Link>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

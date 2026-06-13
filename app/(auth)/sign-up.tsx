import { useClerk, useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Icon } from '@/src/components/ui/icon';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Pattern from '@/assets/onboarding/pattern.svg';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { joinOrgDirect } from '@/src/lib/join-org-direct';

const SERIF = 'PlayfairDisplay_500Medium';

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const clerk = useClerk();
  const router = useRouter();
  const config = useMasjidConfig();
  const surface = config.colors.onboardingSurface.replace(/ /g, ',');
  const surfaceAlpha60 = `rgba(${surface}, 0.6)`;
  const surfaceAlpha25 = `rgba(${surface}, 0.25)`;
  const bgHex = `rgb(${config.colors.onboardingBackground.replace(/ /g, ',')})`;

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
      console.log('[SignUp] creating with:', email);
      const created = await signUp.create({ emailAddress: email, password });
      console.log('[SignUp] create result status:', created.status);
      if (created.status === 'missing_requirements') {
        await created.prepareEmailAddressVerification({ strategy: 'email_code' });
        setPendingVerification(true);
      } else if (created.status === 'complete') {
        await setActive({ session: created.createdSessionId });
        const userId = clerk.user?.id;
        if (userId) await joinAndActivateOrg(userId);
      } else {
        setError(`Unexpected status: ${created.status}`);
      }
    } catch (err: any) {
      console.error('[SignUp] full error:', JSON.stringify(err?.errors ?? err, null, 2));
      setError(clerkError(err));
    } finally {
      setSubmitting(false);
    }
  }, [isLoaded, signUp, email, password, submitting]);

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

  const onVerify = useCallback(async () => {
    if (!isLoaded || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code });
      if (attempt.status === 'complete' || attempt.createdSessionId) {
        await setActive({ session: attempt.createdSessionId });
        const userId = clerk.user?.id;
        if (userId) await joinAndActivateOrg(userId);
      } else {
        setError(`Unexpected verification status: ${attempt.status}`);
      }
    } catch (err) {
      setError(clerkError(err));
    } finally {
      setSubmitting(false);
    }
  }, [isLoaded, signUp, code, setActive, submitting, joinAndActivateOrg, clerk]);

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
            style={{
              fontFamily: SERIF,
              fontSize: 30,
              fontWeight: '500',
              marginBottom: 32,
            }}
          >
            {pendingVerification ? 'Verify your\nemail' : 'Create your\naccount'}
          </Text>

          {!pendingVerification ? (
            <>
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
                placeholder="At least 8 characters"
                placeholderTextColor={surfaceAlpha25}
                secureTextEntry
                autoComplete="new-password"
                className="border-onboarding-surface/20 text-onboarding-surface mb-6 border-b pb-2"
                style={{ fontSize: 16 }}
              />
            </>
          ) : (
            <>
              <Text className="text-onboarding-surface/80 mb-6" style={{ fontSize: 11 }}>
                Enter the 6-digit code we sent to {email}
              </Text>
              <Text
                className="text-onboarding-surface/40 mb-2"
                style={{ fontSize: 10, letterSpacing: 1.5 }}
              >
                VERIFICATION CODE
              </Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                placeholderTextColor={surfaceAlpha25}
                keyboardType="number-pad"
                className="border-onboarding-surface/20 text-onboarding-surface mb-6 border-b pb-2"
                style={{ fontSize: 24, letterSpacing: 8 }}
              />
            </>
          )}

          {error ? (
            <Text className="mb-4" style={{ fontSize: 13, color: '#EF4444' }}>
              {error}
            </Text>
          ) : null}

          <View style={{ paddingHorizontal: 30 }}>
            <Pressable
              onPress={pendingVerification ? onVerify : onCreate}
              disabled={submitting || !isLoaded}
              className="h-[43px] items-center justify-center rounded-full bg-onboarding-surface active:opacity-90 disabled:opacity-50"
            >
              {submitting ? (
                <ActivityIndicator size="small" color={bgHex} />
              ) : (
                <Text
                  className="text-onboarding-bg"
                  style={{ fontSize: 14, fontWeight: '600' }}
                >
                  {pendingVerification ? 'Verify email' : 'Create account'}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

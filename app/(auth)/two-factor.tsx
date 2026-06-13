import { useClerk, useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Icon } from '@/src/components/ui/icon';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { joinOrgDirect } from '@/src/lib/join-org-direct';

const SERIF = 'PlayfairDisplay_500Medium';

export default function TwoFactorScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const clerk = useClerk();
  const router = useRouter();
  const config = useMasjidConfig();
  const surface = config.colors.onboardingSurface.replace(/ /g, ',');
  const surfaceAlpha60 = `rgba(${surface}, 0.6)`;
  const surfaceAlpha25 = `rgba(${surface}, 0.25)`;
  const bgHex = `rgb(${config.colors.onboardingBackground.replace(/ /g, ',')})`;

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [resending, setResending] = useState(false);
  const prepared = useRef(false);

  // Send email verification code on mount
  useEffect(() => {
    if (!isLoaded || !signIn || prepared.current) return;
    prepared.current = true;

    signIn
      .prepareSecondFactor({ strategy: 'email_code' } as any)
      .then(() => setCodeSent(true))
      .catch((err: any) => {
        const msg = err?.errors?.[0]?.message ?? 'Failed to send verification email';
        setError(msg);
      });
  }, [isLoaded, signIn]);

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
    if (!isLoaded || !signIn || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const attempt = await signIn.attemptSecondFactor({
        strategy: 'email_code',
        code,
      } as any);

      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        const userId = clerk.user?.id;
        if (userId) await joinAndActivateOrg(userId);
      } else {
        setError(`Unexpected status: ${attempt.status}`);
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'errors' in err
          ? // @ts-expect-error Clerk error shape
            (err.errors?.[0]?.message ?? 'Verification failed')
          : 'Verification failed';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }, [isLoaded, signIn, code, submitting, setActive, joinAndActivateOrg, clerk]);

  const resendCode = useCallback(async () => {
    if (!isLoaded || !signIn || resending) return;
    setResending(true);
    setError(null);
    try {
      await signIn.prepareSecondFactor({ strategy: 'email_code' } as any);
      setCodeSent(true);
    } catch (err: any) {
      const msg = err?.errors?.[0]?.message ?? 'Failed to resend code';
      setError(msg);
    } finally {
      setResending(false);
    }
  }, [isLoaded, signIn, resending]);

  return (
    <View className="flex-1 bg-onboarding-bg">
      <View pointerEvents="none" className="absolute inset-x-0 top-0 bg-onboarding-bg/80" style={{ height: '30%' }} />

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
            style={{ fontFamily: SERIF, fontSize: 30, fontWeight: '500', marginBottom: 8 }}
          >
            Check your email
          </Text>
          <Text className="text-onboarding-surface/60 mb-8" style={{ fontSize: 13 }}>
            {codeSent
              ? 'We sent a verification code to your email. Enter it below to sign in.'
              : 'Sending verification code...'}
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
            placeholder="000000"
            placeholderTextColor={surfaceAlpha25}
            autoCapitalize="none"
            autoComplete="one-time-code"
            keyboardType="number-pad"
            className="border-onboarding-surface/20 text-onboarding-surface mb-2 border-b pb-2"
            style={{ fontSize: 22, letterSpacing: 8 }}
            maxLength={6}
            autoFocus
          />

          <Pressable onPress={resendCode} disabled={resending} className="mb-4 self-end">
            <Text className="text-onboarding-accent" style={{ fontSize: 11, fontWeight: '500' }}>
              {resending ? 'Sending...' : 'Resend code'}
            </Text>
          </Pressable>

          {error ? (
            <Text className="mb-4" style={{ fontSize: 13, color: '#EF4444' }}>
              {error}
            </Text>
          ) : null}

          <View style={{ paddingHorizontal: 30, gap: 12 }}>
            <Pressable
              onPress={onSubmit}
              disabled={submitting || !isLoaded || !code}
              className="h-[43px] items-center justify-center rounded-full bg-onboarding-surface active:opacity-90 disabled:opacity-50"
            >
              {submitting ? (
                <ActivityIndicator size="small" color={bgHex} />
              ) : (
                <Text className="text-onboarding-bg" style={{ fontSize: 14, fontWeight: '600' }}>
                  Verify
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

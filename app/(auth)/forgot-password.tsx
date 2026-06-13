import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Icon } from '@/src/components/ui/icon';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Pattern from '@/assets/onboarding/pattern.svg';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

const SERIF = 'PlayfairDisplay_500Medium';

type Step = 'email' | 'code' | 'new-password';

export default function ForgotPasswordScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const config = useMasjidConfig();
  const surface = config.colors.onboardingSurface.replace(/ /g, ',');
  const surfaceAlpha60 = `rgba(${surface}, 0.6)`;
  const surfaceAlpha25 = `rgba(${surface}, 0.25)`;
  const bgHex = `rgb(${config.colors.onboardingBackground.replace(/ /g, ',')})`;

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clerkError = (err: unknown) => {
    if (err && typeof err === 'object' && 'errors' in err) {
      // @ts-expect-error Clerk error shape
      return err.errors?.[0]?.message ?? 'Something went wrong';
    }
    return 'Something went wrong';
  };

  const onSendCode = useCallback(async () => {
    if (!isLoaded || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      setStep('code');
    } catch (err) {
      setError(clerkError(err));
    } finally {
      setSubmitting(false);
    }
  }, [isLoaded, signIn, email, submitting]);

  const onVerifyCode = useCallback(async () => {
    if (!isLoaded || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const attempt = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
      });
      if (attempt.status === 'needs_new_password') {
        setStep('new-password');
      } else {
        setError(`Unexpected status: ${attempt.status}`);
      }
    } catch (err) {
      setError(clerkError(err));
    } finally {
      setSubmitting(false);
    }
  }, [isLoaded, signIn, code, submitting]);

  const onResetPassword = useCallback(async () => {
    if (!isLoaded || submitting) return;
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await signIn.resetPassword({ password });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(auth)/sign-in');
      } else {
        setError(`Unexpected status: ${result.status}`);
      }
    } catch (err) {
      setError(clerkError(err));
    } finally {
      setSubmitting(false);
    }
  }, [isLoaded, signIn, password, setActive, submitting, router]);

  const titles: Record<Step, string> = {
    email: 'Reset your\npassword',
    code: 'Check your\nemail',
    'new-password': 'Set a new\npassword',
  };

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
            {titles[step]}
          </Text>

          {step === 'email' && (
            <>
              <Text className="text-onboarding-surface/80 mb-6" style={{ fontSize: 11 }}>
                Enter your email and we&apos;ll send you a reset code.
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
                className="border-onboarding-surface/20 text-onboarding-surface mb-6 border-b pb-2"
                style={{ fontSize: 16 }}
              />
            </>
          )}

          {step === 'code' && (
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

          {step === 'new-password' && (
            <>
              <Text className="text-onboarding-surface/80 mb-6" style={{ fontSize: 11 }}>
                Choose a new password (at least 8 characters).
              </Text>
              <Text
                className="text-onboarding-surface/40 mb-2"
                style={{ fontSize: 10, letterSpacing: 1.5 }}
              >
                NEW PASSWORD
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
          )}

          {error ? (
            <Text className="mb-4" style={{ fontSize: 13, color: '#EF4444' }}>
              {error}
            </Text>
          ) : null}

          <View style={{ paddingHorizontal: 30 }}>
            <Pressable
              onPress={
                step === 'email'
                  ? onSendCode
                  : step === 'code'
                    ? onVerifyCode
                    : onResetPassword
              }
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
                  {step === 'email'
                    ? 'Send reset code'
                    : step === 'code'
                      ? 'Verify code'
                      : 'Reset password'}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

import { useClerk, useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingPattern } from '@/src/components/onboarding/onboarding-pattern';
import { useFontFamily } from '@/src/hooks/use-font-family';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { checkMasjidMembership } from '@/src/lib/check-masjid-membership';
import { joinOrgDirect } from '@/src/lib/join-org-direct';
import { BackButton } from '@/src/components/ui/back-button';
import { useAutoStatusBarStyle } from '@/src/hooks/use-status-bar-style';

type Step = 'email' | 'code' | 'new-password';

/**
 * `clerk.user` is not populated synchronously after `setActive` — the session
 * has to propagate first. Poll briefly rather than guessing a fixed delay.
 */
async function resolveUserId(
  clerk: ReturnType<typeof useClerk>,
  timeoutMs = 3000,
): Promise<string | undefined> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const id = clerk.user?.id;
    if (id) return id;
    await new Promise((r) => setTimeout(r, 100));
  }
  return undefined;
}

export default function ForgotPasswordScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const clerk = useClerk();
  const router = useRouter();
  const { t } = useTranslation();
  const config = useMasjidConfig();
  const fonts = useFontFamily();
  useAutoStatusBarStyle(config.colors.onboardingBackground);
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
      return err.errors?.[0]?.message ?? t('auth.somethingWentWrong');
    }
    return t('auth.somethingWentWrong');
  };

  const onSendCode = useCallback(async () => {
    if (!isLoaded || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      // Clerk would happily reset the password of an account that belongs to a
      // DIFFERENT masjid — one Clerk instance backs every masjid app. Resetting
      // it would sign the person into a tenant they aren't a member of, so stop
      // before a code is ever sent and point them at sign-up instead.
      if (config.clerkOrgId) {
        const isMember = await checkMasjidMembership(config.clerkOrgId, { email });
        if (!isMember) {
          setError(t('auth.noAccountAtMasjid', { masjid: config.displayName }));
          return;
        }
      }

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
  }, [isLoaded, signIn, email, submitting, config.clerkOrgId, config.displayName, t]);

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
        setError(t('auth.unexpectedStatus', { status: attempt.status }));
      }
    } catch (err) {
      setError(clerkError(err));
    } finally {
      setSubmitting(false);
    }
  }, [isLoaded, signIn, code, submitting, t]);

  const onResetPassword = useCallback(async () => {
    if (!isLoaded || submitting) return;
    if (password.length < 8) {
      setError(t('auth.passwordMinLength'));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await signIn.resetPassword({ password });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        // Parity with sign-in / sign-up / two-factor: the session needs the
        // masjid org active or its JWT carries no `org_id` claim, and every
        // tenant-scoped RLS write (personalization included) is rejected.
        const orgId = config.clerkOrgId;
        const userId = await resolveUserId(clerk);
        if (orgId && userId) {
          await joinOrgDirect(userId, orgId);
          await clerk.setActive({ organization: orgId });
        }
        router.replace('/(auth)/sign-in');
      } else {
        setError(t('auth.unexpectedStatus', { status: result.status }));
      }
    } catch (err) {
      setError(clerkError(err));
    } finally {
      setSubmitting(false);
    }
  }, [isLoaded, signIn, password, setActive, submitting, router, clerk, config.clerkOrgId, t]);

  const titles: Record<Step, string> = {
    email: t('auth.resetTitle'),
    code: t('auth.checkEmailTitle'),
    'new-password': t('auth.setNewPasswordTitle'),
  };

  return (
    <View className="flex-1 bg-onboarding-bg">
      <View pointerEvents="none" className="absolute inset-x-0 top-0" style={{ height: '30%' }}>
        <OnboardingPattern />
      </View>

      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-row items-center px-5 pt-2">
          <BackButton color={surfaceAlpha60} style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }} />
        </View>

        <View className="flex-1 justify-center px-6">
          <Text
            className="text-onboarding-surface"
            style={{
              fontFamily: fonts.display,
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
                {t('auth.resetEmailHint')}
              </Text>
              <Text
                className="text-onboarding-surface/40 mb-2"
                style={{ fontSize: 10, letterSpacing: 1.5 }}
              >
                {t('auth.email')}
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={t('auth.emailPlaceholder')}
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
                {t('auth.enterCodeSentTo', { email })}
              </Text>
              <Text
                className="text-onboarding-surface/40 mb-2"
                style={{ fontSize: 10, letterSpacing: 1.5 }}
              >
                {t('auth.verificationCode')}
              </Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder={t('auth.codePlaceholder')}
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
                {t('auth.newPasswordHint')}
              </Text>
              <Text
                className="text-onboarding-surface/40 mb-2"
                style={{ fontSize: 10, letterSpacing: 1.5 }}
              >
                {t('auth.newPassword')}
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={t('auth.passwordPlaceholderMin')}
                placeholderTextColor={surfaceAlpha25}
                secureTextEntry
                autoComplete="new-password"
                className="border-onboarding-surface/20 text-onboarding-surface mb-6 border-b pb-2"
                style={{ fontSize: 16 }}
              />
            </>
          )}

          {error ? (
            <Text className="mb-4 text-danger" style={{ fontSize: 13 }}>
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
                    ? t('auth.sendResetCode')
                    : step === 'code'
                      ? t('auth.verifyCode')
                      : t('auth.resetPassword')}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

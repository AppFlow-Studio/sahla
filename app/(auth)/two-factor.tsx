import { useClerk, useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Icon } from '@/src/components/ui/icon';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFontFamily } from '@/src/hooks/use-font-family';
import { useIsRTL } from '@/src/hooks/use-is-rtl';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useAutoStatusBarStyle } from '@/src/hooks/use-status-bar-style';
import { joinOrgDirect } from '@/src/lib/join-org-direct';

export default function TwoFactorScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const clerk = useClerk();
  const router = useRouter();
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const config = useMasjidConfig();
  const fonts = useFontFamily();
  useAutoStatusBarStyle(config.colors.onboardingBackground);
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
        const msg = err?.errors?.[0]?.message ?? t('auth.failedToSendEmail');
        setError(msg);
      });
  }, [isLoaded, signIn, t]);

  const joinAndActivateOrg = useCallback(
    async (userId: string) => {
      const orgId = config.clerkOrgId;
      if (!orgId) return;
      const result = await joinOrgDirect(userId, orgId);
      if (result === 'error') {
        setError(t('auth.joinOrgFailed'));
        return;
      }
      await clerk.setActive({ organization: orgId });
    },
    [clerk, config.clerkOrgId, t],
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
        setError(t('auth.unexpectedStatus', { status: attempt.status }));
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'errors' in err
          ? // @ts-expect-error Clerk error shape
            (err.errors?.[0]?.message ?? t('auth.verificationFailed'))
          : t('auth.verificationFailed');
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }, [isLoaded, signIn, code, submitting, setActive, joinAndActivateOrg, clerk, t]);

  const resendCode = useCallback(async () => {
    if (!isLoaded || !signIn || resending) return;
    setResending(true);
    setError(null);
    try {
      await signIn.prepareSecondFactor({ strategy: 'email_code' } as any);
      setCodeSent(true);
    } catch (err: any) {
      const msg = err?.errors?.[0]?.message ?? t('auth.failedToResendCode');
      setError(msg);
    } finally {
      setResending(false);
    }
  }, [isLoaded, signIn, resending, t]);

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
            <Icon
              name="arrow-back"
              size={20}
              color={surfaceAlpha60}
              style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
            />
          </Pressable>
        </View>

        <View className="flex-1 justify-center px-6">
          <Text
            className="text-onboarding-surface"
            style={{ fontFamily: fonts.display, fontSize: 30, fontWeight: '500', marginBottom: 8 }}
          >
            {t('auth.checkEmailHeading')}
          </Text>
          <Text className="text-onboarding-surface/60 mb-8" style={{ fontSize: 13 }}>
            {codeSent ? t('auth.codeSentBody') : t('auth.sendingCode')}
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
            placeholder={t('auth.codePlaceholderZeros')}
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
              {resending ? t('auth.sending') : t('auth.resendCode')}
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
                  {t('auth.verify')}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

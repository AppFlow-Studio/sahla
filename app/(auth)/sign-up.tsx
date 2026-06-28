import { useClerk, useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Icon } from '@/src/components/ui/icon';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Pattern from '@/assets/onboarding/pattern.svg';
import { useFontFamily } from '@/src/hooks/use-font-family';
import { useIsRTL } from '@/src/hooks/use-is-rtl';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { joinOrgDirect } from '@/src/lib/join-org-direct';

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const clerk = useClerk();
  const router = useRouter();
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const config = useMasjidConfig();
  const fonts = useFontFamily();
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
      return err.errors?.[0]?.message ?? t('auth.somethingWentWrong');
    }
    return t('auth.somethingWentWrong');
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
        setError(t('auth.unexpectedStatus', { status: created.status }));
      }
    } catch (err: any) {
      console.error('[SignUp] full error:', JSON.stringify(err?.errors ?? err, null, 2));
      setError(clerkError(err));
    } finally {
      setSubmitting(false);
    }
  }, [isLoaded, signUp, email, password, submitting, t]);

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
        setError(t('auth.unexpectedVerificationStatus', { status: attempt.status }));
      }
    } catch (err) {
      setError(clerkError(err));
    } finally {
      setSubmitting(false);
    }
  }, [isLoaded, signUp, code, setActive, submitting, joinAndActivateOrg, clerk, t]);

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
            style={{
              fontFamily: fonts.display,
              fontSize: 30,
              fontWeight: '500',
              marginBottom: 32,
            }}
          >
            {pendingVerification ? t('auth.verifyEmailTitle') : t('auth.createTitle')}
          </Text>

          {!pendingVerification ? (
            <>
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
                className="border-onboarding-surface/20 text-onboarding-surface mb-5 border-b pb-2"
                style={{ fontSize: 16 }}
              />
              <Text
                className="text-onboarding-surface/40 mb-2"
                style={{ fontSize: 10, letterSpacing: 1.5 }}
              >
                {t('auth.password')}
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
          ) : (
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
                  {pendingVerification ? t('auth.verifyEmailButton') : t('auth.createAccountButton')}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

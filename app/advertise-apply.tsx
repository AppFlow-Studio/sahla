import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import {
  CardField,
  useConfirmPayment,
} from '@stripe/stripe-react-native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useSupabase } from '@/src/hooks/use-supabase';
import { useProfile } from '@/src/hooks/use-profile';
import { useConfigStore } from '@/src/stores/config-store';
import { useStripeAccount } from '@/src/providers/stripe-account-provider';
import { env } from '@/src/lib/env';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type FormData = {
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  businessAddress: string;
};

type Step = 'form' | 'payment' | 'processing' | 'success';

export default function AdvertiseApplyScreen() {
  const router = useRouter();
  const { user } = useUser();
  const supabase = useSupabase();
  const { profile } = useProfile();
  const { id: mosqueSlug, colors } = useMasjidConfig();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const { confirmPayment } = useConfirmPayment();
  const { setStripeAccountId } = useStripeAccount();

  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ',')})`;
  const primaryRgb = `rgb(${colors.primary.replace(/ /g, ',')})`;

  const [form, setForm] = useState<FormData>({
    fullName: user?.fullName ?? '',
    email: user?.primaryEmailAddress?.emailAddress ?? '',
    phone: user?.primaryPhoneNumber?.phoneNumber ?? '',
    businessName: '',
    businessAddress: '',
  });
  const [step, setStep] = useState<Step>('form');
  const [submitting, setSubmitting] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);

  // Fetch mosque ad pricing
  const [adMonthlyPrice, setAdMonthlyPrice] = useState<number | null>(null);
  const [adOnboardingFee, setAdOnboardingFee] = useState<number | null>(null);

  useEffect(() => {
    if (!mosqueUuid) return;
    supabase
      .from('mosques')
      .select('ad_monthly_price_cents, ad_onboarding_fee_cents')
      .eq('id', mosqueUuid)
      .single()
      .then(({ data }) => {
        if (data) {
          setAdMonthlyPrice(data.ad_monthly_price_cents ?? 5000);
          setAdOnboardingFee(data.ad_onboarding_fee_cents ?? 10000);
        }
      });
  }, [mosqueUuid]);

  const monthlyDisplay = adMonthlyPrice != null ? `$${(adMonthlyPrice / 100).toFixed(0)}` : '$50';
  const onboardingDisplay = adOnboardingFee != null ? `$${(adOnboardingFee / 100).toFixed(0)}` : '$100';
  const firstPaymentDisplay =
    adMonthlyPrice != null && adOnboardingFee != null
      ? `$${((adMonthlyPrice + adOnboardingFee) / 100).toFixed(0)}`
      : '$150';

  const update = (field: keyof FormData) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const isFormValid =
    form.fullName.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    form.businessName.trim() &&
    form.businessAddress.trim();

  // Step 1 → Step 2: Create subscription intent
  const handleContinueToPayment = useCallback(async () => {
    if (!isFormValid || submitting || !user || !mosqueUuid) return;

    setSubmitting(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'create-ad-subscription',
        {
          headers: { Authorization: `Bearer ${env.SUPABASE_ANON_KEY}` },
          body: {
            user_id: user.id,
            mosque_id: mosqueUuid,
            customer_email: form.email.trim() || undefined,
          },
        },
      );

      if (fnError || !data?.clientSecret) {
        let detail = 'Failed to create subscription';
        try {
          if (fnError?.context?.text) {
            const raw = await fnError.context.text();
            const body = JSON.parse(raw);
            detail = body?.error ?? body?.detail ?? raw;
          } else {
            detail = data?.error ?? fnError?.message ?? detail;
          }
        } catch {
          detail = fnError?.message ?? 'Unknown error';
        }
        throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
      }

      setStripeAccountId(data.stripeAccountId);
      setClientSecret(data.clientSecret);
      setSubscriptionId(data.subscriptionId);
      requestAnimationFrame(() => {
        setStep('payment');
        setSubmitting(false);
      });
    } catch (err: any) {
      setStripeAccountId(undefined);
      setSubmitting(false);
      Alert.alert('Error', err.message ?? 'Something went wrong.');
    }
  }, [form, isFormValid, submitting, user, supabase, mosqueUuid]);

  // Step 2 → Confirm payment
  const handleConfirmPayment = useCallback(async () => {
    if (!clientSecret || !cardComplete) return;
    setStep('processing');

    try {
      const { paymentIntent, error } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
      });

      if (error) throw new Error(error.message);

      if (paymentIntent?.status === 'Succeeded') {
        // Save the submission to DB
        await supabase.from('business_ads_submissions').insert({
          user_id: user!.id,
          mosque_id: mosqueUuid,
          personal_full_name: form.fullName.trim(),
          personal_email: form.email.trim(),
          personal_phone: form.phone.trim(),
          business_name: form.businessName.trim(),
          business_address: form.businessAddress.trim(),
          status: 'submitted',
        });

        setStripeAccountId(undefined);
        setStep('success');
      } else {
        throw new Error('Payment was not completed.');
      }
    } catch (err: any) {
      setStep('payment');
      Alert.alert('Payment failed', err.message ?? 'Something went wrong.');
    }
  }, [clientSecret, cardComplete, confirmPayment, user, supabase, mosqueUuid, form]);

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 140 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View className="flex-row items-center px-5 pt-2">
              <Pressable
                onPress={() => {
                  if (step === 'payment') {
                    setStep('form');
                    setStripeAccountId(undefined);
                    setClientSecret(null);
                  } else {
                    router.back();
                  }
                }}
                hitSlop={12}
                className="h-8 w-8 items-center justify-center"
              >
                <Ionicons name="arrow-back" size={22} color={fgRgb} />
              </Pressable>
              <Text className="ml-3 text-[16px] font-semibold text-foreground">
                {step === 'payment' || step === 'processing'
                  ? 'Payment'
                  : step === 'success'
                    ? 'Application Submitted'
                    : 'Business Application'}
              </Text>
            </View>

            {/* Step indicator */}
            <View className="mt-4 flex-row items-center justify-center gap-2 px-5">
              {['form', 'payment'].map((s, i) => (
                <View key={s} className="flex-row items-center gap-2">
                  <View
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        step === s || (step === 'processing' && s === 'payment') || step === 'success'
                          ? fgRgb
                          : `rgb(${colors.foreground.replace(/ /g, ',')} / 0.15)`,
                    }}
                  />
                  {i === 0 && (
                    <View
                      className="h-[1px] w-8"
                      style={{
                        backgroundColor: `rgb(${colors.foreground.replace(/ /g, ',')} / 0.15)`,
                      }}
                    />
                  )}
                </View>
              ))}
            </View>

            {/* ─── Success Step ─── */}
            {step === 'success' && (
              <View className="items-center px-5 pt-16">
                <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-foreground/5">
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={48}
                    color={primaryRgb}
                  />
                </View>
                <Text
                  className="text-center text-[24px] font-bold text-foreground"
                  style={{ fontFamily: 'PlayfairDisplay_500Medium' }}
                >
                  You're All Set!
                </Text>
                <Text className="mt-3 text-center text-[15px] leading-[22px] text-foreground/60">
                  We'll review your application and get back to you within 1–3
                  business days. Your subscription is active.
                </Text>
                <Pressable
                  onPress={() => router.dismissAll()}
                  className="mt-8 h-[48px] w-full items-center justify-center rounded-full bg-foreground active:opacity-90"
                >
                  <Text className="text-[16px] font-semibold text-background">
                    Done
                  </Text>
                </Pressable>
              </View>
            )}

            {/* ─── Processing Step ─── */}
            {step === 'processing' && (
              <View className="items-center px-5 pt-24">
                <ActivityIndicator size="large" color={fgRgb} />
                <Text className="mt-4 text-[15px] text-foreground/50">
                  Processing your payment...
                </Text>
              </View>
            )}

            {/* ─── Payment Step ─── */}
            {step === 'payment' && (
              <View className="mt-6 px-5">
                {/* Pricing summary */}
                <View className="rounded-2xl bg-muted/50 p-5">
                  <Text className="text-[11px] font-semibold uppercase tracking-[1.5px] text-foreground/40">
                    Payment Summary
                  </Text>
                  <View className="mt-4 gap-3">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[14px] text-foreground/70">
                        Monthly subscription
                      </Text>
                      <Text className="text-[14px] font-semibold text-foreground">
                        {monthlyDisplay}/mo
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[14px] text-foreground/70">
                        One-time onboarding fee
                      </Text>
                      <Text className="text-[14px] font-semibold text-foreground">
                        {onboardingDisplay}
                      </Text>
                    </View>
                    <View className="mt-1 border-t border-foreground/10 pt-3">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-[15px] font-bold text-foreground">
                          Due today
                        </Text>
                        <Text className="text-[15px] font-bold text-foreground">
                          {firstPaymentDisplay}
                        </Text>
                      </View>
                      <Text className="mt-1 text-[12px] text-foreground/40">
                        Then {monthlyDisplay}/month
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Card entry */}
                <View className="mt-6">
                  <Text className="mb-3 text-[11px] font-semibold uppercase tracking-[1.5px] text-foreground/40">
                    Card Details
                  </Text>
                  <View className="rounded-xl border border-foreground/10 bg-muted/30 p-1">
                    <CardField
                      postalCodeEnabled={false}
                      placeholders={{ number: '4242 4242 4242 4242' }}
                      cardStyle={{
                        backgroundColor: 'transparent',
                        textColor: fgRgb,
                        placeholderColor: `rgb(${colors.foreground.replace(/ /g, ',')} / 0.3)`,
                        fontSize: 16,
                        borderWidth: 0,
                      }}
                      style={{ width: '100%', height: 50 }}
                      onCardChange={(details) => setCardComplete(details.complete)}
                    />
                  </View>
                </View>

                {/* Business info recap */}
                <View className="mt-6 rounded-2xl bg-muted/30 px-4 py-3">
                  <Text className="text-[12px] font-medium text-foreground/40">
                    Applying as
                  </Text>
                  <Text className="mt-1 text-[14px] font-semibold text-foreground">
                    {form.businessName}
                  </Text>
                  <Text className="text-[13px] text-foreground/50">
                    {form.businessAddress}
                  </Text>
                </View>
              </View>
            )}

            {/* ─── Form Step ─── */}
            {step === 'form' && (
              <>
                {/* Personal Info Section */}
                <View className="mt-6 px-5">
                  <Text className="text-[11px] font-semibold uppercase tracking-[1.5px] text-foreground/40">
                    Personal Information
                  </Text>

                  <View className="mt-4 gap-4">
                    <FormField
                      label="Full Name"
                      value={form.fullName}
                      onChangeText={update('fullName')}
                      placeholder="Your full name"
                      autoComplete="name"
                      fgRgb={fgRgb}
                    />
                    <FormField
                      label="Email"
                      value={form.email}
                      onChangeText={update('email')}
                      placeholder="your@email.com"
                      keyboardType="email-address"
                      autoComplete="email"
                      fgRgb={fgRgb}
                    />
                    <FormField
                      label="Phone"
                      value={form.phone}
                      onChangeText={update('phone')}
                      placeholder="(555) 123-4567"
                      keyboardType="phone-pad"
                      autoComplete="tel"
                      fgRgb={fgRgb}
                    />
                  </View>
                </View>

                {/* Business Info Section */}
                <View className="mt-8 px-5">
                  <Text className="text-[11px] font-semibold uppercase tracking-[1.5px] text-foreground/40">
                    Business Information
                  </Text>

                  <View className="mt-4 gap-4">
                    <FormField
                      label="Business Name"
                      value={form.businessName}
                      onChangeText={update('businessName')}
                      placeholder="Your business name"
                      fgRgb={fgRgb}
                    />
                    <FormField
                      label="Business Address"
                      value={form.businessAddress}
                      onChangeText={update('businessAddress')}
                      placeholder="123 Main St, City, State"
                      fgRgb={fgRgb}
                    />
                  </View>
                </View>

                {/* Live Ad Preview */}
                <View className="mt-8 px-5">
                  <Text className="text-[11px] font-semibold uppercase tracking-[1.5px] text-foreground/40">
                    Live Preview
                  </Text>
                  <Text className="mt-1 text-[13px] text-foreground/35">
                    This is how your ad will appear in the app
                  </Text>

                  <View
                    className="mt-4 overflow-hidden rounded-2xl bg-muted/40"
                    style={{
                      shadowColor: fgRgb,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.04,
                      shadowRadius: 16,
                      elevation: 2,
                    }}
                  >
                    {/* Preview badge */}
                    <View className="absolute right-3 top-3 z-10 rounded-md bg-foreground/80 px-2.5 py-1">
                      <Text className="text-[10px] font-bold uppercase tracking-[1px] text-background">
                        Preview
                      </Text>
                    </View>

                    {/* Flyer area */}
                    <View className="h-[160px] items-center justify-center bg-foreground/5">
                      <MaterialCommunityIcons
                        name="image-outline"
                        size={36}
                        color={`rgb(${colors.foreground.replace(/ /g, ',')} / 0.25)`}
                      />
                      <Text className="mt-2 text-[13px] text-foreground/30">
                        Your flyer will appear here
                      </Text>
                    </View>

                    {/* Business name - live */}
                    {form.businessName.trim() ? (
                      <View className="border-t border-foreground/5 px-4 pb-1 pt-3">
                        <Text
                          className="text-[17px] font-bold text-foreground"
                          style={{ fontFamily: 'Georgia' }}
                        >
                          {form.businessName}
                        </Text>
                      </View>
                    ) : null}

                    {/* Action buttons */}
                    <View className="flex-row justify-center gap-8 border-t border-foreground/5 py-4">
                      {(
                        [
                          { icon: 'phone', label: 'Call', active: !!form.phone.trim() },
                          {
                            icon: 'message-text-outline',
                            label: 'SMS',
                            active: !!form.phone.trim(),
                          },
                          {
                            icon: 'email-outline',
                            label: 'Email',
                            active: !!form.email.trim(),
                          },
                        ] as const
                      ).map((action) => (
                        <View key={action.label} className="items-center gap-1.5">
                          <View
                            className="h-10 w-10 items-center justify-center rounded-full"
                            style={{
                              backgroundColor: action.active
                                ? `rgb(${colors.foreground.replace(/ /g, ',')} / 0.08)`
                                : `rgb(${colors.foreground.replace(/ /g, ',')} / 0.03)`,
                            }}
                          >
                            <MaterialCommunityIcons
                              name={action.icon as IconName}
                              size={18}
                              color={
                                action.active
                                  ? fgRgb
                                  : `rgb(${colors.foreground.replace(/ /g, ',')} / 0.2)`
                              }
                            />
                          </View>
                          <Text
                            className="text-[11px]"
                            style={{
                              color: action.active
                                ? `rgb(${colors.foreground.replace(/ /g, ',')} / 0.5)`
                                : `rgb(${colors.foreground.replace(/ /g, ',')} / 0.2)`,
                            }}
                          >
                            {action.label}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Address row - live */}
                    <View className="flex-row items-center border-t border-foreground/5 px-4 py-3.5">
                      <MaterialCommunityIcons
                        name="map-marker-outline"
                        size={16}
                        color={
                          form.businessAddress.trim()
                            ? fgRgb
                            : `rgb(${colors.foreground.replace(/ /g, ',')} / 0.2)`
                        }
                      />
                      <View className="ml-2.5 flex-1">
                        <Text
                          className="text-[13px]"
                          style={{
                            color: form.businessAddress.trim()
                              ? fgRgb
                              : `rgb(${colors.foreground.replace(/ /g, ',')} / 0.2)`,
                          }}
                        >
                          {form.businessAddress.trim() || 'Business address'}
                        </Text>
                        <Text className="mt-0.5 text-[10px] uppercase tracking-[0.5px] text-foreground/35">
                          Open in Maps
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={18}
                        color={`rgb(${colors.foreground.replace(/ /g, ',')} / 0.3)`}
                      />
                    </View>
                  </View>
                </View>

                {/* Pricing info */}
                <View className="mx-5 mt-6 rounded-2xl bg-muted/60 px-5 py-4">
                  <View className="flex-row items-center gap-2">
                    <MaterialCommunityIcons
                      name="information-outline"
                      size={16}
                      color={`rgb(${colors.foreground.replace(/ /g, ',')} / 0.4)`}
                    />
                    <Text className="text-[13px] leading-[20px] text-foreground/60">
                      {monthlyDisplay}/month subscription + {onboardingDisplay}{' '}
                      one-time onboarding fee
                    </Text>
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          {/* Fixed Bottom CTA */}
          {step !== 'success' && step !== 'processing' && (
            <View
              className="absolute bottom-0 left-0 right-0 bg-background px-5 pb-10 pt-3"
              style={{
                shadowColor: fgRgb,
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
                elevation: 5,
              }}
            >
              {step === 'form' ? (
                <Pressable
                  onPress={handleContinueToPayment}
                  disabled={!isFormValid || submitting}
                  className="h-[52px] flex-row items-center justify-center rounded-full active:opacity-90"
                  style={{
                    backgroundColor: isFormValid
                      ? fgRgb
                      : `rgb(${colors.foreground.replace(/ /g, ',')} / 0.3)`,
                  }}
                >
                  {submitting ? (
                    <ActivityIndicator
                      size="small"
                      color={`rgb(${colors.background.replace(/ /g, ',')})`}
                    />
                  ) : (
                    <>
                      <Text className="text-[16px] font-semibold text-background">
                        Continue to Payment
                      </Text>
                      <Text className="ml-2 text-[16px] text-background">
                        {'\u2192'}
                      </Text>
                    </>
                  )}
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleConfirmPayment}
                  disabled={!cardComplete}
                  className="h-[52px] flex-row items-center justify-center rounded-full active:opacity-90"
                  style={{
                    backgroundColor: cardComplete
                      ? fgRgb
                      : `rgb(${colors.foreground.replace(/ /g, ',')} / 0.3)`,
                  }}
                >
                  <Text className="text-[16px] font-semibold text-background">
                    Pay {firstPaymentDisplay} & Subscribe
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoComplete,
  fgRgb,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: TextInput['props']['keyboardType'];
  autoComplete?: TextInput['props']['autoComplete'];
  fgRgb: string;
}) {
  return (
    <View>
      <Text className="mb-1.5 text-[12px] font-medium text-foreground/50">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={`rgb(${fgRgb.slice(4, -1)} / 0.2)`}
        keyboardType={keyboardType}
        autoComplete={autoComplete}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
        className="rounded-xl border border-foreground/10 bg-muted/30 px-4 py-3 text-[15px] text-foreground"
      />
    </View>
  );
}

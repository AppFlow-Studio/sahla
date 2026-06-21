import { useUser } from '@clerk/clerk-expo';
import { useConfirmPayment } from '@stripe/stripe-react-native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Image } from 'expo-image';

import { CardVisual } from '@/src/components/stripe-card-visual';
import { Icon, type IconName } from '@/src/components/ui/icon';
import { useFontFamily } from '@/src/hooks/use-font-family';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useSupabase } from '@/src/hooks/use-supabase';
import { useProfile } from '@/src/hooks/use-profile';
import { useConfigStore } from '@/src/stores/config-store';
import { useStripeAccount } from '@/src/providers/stripe-account-provider';
import { env } from '@/src/lib/env';

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
  const fonts = useFontFamily();
  const supabase = useSupabase();
  const { profile } = useProfile();
  const { id: mosqueSlug, colors, displayName } = useMasjidConfig();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const { confirmPayment } = useConfirmPayment();
  const { setStripeAccountId } = useStripeAccount();

  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ',')})`;
  const bgRgb = `rgb(${colors.background.replace(/ /g, ',')})`;
  const fg = colors.foreground.replace(/ /g, ',');
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;
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
  const [cardBrand, setCardBrand] = useState('');
  const [cardLast4, setCardLast4] = useState<string | undefined>(undefined);
  const [cardExpMonth, setCardExpMonth] = useState<number | undefined>(undefined);
  const [cardExpYear, setCardExpYear] = useState<number | undefined>(undefined);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [cvcFilled, setCvcFilled] = useState(false);
  const [flyerUrl, setFlyerUrl] = useState<string | null>(null);
  const [flyerUploading, setFlyerUploading] = useState(false);

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

  // Pick a flyer image and upload it (via edge function) to Bunny CDN.
  const pickFlyer = useCallback(async () => {
    try {
      const mod = await import('expo-image-picker');
      const ImagePicker = ((mod as any).default ?? mod) as typeof import('expo-image-picker');
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission needed', 'Photo library access was denied.');
        return;
      }
      // No allowsEditing: its crop is square on iOS, which would never satisfy
      // the 16:9 check below. We validate the image's own dimensions instead.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];

      // Enforce 16:9 (≈0.5% drift allowed) + 5 MB cap, matching the CRM.
      const ASPECT = 16 / 9;
      const TOLERANCE = 0.01;
      if (asset.width && asset.height) {
        const ratio = asset.width / asset.height;
        if (Math.abs(ratio - ASPECT) > TOLERANCE) {
          Alert.alert(
            'Wrong aspect ratio',
            `The flyer must be 16:9 (e.g. 1920×1080). Yours is ${asset.width}×${asset.height} (≈${ratio.toFixed(2)}:1).`,
          );
          return;
        }
      }
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert('File too large', 'The flyer must be 5 MB or smaller.');
        return;
      }

      const ext = (asset.uri.split('.').pop() ?? 'jpg').toLowerCase();
      const contentType = asset.mimeType ?? `image/${ext === 'jpg' ? 'jpeg' : ext}`;

      // Upload via the edge function → Bunny CDN (the app can't hold the Bunny
      // storage key). Returns the public CDN URL.
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: `flyer.${ext}`,
        type: contentType,
      } as any);
      formData.append('mosque_id', mosqueUuid ?? '');

      setFlyerUploading(true);
      const { data, error: upErr } = await supabase.functions.invoke(
        'business-ad-flyer-upload',
        {
          headers: { Authorization: `Bearer ${env.SUPABASE_ANON_KEY}` },
          body: formData,
        },
      );
      if (upErr || !data?.url) throw new Error(upErr?.message ?? 'Upload failed');
      setFlyerUrl(data.url as string);
    } catch (err: any) {
      Alert.alert('Upload failed', err.message ?? 'Could not upload the flyer.');
    } finally {
      setFlyerUploading(false);
    }
  }, [supabase, mosqueUuid]);

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
            full_name: form.fullName.trim() || undefined,
            phone: form.phone.trim() || undefined,
            business_name: form.businessName.trim() || undefined,
            business_address: form.businessAddress.trim() || undefined,
            business_flyer_img: flyerUrl || undefined,
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
  }, [form, isFormValid, submitting, user, supabase, mosqueUuid, flyerUrl]);

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
        // The submission + ad_subscriptions rows were already created
        // server-side by create-ad-subscription; the stripe-webhook promotes
        // them to paid/submitted once Stripe confirms the invoice. Nothing to
        // write from the client here.
        setStripeAccountId(undefined);
        setStep('success');
      } else {
        throw new Error('Payment was not completed.');
      }
    } catch (err: any) {
      setStep('payment');
      Alert.alert('Payment failed', err.message ?? 'Something went wrong.');
    }
  }, [clientSecret, cardComplete, confirmPayment, setStripeAccountId]);

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
                <Icon name="arrow-back" size={22} color={fgRgb} />
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
                  <Icon
                    name="check-circle"
                    size={48}
                    color={primaryRgb}
                  />
                </View>
                <Text
                  className="text-center text-[24px] font-bold text-foreground"
                  style={{ fontFamily: fonts.display }}
                >
                  You're All Set!
                </Text>
                <Text className="mt-3 text-center text-[15px] leading-[22px] text-foreground/60">
                  We'll review your application and get back to you within 1–3
                  business days. Your subscription is active.
                </Text>

                <View className="mt-8 w-full">
                  <ReceiptCard
                    title="Payment Receipt"
                    merchant={displayName}
                    monthly={monthlyDisplay}
                    onboarding={onboardingDisplay}
                    total={firstPaymentDisplay}
                    businessName={form.businessName.trim() || undefined}
                    paid
                    cardBrand={cardBrand || undefined}
                    last4={cardLast4}
                    reference={subscriptionId ?? undefined}
                    dateStr={new Date().toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    tint={primaryRgb}
                    pageColor={bgRgb}
                  />
                </View>

                <Pressable
                  onPress={() => router.dismissAll()}
                  className="mt-6 h-[48px] w-full items-center justify-center rounded-full bg-foreground active:opacity-90"
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
                {/* Order receipt (pre-purchase) */}
                <ReceiptCard
                  title="Order Summary"
                  merchant={displayName}
                  monthly={monthlyDisplay}
                  onboarding={onboardingDisplay}
                  total={firstPaymentDisplay}
                  tint={primaryRgb}
                  pageColor={bgRgb}
                />

                {/* Card entry */}
                <View className="mt-6">
                  <Text className="mb-3 text-[11px] font-semibold uppercase tracking-[1.5px] text-foreground/40">
                    Card Details
                  </Text>
                  <CardVisual
                    brand={cardBrand}
                    cardComplete={cardComplete}
                    flipped={cardFlipped}
                    last4={cardLast4}
                    expiryMonth={cardExpMonth}
                    expiryYear={cardExpYear}
                    cvcFilled={cvcFilled}
                    profileName={form.fullName.trim() || undefined}
                    bgRgb={bgRgb}
                    fgRgb={fgRgb}
                    fg={fg}
                    accentRgb={accentRgb}
                    onCardChange={(details) => {
                      setCardComplete(details.complete);
                      if (details.brand) setCardBrand(details.brand);
                      setCardLast4(details.last4 || undefined);
                      setCardExpMonth(details.expiryMonth ?? undefined);
                      setCardExpYear(details.expiryYear ?? undefined);
                      setCvcFilled(details.complete);
                      if (cardFlipped && details.expiryYear == null) {
                        setCardFlipped(false);
                      }
                    }}
                    onFocus={(field) => setCardFlipped(field === 'Cvc')}
                  />
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

                    {/* Flyer upload */}
                    <View>
                      <Text className="mb-2 text-[13px] font-medium text-foreground/70">
                        Business Flyer
                      </Text>
                      <Pressable
                        onPress={pickFlyer}
                        disabled={flyerUploading}
                        className="overflow-hidden rounded-xl border border-dashed border-foreground/20 bg-muted/30"
                      >
                        {flyerUploading ? (
                          <View className="h-[150px] items-center justify-center">
                            <ActivityIndicator color={fgRgb} />
                          </View>
                        ) : flyerUrl ? (
                          <View>
                            <Image
                              source={{ uri: flyerUrl }}
                              contentFit="cover"
                              style={{ width: '100%', height: 150 }}
                            />
                            <View className="absolute bottom-2 right-2 rounded-md bg-foreground/80 px-2.5 py-1">
                              <Text className="text-[11px] font-semibold text-background">
                                Change
                              </Text>
                            </View>
                          </View>
                        ) : (
                          <View className="h-[150px] items-center justify-center">
                            <Icon
                              name="cloud-upload-outline"
                              size={32}
                              color={`rgb(${colors.foreground.replace(/ /g, ',')} / 0.4)`}
                            />
                            <Text className="mt-2 text-[14px] font-medium text-foreground/60">
                              Upload your flyer
                            </Text>
                            <Text className="mt-0.5 text-[12px] text-foreground/35">
                              Recommended 16:9 · PNG or JPG
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    </View>
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

                    {/* Flyer area — tap to upload */}
                    <Pressable
                      onPress={pickFlyer}
                      disabled={flyerUploading}
                      className="h-[160px] items-center justify-center bg-foreground/5"
                    >
                      {flyerUploading ? (
                        <ActivityIndicator color={fgRgb} />
                      ) : flyerUrl ? (
                        <>
                          <Image
                            source={{ uri: flyerUrl }}
                            contentFit="cover"
                            style={{ width: '100%', height: '100%' }}
                          />
                          <View className="absolute bottom-2 right-2 rounded-md bg-foreground/80 px-2 py-1">
                            <Text className="text-[10px] font-semibold text-background">
                              Tap to change
                            </Text>
                          </View>
                        </>
                      ) : (
                        <>
                          <Icon
                            name="image-plus"
                            size={36}
                            color={`rgb(${colors.foreground.replace(/ /g, ',')} / 0.25)`}
                          />
                          <Text className="mt-2 text-[13px] text-foreground/30">
                            Tap to upload your flyer
                          </Text>
                        </>
                      )}
                    </Pressable>

                    {/* Business name - live */}
                    {form.businessName.trim() ? (
                      <View className="border-t border-foreground/5 px-4 pb-1 pt-3">
                        <Text
                          className="text-[17px] font-bold text-foreground"
                          style={{ fontFamily: fonts.displayRegular }}
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
                            <Icon
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
                      <Icon
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
                      <Icon
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
                    <Icon
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

function ReceiptRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className={`text-[14px] ${bold ? 'font-bold text-foreground' : 'text-foreground/70'}`}>
        {label}
      </Text>
      <Text
        className={`text-[14px] ${bold ? 'text-[15px] font-bold' : 'font-semibold'} text-foreground`}
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {value}
      </Text>
    </View>
  );
}

// A dashed separator with two notch "punches" at the edges — the classic
// ticket / receipt tear line. `pageColor` fills the notches to match the page.
function TearLine({ pageColor }: { pageColor?: string }) {
  return (
    <View className="my-1" style={{ position: 'relative', justifyContent: 'center', height: 16 }}>
      <View
        style={{
          borderBottomWidth: 1,
          borderColor: 'rgba(0,0,0,0.18)',
          borderStyle: 'dashed',
          marginHorizontal: 4,
        }}
      />
      <View
        style={{
          position: 'absolute', left: -10, width: 16, height: 16, borderRadius: 8,
          backgroundColor: pageColor ?? 'transparent',
        }}
      />
      <View
        style={{
          position: 'absolute', right: -10, width: 16, height: 16, borderRadius: 8,
          backgroundColor: pageColor ?? 'transparent',
        }}
      />
    </View>
  );
}

// Deterministic faux barcode — sells the "official receipt" look.
const BARCODE = [2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2, 1, 3, 1, 1, 2, 2, 1, 3, 1, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 2, 1, 3, 1, 1, 2];
function Barcode() {
  return (
    <View className="flex-row items-end justify-center" style={{ height: 36 }}>
      {BARCODE.map((w, i) => (
        <View
          key={i}
          className="bg-foreground"
          style={{ width: w, height: 36, marginRight: 2, opacity: 0.85 }}
        />
      ))}
    </View>
  );
}

// Animated rubber "PAID" stamp — slams down into the top-right of the receipt.
function PaidStamp({ tint }: { tint?: string }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(350),
      Animated.spring(a, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
    ]).start();
  }, [a]);
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [2.6, 1] });
  const opacity = a.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.9, 0.9] });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 14,
        right: 14,
        zIndex: 10,
        opacity,
        transform: [{ rotate: '-11deg' }, { scale }],
      }}
    >
      <View className="rounded-md border-2 px-2 py-0.5" style={{ borderColor: tint }}>
        <Text className="text-[13px] font-extrabold tracking-[2px]" style={{ color: tint }}>
          PAID
        </Text>
      </View>
    </Animated.View>
  );
}

/**
 * Itemized receipt styled like a real one. Used before purchase
 * (paid=false → "Due today") and on the success screen (paid=true → "Total
 * paid" + card/date + barcode).
 */
function ReceiptCard({
  title,
  monthly,
  onboarding,
  total,
  businessName,
  merchant,
  paid = false,
  cardBrand,
  last4,
  dateStr,
  reference,
  tint,
  pageColor,
}: {
  title: string;
  monthly: string;
  onboarding: string;
  total: string;
  businessName?: string;
  merchant?: string;
  paid?: boolean;
  cardBrand?: string;
  last4?: string;
  dateStr?: string;
  reference?: string;
  tint?: string;
  pageColor?: string;
}) {
  const ref = reference
    ? reference.replace(/[^a-zA-Z0-9]/g, '').slice(-10).toUpperCase()
    : null;

  return (
    <View
      className="w-full rounded-2xl border border-foreground/10 bg-muted"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 2,
      }}
    >
      {paid ? <PaidStamp tint={tint} /> : null}

      {/* Header */}
      <View className="items-center px-5 pb-3 pt-5">
        <View
          className="mb-2 h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: `${tint ?? '#0A261E'}1A` }}
        >
          <Icon name="storefront" size={18} color={tint} />
        </View>
        {merchant ? (
          <Text className="text-[13px] font-semibold text-foreground" numberOfLines={1}>
            {merchant}
          </Text>
        ) : null}
        <Text className="mt-1 text-[11px] font-semibold uppercase tracking-[3px] text-foreground/45">
          {title}
        </Text>
        {(ref || dateStr) && paid ? (
          <Text className="mt-1 text-[11px] text-foreground/40" style={{ fontVariant: ['tabular-nums'] }}>
            {ref ? `No. ${ref}` : ''}{ref && dateStr ? '  ·  ' : ''}{dateStr ?? ''}
          </Text>
        ) : null}
      </View>

      <TearLine pageColor={pageColor} />

      {/* Line items */}
      <View className="gap-3 px-5 pt-3">
        <ReceiptRow label="One-time onboarding fee" value={onboarding} />
        <ReceiptRow label="First month" value={monthly} />
      </View>

      <View className="px-5">
        <View
          className="my-3"
          style={{ borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.12)', borderStyle: 'dashed' }}
        />
        <ReceiptRow label={paid ? 'Total paid' : 'Due today'} value={total} bold />
        <Text className="mt-1 text-[12px] text-foreground/40">Then {monthly}/month</Text>
      </View>

      {/* Meta */}
      {paid && (businessName || last4) ? (
        <View className="px-5">
          <View
            className="my-3"
            style={{ borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.12)', borderStyle: 'dashed' }}
          />
          <View className="gap-1.5">
            {businessName ? (
              <View className="flex-row items-center justify-between">
                <Text className="text-[12px] text-foreground/40">Business</Text>
                <Text className="text-[12px] font-medium text-foreground/70">{businessName}</Text>
              </View>
            ) : null}
            {last4 ? (
              <View className="flex-row items-center justify-between">
                <Text className="text-[12px] text-foreground/40">Payment</Text>
                <Text
                  className="text-[12px] font-medium text-foreground/70"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {cardBrand ? `${cardBrand} ` : ''}•••• {last4}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Footer */}
      <View className="items-center px-5 pb-5 pt-4">
        {paid ? (
          <>
            <Text className="mb-3 text-[11px] italic text-foreground/40">
              Thank you for advertising with us
            </Text>
            <Barcode />
            {ref ? (
              <Text
                className="mt-1.5 text-[10px] tracking-[2px] text-foreground/45"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {ref}
              </Text>
            ) : null}
          </>
        ) : (
          <Text className="text-[11px] text-foreground/35">
            You won't be charged until you confirm
          </Text>
        )}
      </View>
    </View>
  );
}

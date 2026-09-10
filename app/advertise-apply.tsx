import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { BackButton } from '@/src/components/ui/back-button';
import { useCallback, useState } from 'react';
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

import { Image } from 'expo-image';

import { Icon, type IconName } from '@/src/components/ui/icon';
import { useFontFamily } from '@/src/hooks/use-font-family';
import { useIsRTL } from '@/src/hooks/use-is-rtl';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useAutoStatusBarStyle } from '@/src/hooks/use-status-bar-style';
import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';
import { env } from '@/src/lib/env';

type FormData = {
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  businessAddress: string;
};

/**
 * Ad purchasing is switched off for the first App Store submission, so the
 * flow is form → notice. The payment, processing and success steps were
 * removed with their Stripe calls; restore them when advertising is turned
 * back on.
 */
type Step = 'form' | 'soon';

export default function AdvertiseApplyScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const { user } = useUser();
  const fonts = useFontFamily();
  const supabase = useSupabase();
  const { colors } = useMasjidConfig();
  useAutoStatusBarStyle(colors.background);
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);

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
  // Kept so the CTA can show a disabled state; nothing async runs while
  // payments are off.
  const [submitting] = useState(false);
  const [flyerUrl, setFlyerUrl] = useState<string | null>(null);
  const [flyerUploading, setFlyerUploading] = useState(false);


  const update = (field: keyof FormData) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // Pick a flyer image and upload it (via edge function) to Bunny CDN.
  const pickFlyer = useCallback(async () => {
    try {
      const mod = await import('expo-image-picker');
      const ImagePicker = ((mod as any).default ?? mod) as typeof import('expo-image-picker');
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert(t('ads.permissionNeededTitle'), t('ads.permissionNeededMessage'));
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
            t('ads.wrongAspectRatioTitle'),
            t('ads.wrongAspectRatioMessage', {
              width: asset.width,
              height: asset.height,
              ratio: ratio.toFixed(2),
            }),
          );
          return;
        }
      }
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert(t('ads.fileTooLargeTitle'), t('ads.fileTooLargeMessage'));
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
      Alert.alert(t('ads.uploadFailedTitle'), err.message ?? t('ads.uploadFailedMessage'));
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

  /**
   * Validates the form and shows the notice. Previously this created a Stripe
   * subscription intent server-side; with payments off there is nothing to
   * charge, so nothing is written.
   */
  const handleContinueToPayment = useCallback(() => {
    if (!isFormValid || submitting) return;
    setStep('soon');
  }, [isFormValid, submitting]);

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
              <BackButton
                color={fgRgb}
                onPress={() => {
                  // The notice is terminal, so back always leaves the screen.
                  if (step === 'soon') router.dismissAll();
                  else router.back();
                }}
                style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
              />
              <Text className="ms-3 text-[16px] font-semibold text-foreground">
                {t('ads.businessApplication')}
              </Text>
            </View>

            {/* ─── Coming Soon ─── */}
            {/* Ad purchasing is switched off for the first App Store
                submission. The business form above still runs so the flow reads
                as intended; this replaces the payment step rather than sitting
                in front of it. */}
            {step === 'soon' && (
              <View className="items-center px-5 pt-16">
                <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-foreground/5">
                  <Icon name="megaphone-outline" size={40} color={primaryRgb} />
                </View>
                <Text
                  className="text-center text-[24px] font-bold text-foreground"
                  style={{ fontFamily: fonts.display }}
                >
                  {t('ads.soonTitle')}
                </Text>
                <Text className="mt-3 text-center text-[15px] leading-[22px] text-foreground/60">
                  {t('ads.soonBody')}
                </Text>

                <Pressable
                  onPress={() => router.dismissAll()}
                  className="mt-8 h-[48px] w-full items-center justify-center rounded-full bg-foreground active:opacity-90"
                >
                  <Text className="text-[16px] font-semibold text-background">
                    {t('ads.soonCta')}
                  </Text>
                </Pressable>
              </View>
            )}


            {/* ─── Form Step ─── */}
            {step === 'form' && (
              <>
                {/* Personal Info Section */}
                <View className="mt-6 px-5">
                  <Text className="text-[11px] font-semibold uppercase tracking-[1.5px] text-foreground/40">
                    {t('ads.personalInformation')}
                  </Text>

                  <View className="mt-4 gap-4">
                    <FormField
                      label={t('ads.fullName')}
                      value={form.fullName}
                      onChangeText={update('fullName')}
                      placeholder={t('ads.fullNamePlaceholder')}
                      autoComplete="name"
                      fgRgb={fgRgb}
                    />
                    <FormField
                      label={t('ads.email')}
                      value={form.email}
                      onChangeText={update('email')}
                      placeholder={t('ads.emailPlaceholder')}
                      keyboardType="email-address"
                      autoComplete="email"
                      fgRgb={fgRgb}
                    />
                    <FormField
                      label={t('ads.phone')}
                      value={form.phone}
                      onChangeText={update('phone')}
                      placeholder={t('ads.phonePlaceholder')}
                      keyboardType="phone-pad"
                      autoComplete="tel"
                      fgRgb={fgRgb}
                    />
                  </View>
                </View>

                {/* Business Info Section */}
                <View className="mt-8 px-5">
                  <Text className="text-[11px] font-semibold uppercase tracking-[1.5px] text-foreground/40">
                    {t('ads.businessInformation')}
                  </Text>

                  <View className="mt-4 gap-4">
                    <FormField
                      label={t('ads.businessName')}
                      value={form.businessName}
                      onChangeText={update('businessName')}
                      placeholder={t('ads.businessNamePlaceholder')}
                      fgRgb={fgRgb}
                    />
                    <FormField
                      label={t('ads.businessAddress')}
                      value={form.businessAddress}
                      onChangeText={update('businessAddress')}
                      placeholder={t('ads.businessAddressPlaceholder')}
                      fgRgb={fgRgb}
                    />

                    {/* Flyer upload */}
                    <View>
                      <Text className="mb-2 text-[13px] font-medium text-foreground/70">
                        {t('ads.businessFlyer')}
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
                            <View className="absolute bottom-2 end-2 rounded-md bg-foreground/80 px-2.5 py-1">
                              <Text className="text-[11px] font-semibold text-background">
                                {t('ads.change')}
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
                              {t('ads.uploadYourFlyer')}
                            </Text>
                            <Text className="mt-0.5 text-[12px] text-foreground/35">
                              {t('ads.flyerHint')}
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
                    {t('ads.livePreview')}
                  </Text>
                  <Text className="mt-1 text-[13px] text-foreground/35">
                    {t('ads.livePreviewSubtitle')}
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
                    <View className="absolute end-3 top-3 z-10 rounded-md bg-foreground/80 px-2.5 py-1">
                      <Text className="text-[10px] font-bold uppercase tracking-[1px] text-background">
                        {t('ads.previewBadge')}
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
                          <View className="absolute bottom-2 end-2 rounded-md bg-foreground/80 px-2 py-1">
                            <Text className="text-[10px] font-semibold text-background">
                              {t('ads.tapToChange')}
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
                            {t('ads.tapToUploadFlyer')}
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
                          { icon: 'phone', label: t('ads.actionCall'), active: !!form.phone.trim() },
                          {
                            icon: 'message-text-outline',
                            label: t('ads.actionSms'),
                            active: !!form.phone.trim(),
                          },
                          {
                            icon: 'email-outline',
                            label: t('ads.actionEmail'),
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
                      <View className="ms-2.5 flex-1">
                        <Text
                          className="text-[13px]"
                          style={{
                            color: form.businessAddress.trim()
                              ? fgRgb
                              : `rgb(${colors.foreground.replace(/ /g, ',')} / 0.2)`,
                          }}
                        >
                          {form.businessAddress.trim() || t('ads.businessAddressPlaceholderPreview')}
                        </Text>
                        <Text className="mt-0.5 text-[10px] uppercase tracking-[0.5px] text-foreground/35">
                          {t('ads.openInMaps')}
                        </Text>
                      </View>
                      <Icon
                        name={isRTL ? 'chevron-left' : 'chevron-right'}
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
                      {t('ads.pricingComingSoon')}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          {/* Fixed Bottom CTA — the notice carries its own button. */}
          {step === 'form' && (
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
                <Text className="text-[16px] font-semibold text-background">
                  {t('ads.continueToPayment')}
                </Text>
                <Text className="ms-2 text-[16px] text-background">
                  {isRTL ? '\u2190' : '\u2192'}
                </Text>
              </Pressable>
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



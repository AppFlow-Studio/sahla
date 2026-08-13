import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/src/components/ui/icon';
import { useFontFamily } from '@/src/hooks/use-font-family';
import { useIsRTL } from '@/src/hooks/use-is-rtl';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';
import { BackButton } from '@/src/components/ui/back-button';

const BENEFITS = [
  {
    icon: 'check-circle' as IconName,
    titleKey: 'benefitSetupTitle',
    subtitleKey: 'benefitSetupSubtitle',
  },
  {
    icon: 'eye-outline' as IconName,
    titleKey: 'benefitVisibilityTitle',
    subtitleKey: 'benefitVisibilitySubtitle',
  },
  {
    icon: 'heart' as IconName,
    titleKey: 'benefitImpactTitle',
    subtitleKey: 'benefitImpactSubtitle',
  },
] as const;

const MOCK_CHART_BARS = [0.4, 0.55, 0.7, 0.5, 0.65, 0.85, 1.0];

export default function AdvertiseScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const fonts = useFontFamily();
  const supabase = useSupabase();
  const { displayName, colors } = useMasjidConfig();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ',')})`;
  const primaryRgb = `rgb(${colors.primary.replace(/ /g, ',')})`;

  const [adMonthlyPrice, setAdMonthlyPrice] = useState<number>(5000);
  const [adOnboardingFee, setAdOnboardingFee] = useState<number>(10000);
  const [adsEnabled, setAdsEnabled] = useState<boolean>(true);

  useEffect(() => {
    if (!mosqueUuid) return;
    supabase
      .from('mosques')
      .select('ad_monthly_price_cents, ad_onboarding_fee_cents, ads_enabled')
      .eq('id', mosqueUuid)
      .single()
      .then(({ data }) => {
        if (data) {
          setAdMonthlyPrice(data.ad_monthly_price_cents ?? 5000);
          setAdOnboardingFee(data.ad_onboarding_fee_cents ?? 10000);
          setAdsEnabled(data.ads_enabled ?? false);
        }
      });
  }, [mosqueUuid]);

  const monthlyDisplay = `$${(adMonthlyPrice / 100).toFixed(0)}`;
  const onboardingDisplay = `$${(adOnboardingFee / 100).toFixed(0)}`;

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Back button */}
          <BackButton color={fgRgb} style={{ marginStart: 20, marginTop: 8, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }} />

          {/* Hero */}
          <View className="px-5 pt-4">
            <Text
              className="text-[28px] font-bold leading-[34px] text-foreground"
              style={{ fontFamily: fonts.display }}
            >
              {t('ads.heroTitle')}
            </Text>
            <Text className="mt-3 text-[15px] leading-[22px] text-foreground/60">
              {t('ads.heroSubtitle', { name: displayName })}
            </Text>
          </View>

          {/* Analytics Preview Card */}
          <View className="mx-5 mt-6">
            <View
              className="overflow-hidden rounded-2xl bg-muted/50 p-5"
              style={{
                shadowColor: fgRgb,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.06,
                shadowRadius: 24,
                elevation: 3,
              }}
            >
              <View className="overflow-hidden rounded-xl bg-background p-4">
                {/* Header */}
                <View className="flex-row items-center justify-between">
                  <Text className="text-[13px] font-semibold text-foreground">
                    {t('ads.analytics')}
                  </Text>
                  <Text className="text-[11px] text-foreground/40">
                    {t('ads.thisWeek')}
                  </Text>
                </View>

                {/* Bar Chart */}
                <View className="mt-4 flex-row items-end justify-between gap-2">
                  {MOCK_CHART_BARS.map((height, i) => (
                    <View
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{
                        height: height * 60,
                        backgroundColor:
                          i === MOCK_CHART_BARS.length - 1
                            ? primaryRgb
                            : `rgb(${colors.foreground.replace(/ /g, ',')} / 0.12)`,
                        opacity: i === MOCK_CHART_BARS.length - 1 ? 1 : 0.6,
                      }}
                    />
                  ))}
                </View>

                {/* Stats */}
                <View className="mt-4 flex-row justify-between">
                  <View>
                    <Text className="text-[10px] text-foreground/40">{t('ads.views')}</Text>
                    <Text className="text-[16px] font-bold text-foreground">
                      2,847
                    </Text>
                  </View>
                  <View>
                    <Text className="text-[10px] text-foreground/40">
                      {t('ads.clicks')}
                    </Text>
                    <Text className="text-[16px] font-bold text-foreground">
                      384
                    </Text>
                  </View>
                  <View>
                    <Text className="text-[10px] text-foreground/40">{t('ads.rate')}</Text>
                    <Text
                      className="text-[16px] font-bold"
                      style={{ color: primaryRgb }}
                    >
                      13.5%
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Benefits */}
          <View className="mt-8 gap-5 px-5">
            {BENEFITS.map((benefit) => (
              <View key={benefit.titleKey} className="flex-row items-center gap-4">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-foreground/5">
                  <Icon
                    name={benefit.icon}
                    size={20}
                    color={fgRgb}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-semibold text-foreground">
                    {t(`ads.${benefit.titleKey}`)}
                  </Text>
                  <Text className="mt-0.5 text-[13px] text-foreground/50">
                    {t(`ads.${benefit.subtitleKey}`)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Pricing Info Box */}
          <View className="mx-5 mt-8 rounded-2xl bg-muted/60 px-5 py-5">
            <Text className="text-[14px] leading-[22px] text-foreground/80">
              {t('ads.pricingLeadIn')}{' '}
              <Text className="font-bold text-foreground">
                {t('ads.pricingMonthlyAmount', { amount: monthlyDisplay })}
              </Text>{' '}
              {t('ads.pricingMiddle')}{' '}
              <Text className="font-bold text-foreground">
                {t('ads.pricingMembers')}
              </Text>
              {t('ads.pricingTrail')}
            </Text>
            <Text className="mt-2 text-[13px] leading-[20px] text-foreground/50">
              {t('ads.pricingOnboardingLeadIn')}{' '}
              <Text className="font-semibold text-foreground/60">
                {t('ads.pricingOnboardingFee', { amount: onboardingDisplay })}
              </Text>{' '}
              {t('ads.pricingOnboardingTrail')}
            </Text>
          </View>

          {/* Ad Preview */}
          <View className="mx-5 mt-8">
            <Text className="mb-3 text-[13px] text-foreground/50">
              {t('ads.previewExampleLabel')}
            </Text>

            <View
              className="overflow-hidden rounded-2xl bg-muted/40"
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

              {/* Flyer placeholder */}
              <View className="h-[160px] items-center justify-center bg-foreground/5">
                <Icon
                  name="image-outline"
                  size={36}
                  color={`rgb(${colors.foreground.replace(/ /g, ',')} / 0.25)`}
                />
                <Text className="mt-2 text-[13px] text-foreground/30">
                  {t('ads.flyerPlaceholder')}
                </Text>
              </View>

              {/* Action buttons */}
              <View className="flex-row justify-center gap-8 border-t border-foreground/5 py-4">
                {[
                  { icon: 'phone', label: t('ads.actionCall') },
                  { icon: 'message-text-outline', label: t('ads.actionSms') },
                  { icon: 'email-outline', label: t('ads.actionEmail') },
                ].map((action) => (
                  <View key={action.label} className="items-center gap-1.5">
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-foreground/5">
                      <Icon
                        name={action.icon as IconName}
                        size={18}
                        color={fgRgb}
                      />
                    </View>
                    <Text className="text-[11px] text-foreground/50">
                      {action.label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Address row */}
              <Pressable className="flex-row items-center border-t border-foreground/5 px-4 py-3.5">
                <Icon
                  name="map-marker-outline"
                  size={16}
                  color={fgRgb}
                />
                <View className="ms-2.5 flex-1">
                  <Text className="text-[13px] text-foreground">
                    {t('ads.sampleAddress')}
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
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {/* Fixed Bottom CTA */}
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
          {adsEnabled ? (
            <Pressable
              onPress={() => router.push('/advertise-apply')}
              className="h-[52px] flex-row items-center justify-center rounded-full bg-foreground active:opacity-90"
            >
              <Text className="text-[16px] font-semibold text-background">
                {t('ads.startApplication')}
              </Text>
              <Text className="ms-2 text-[16px] text-background">
                {isRTL ? '\u2190' : '\u2192'}
              </Text>
            </Pressable>
          ) : (
            <View className="h-[52px] items-center justify-center rounded-full bg-foreground/10">
              <Text className="text-[15px] font-semibold text-foreground/50">
                {t('ads.notAccepting')}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

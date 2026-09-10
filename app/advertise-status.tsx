import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/src/components/ui/icon';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useAutoStatusBarStyle } from '@/src/hooks/use-status-bar-style';
import { useMyAds, useCancelAdSubscription, type MyAd } from '@/src/hooks/use-my-ads';
import { BackButton } from '@/src/components/ui/back-button';

// Primary status line shown to the advertiser, derived from subscription +
// submission state.
function statusFor(ad: MyAd, t: TFunction): { label: string; tone: 'good' | 'warn' | 'muted' } {
  switch (ad.subscription_status) {
    case 'canceled':
      return { label: t('ads.statusCanceled'), tone: 'muted' };
    case 'canceling':
      return { label: t('ads.statusCancelsAtPeriodEnd'), tone: 'warn' };
    case 'past_due':
      return { label: t('ads.statusPastDue'), tone: 'warn' };
    case 'pending':
      return { label: t('ads.statusAwaitingPayment'), tone: 'muted' };
  }
  // Subscription active — reflect the review state.
  switch (ad.submission_status) {
    case 'approved':
      return { label: t('ads.statusLive'), tone: 'good' };
    case 'submitted':
      return { label: t('ads.statusUnderReview'), tone: 'warn' };
    case 'pending_payment':
      return { label: t('ads.statusAwaitingPayment'), tone: 'muted' };
    default:
      return { label: t('ads.statusActive'), tone: 'good' };
  }
}

export default function AdvertiseStatusScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useMasjidConfig();
  useAutoStatusBarStyle(colors.background);
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ',')})`;
  const mutedRgb = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.5)`;

  const { data: ads, isLoading } = useMyAds();
  const cancel = useCancelAdSubscription();

  const toneColor = (tone: 'good' | 'warn' | 'muted') =>
    tone === 'good' ? '#15803d' : tone === 'warn' ? '#8a6d1f' : mutedRgb;

  const confirmCancel = (ad: MyAd) => {
    Alert.alert(
      t('ads.cancelConfirmTitle'),
      t('ads.cancelConfirmMessage', { name: ad.business_name ?? t('ads.yourAd') }),
      [
        { text: t('ads.keepIt'), style: 'cancel' },
        {
          text: t('ads.cancelAd'),
          style: 'destructive',
          onPress: () =>
            cancel.mutate(ad.submission_id, {
              onError: (e: any) => Alert.alert(t('ads.errorTitle'), e?.message ?? t('ads.couldNotCancel')),
            }),
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center px-5" style={{ height: 52 }}>
          <BackButton color={fgRgb} />
          <Text style={{ color: fgRgb, fontSize: 16, fontWeight: '600', marginStart: 12 }}>
            {t('ads.myBusinessAds')}
          </Text>
        </View>

        {isLoading ? (
          <View
            className="flex-1 items-center justify-center"
            style={{ marginBottom: insets.top + 52 }}
          >
            <ActivityIndicator color={fgRgb} />
          </View>
        ) : !ads || ads.length === 0 ? (
          <View
            className="flex-1 items-center justify-center px-10"
            style={{ marginBottom: insets.top + 52 }}
          >
            <Icon name="storefront-outline" size={40} color={mutedRgb} />
            <Text style={{ color: mutedRgb, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
              {t('ads.emptyState')}
            </Text>
            <Pressable
              onPress={() => router.push('/advertise')}
              className="mt-5 h-[44px] flex-row items-center justify-center rounded-full bg-foreground px-6 active:opacity-90"
            >
              <Text className="text-[14px] font-semibold text-background">{t('ads.startAnApplication')}</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            className="flex-1 px-5"
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 40, gap: 14 }}
          >
            {ads.map((ad) => {
              const st = statusFor(ad, t);
              return (
                <View
                  key={ad.submission_id}
                  className="overflow-hidden rounded-2xl border border-foreground/10 bg-muted/30"
                >
                  {ad.business_flyer_img ? (
                    <Image
                      source={{ uri: ad.business_flyer_img }}
                      contentFit="cover"
                      style={{ width: '100%', height: 140 }}
                    />
                  ) : null}
                  <View className="p-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="flex-1 text-[16px] font-semibold text-foreground" numberOfLines={1}>
                        {ad.business_name ?? t('ads.yourAd')}
                      </Text>
                      <View className="ms-2 flex-row items-center gap-1.5">
                        <View
                          style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: toneColor(st.tone) }}
                        />
                        <Text style={{ color: toneColor(st.tone), fontSize: 12, fontWeight: '600' }}>
                          {st.label}
                        </Text>
                      </View>
                    </View>

                    {ad.recurring_amount != null ? (
                      <Text className="mt-2 text-[13px] text-foreground/55">
                        {t('ads.perMonth', { amount: `$${ad.recurring_amount.toFixed(0)}` })}
                        {ad.subscription_status === 'canceling' ? t('ads.endingSoonSuffix') : ''}
                      </Text>
                    ) : null}

                    {ad.can_cancel ? (
                      <Pressable
                        onPress={() => confirmCancel(ad)}
                        disabled={cancel.isPending}
                        className="mt-3 h-[42px] items-center justify-center rounded-full border border-foreground/15 active:opacity-70"
                      >
                        <Text className="text-[14px] font-semibold text-foreground/70">
                          {t('ads.cancelSubscription')}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

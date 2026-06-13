import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/src/components/ui/icon';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useMyAds, useCancelAdSubscription, type MyAd } from '@/src/hooks/use-my-ads';

// Primary status line shown to the advertiser, derived from subscription +
// submission state.
function statusFor(ad: MyAd): { label: string; tone: 'good' | 'warn' | 'muted' } {
  switch (ad.subscription_status) {
    case 'canceled':
      return { label: 'Canceled', tone: 'muted' };
    case 'canceling':
      return { label: 'Cancels at period end', tone: 'warn' };
    case 'past_due':
      return { label: 'Payment past due', tone: 'warn' };
    case 'pending':
      return { label: 'Awaiting payment', tone: 'muted' };
  }
  // Subscription active — reflect the review state.
  switch (ad.submission_status) {
    case 'approved':
      return { label: 'Live', tone: 'good' };
    case 'submitted':
      return { label: 'Under review', tone: 'warn' };
    case 'pending_payment':
      return { label: 'Awaiting payment', tone: 'muted' };
    default:
      return { label: 'Active', tone: 'good' };
  }
}

export default function AdvertiseStatusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useMasjidConfig();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ',')})`;
  const mutedRgb = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.5)`;

  const { data: ads, isLoading } = useMyAds();
  const cancel = useCancelAdSubscription();

  const toneColor = (tone: 'good' | 'warn' | 'muted') =>
    tone === 'good' ? '#15803d' : tone === 'warn' ? '#8a6d1f' : mutedRgb;

  const confirmCancel = (ad: MyAd) => {
    Alert.alert(
      'Cancel subscription?',
      `${ad.business_name ?? 'Your ad'} will stay active until the end of the current billing period, then stop.`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel ad',
          style: 'destructive',
          onPress: () =>
            cancel.mutate(ad.submission_id, {
              onError: (e: any) => Alert.alert('Error', e?.message ?? 'Could not cancel.'),
            }),
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center px-5" style={{ height: 52 }}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Icon name="chevron-back" size={22} color={fgRgb} />
          </Pressable>
          <Text style={{ color: fgRgb, fontSize: 16, fontWeight: '600', marginLeft: 12 }}>
            My Business Ads
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
              You haven't applied for any business ads yet.
            </Text>
            <Pressable
              onPress={() => router.push('/advertise')}
              className="mt-5 h-[44px] flex-row items-center justify-center rounded-full bg-foreground px-6 active:opacity-90"
            >
              <Text className="text-[14px] font-semibold text-background">Start an Application</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            className="flex-1 px-5"
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 40, gap: 14 }}
          >
            {ads.map((ad) => {
              const st = statusFor(ad);
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
                        {ad.business_name ?? 'Your ad'}
                      </Text>
                      <View className="ml-2 flex-row items-center gap-1.5">
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
                        ${ad.recurring_amount.toFixed(0)}/month
                        {ad.subscription_status === 'canceling' ? ' · ending soon' : ''}
                      </Text>
                    ) : null}

                    {ad.can_cancel ? (
                      <Pressable
                        onPress={() => confirmCancel(ad)}
                        disabled={cancel.isPending}
                        className="mt-3 h-[42px] items-center justify-center rounded-full border border-foreground/15 active:opacity-70"
                      >
                        <Text className="text-[14px] font-semibold text-foreground/70">
                          Cancel subscription
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

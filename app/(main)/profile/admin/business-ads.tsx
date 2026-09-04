import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from 'react-i18next';

import { Icon } from '@/src/components/ui/icon';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useIsRTL } from '@/src/hooks/use-is-rtl';
import { useAutoStatusBarStyle } from '@/src/hooks/use-status-bar-style';
import {
  useAdSubmissions,
  useAdDecision,
  type AdDecision,
  type AdSubmission,
} from '@/src/hooks/use-ad-submissions';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatMoney(cents: number, currency: string | null): string {
  const amount = (cents / 100).toFixed(2);
  const symbol = !currency || currency.toLowerCase() === 'usd' ? '$' : '';
  return symbol ? `${symbol}${amount}` : `${amount} ${currency!.toUpperCase()}`;
}

const STATUS_META: Record<string, { labelKey: string; bg: string; fg: string }> = {
  pending_payment: { labelKey: 'admin.statusAwaitingPayment', bg: 'rgba(0,0,0,0.06)', fg: 'rgba(0,0,0,0.5)' },
  submitted: { labelKey: 'admin.statusNeedsReview', bg: 'rgba(180,146,42,0.15)', fg: '#8a6d1f' },
  approved: { labelKey: 'admin.statusLive', bg: 'rgba(22,163,74,0.12)', fg: '#15803d' },
  past_due: { labelKey: 'admin.statusPastDue', bg: 'rgba(220,38,38,0.12)', fg: '#b91c1c' },
  canceled: { labelKey: 'admin.statusCanceled', bg: 'rgba(0,0,0,0.06)', fg: 'rgba(0,0,0,0.5)' },
  declined: { labelKey: 'admin.statusDeclined', bg: 'rgba(220,38,38,0.12)', fg: '#b91c1c' },
};

export default function AdminBusinessAds() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const { colors } = useMasjidConfig();
  useAutoStatusBarStyle(colors.card);
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ',')})`;
  const mutedRgb = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.5)`;

  const { data: submissions, isLoading } = useAdSubmissions();
  const decide = useAdDecision();

  /** "Live for 3 days" / "Live for 2 months" — coarse, admin-glanceable. */
  const formatLiveDuration = (iso: string): string => {
    const days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
    if (days < 1) return t('admin.liveSinceToday');
    if (days < 30) return t('admin.liveForDays', { count: days });
    const months = Math.floor(days / 30);
    return t('admin.liveForMonths', { count: months });
  };

  const runDecision = (s: AdSubmission, action: AdDecision) =>
    decide.mutate(
      { submissionId: s.submission_id, action },
      { onError: (e: any) => Alert.alert(t('admin.error'), e?.message ?? t('admin.couldNotComplete')) },
    );

  const confirmApprove = (s: AdSubmission) =>
    Alert.alert(t('admin.approveAdTitle'), t('admin.approveAdMessage', { name: s.business_name ?? t('admin.thisBusiness') }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('admin.approve'), onPress: () => runDecision(s, 'approve') },
    ]);

  const confirmDecline = (s: AdSubmission) =>
    Alert.alert(
      t('admin.declineAdTitle'),
      t('admin.declineAdMessage', { name: s.business_name ?? t('admin.thisApplication') }),
      [
        { text: t('common.back'), style: 'cancel' },
        { text: t('admin.decline'), style: 'destructive', onPress: () => runDecision(s, 'decline') },
      ],
    );

  const confirmCancel = (s: AdSubmission) =>
    Alert.alert(
      t('admin.cancelAdTitle'),
      t('admin.cancelAdMessage', { name: s.business_name ?? t('admin.thisAd') }),
      [
        { text: t('common.back'), style: 'cancel' },
        { text: t('admin.takeDown'), style: 'destructive', onPress: () => runDecision(s, 'cancel') },
      ],
    );

  // Canceled ads are removed from the list for now.
  // Surface review-needed first, then the rest.
  const ordered = [...(submissions ?? [])]
    .filter((s) => s.status !== 'canceled')
    .sort((a, b) => {
      const rank = (s: string | null) => (s === 'submitted' ? 0 : s === 'approved' ? 1 : 2);
      return rank(a.status) - rank(b.status);
    });

  return (
    <View className="flex-1 bg-card" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-5" style={{ height: 52 }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Icon name={isRTL ? 'chevron-forward' : 'chevron-back'} size={22} color={fgRgb} />
        </Pressable>
        <Text style={{ color: fgRgb, fontSize: 16, fontWeight: '600', marginStart: 12 }}>
          {t('admin.businessAds')}
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={fgRgb} />
        </View>
      ) : ordered.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <Icon name="storefront-outline" size={40} color={mutedRgb} />
          <Text style={{ color: mutedRgb, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
            {t('admin.noAdApplications')}
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 120, gap: 14 }}
        >
          {ordered.map((s) => {
            const meta = STATUS_META[s.status ?? ''] ?? null;
            return (
              <View
                key={s.submission_id}
                className="overflow-hidden rounded-2xl border border-foreground/10 bg-background"
              >
                {s.business_flyer_img ? (
                  <Image
                    source={{ uri: s.business_flyer_img }}
                    contentFit="cover"
                    style={{ width: '100%', height: 150 }}
                  />
                ) : (
                  <View className="h-[120px] items-center justify-center bg-foreground/5">
                    <Icon name="image-outline" size={28} color={mutedRgb} />
                  </View>
                )}

                <View className="p-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="flex-1 text-[16px] font-semibold text-foreground" numberOfLines={1}>
                      {s.business_name ?? t('admin.untitledBusiness')}
                    </Text>
                    {meta ? (
                      <View
                        style={{ backgroundColor: meta.bg }}
                        className="ms-2 rounded-full px-2.5 py-1"
                      >
                        <Text style={{ color: meta.fg, fontSize: 10, fontWeight: '700' }}>
                          {t(meta.labelKey).toUpperCase()}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {s.business_address ? (
                    <Text className="mt-1 text-[13px] text-foreground/50" numberOfLines={1}>
                      {s.business_address}
                    </Text>
                  ) : null}
                  <View className="mt-2 gap-0.5">
                    {s.personal_full_name ? (
                      <Text className="text-[12px] text-foreground/60">{s.personal_full_name}</Text>
                    ) : null}
                    {s.personal_email ? (
                      <Text className="text-[12px] text-foreground/45">{s.personal_email}</Text>
                    ) : null}
                    {s.personal_phone ? (
                      <Text className="text-[12px] text-foreground/45">{s.personal_phone}</Text>
                    ) : null}
                  </View>

                  {s.live_since || s.started_at || s.payments.length > 0 ? (
                    <View className="mt-3 rounded-xl border border-foreground/10 bg-foreground/[0.03] px-3.5 py-3">
                      {s.live_since ? (
                        <View className="flex-row items-center">
                          <View
                            style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#16a34a' }}
                          />
                          <Text className="ms-2 text-[12.5px] font-semibold text-foreground/75">
                            {formatLiveDuration(s.live_since)}
                          </Text>
                        </View>
                      ) : null}
                      {s.started_at ? (
                        <Text className="mt-1 text-[12px] text-foreground/50">
                          {t('admin.started', { date: formatDate(s.started_at) })}
                        </Text>
                      ) : null}

                      {s.payments.length > 0 ? (
                        <View className="mt-2.5 border-t border-foreground/10 pt-2.5">
                          <Text className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground/40">
                            {t('admin.payments')}
                          </Text>
                          <View className="gap-1">
                            {s.payments.map((p, i) => (
                              <View
                                key={`${s.submission_id}-pay-${i}`}
                                className="flex-row items-center justify-between"
                              >
                                <Text className="text-[12px] text-foreground/55">
                                  {p.kind === 'first' ? t('admin.firstPayment') : t('admin.monthly')} ·{' '}
                                  {formatDate(p.paid_at)}
                                </Text>
                                <Text className="text-[12.5px] font-semibold text-foreground/75">
                                  {formatMoney(p.amount_cents, p.currency)}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      ) : null}
                    </View>
                  ) : null}

                  {s.status === 'submitted' ? (
                    <View className="mt-3 flex-row gap-2">
                      <Pressable
                        onPress={() => confirmDecline(s)}
                        disabled={decide.isPending}
                        className="h-[42px] flex-1 items-center justify-center rounded-full border border-foreground/15 active:opacity-70"
                      >
                        <Text className="text-[14px] font-semibold text-foreground/70">{t('admin.decline')}</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => confirmApprove(s)}
                        disabled={decide.isPending}
                        className="h-[42px] flex-1 flex-row items-center justify-center rounded-full bg-foreground active:opacity-90"
                      >
                        <Icon name="check" size={18} color={`rgb(${colors.background.replace(/ /g, ',')})`} />
                        <Text className="ms-1.5 text-[14px] font-semibold text-background">{t('admin.approve')}</Text>
                      </Pressable>
                    </View>
                  ) : s.status === 'approved' ? (
                    <Pressable
                      onPress={() => confirmCancel(s)}
                      disabled={decide.isPending}
                      className="mt-3 h-[42px] items-center justify-center rounded-full border border-red-400/40 active:opacity-70"
                    >
                      <Text className="text-[14px] font-semibold text-red-600">{t('admin.takeDownAd')}</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

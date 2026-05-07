import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useSupabase } from '@/src/hooks/use-supabase';
import { useProfile } from '@/src/hooks/use-profile';
import { useConfigStore } from '@/src/stores/config-store';

// ── Types ──────────────────────────────────────────────

interface PaymentMethod {
  type: string;
  brand: string | null;
  last4: string | null;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  description: string | null;
  label: string;
  paymentMethod: PaymentMethod | null;
  amount_refunded?: number;
}

interface GroupedPayments {
  title: string;
  data: Payment[];
}

// ── Helpers ────────────────────────────────────────────

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatAmount = (amount: number, currency: string): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);

const getMonthYear = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const withAlpha = (rgbStr: string, alpha: number): string =>
  rgbStr.replace('rgb(', 'rgba(').replace(')', `,${alpha})`);

const getStatusDisplay = (
  status: string,
  t: { accent: string; mutedFg: string; muted: string },
) => {
  switch (status) {
    case 'succeeded':
      return { badge: 'COMPLETED', color: '#16a34a', bg: 'rgba(22,163,74,0.12)', icon: 'checkmark-circle' as const };
    case 'requires_payment_method':
    case 'requires_action':
      return { badge: 'PENDING', color: '#ca8a04', bg: 'rgba(202,138,4,0.12)', icon: 'time' as const };
    case 'refunded':
      return { badge: 'REFUNDED', color: t.mutedFg, bg: withAlpha(t.mutedFg, 0.1), icon: 'arrow-undo-circle' as const };
    case 'partially_refunded':
      return { badge: 'PARTIAL REFUND', color: t.mutedFg, bg: withAlpha(t.mutedFg, 0.1), icon: 'arrow-undo-circle' as const };
    case 'canceled':
      return { badge: 'CANCELED', color: t.mutedFg, bg: withAlpha(t.mutedFg, 0.08), icon: 'close-circle' as const };
    default:
      return { badge: 'FAILED', color: '#dc2626', bg: 'rgba(220,38,38,0.12)', icon: 'alert-circle' as const };
  }
};

const getPaymentMethodDisplay = (pm: PaymentMethod | null): string => {
  if (!pm) return 'Card';
  if (pm.type === 'apple_pay' || (pm.brand && pm.type === 'card' && pm.brand === 'apple_pay'))
    return 'Apple Pay';
  if (pm.brand && pm.last4) {
    return `${pm.brand.charAt(0).toUpperCase() + pm.brand.slice(1)} ••••${pm.last4}`;
  }
  return 'Card';
};

const groupPaymentsByMonth = (payments: Payment[]): GroupedPayments[] => {
  const groups: Record<string, Payment[]> = {};
  for (const payment of payments) {
    const key = getMonthYear(payment.created);
    if (!groups[key]) groups[key] = [];
    groups[key].push(payment);
  }
  return Object.entries(groups).map(([title, data]) => ({ title, data }));
};

// ── Components ─────────────────────────────────────────

function EmptyState({ fgRgb, accentRgb, cardRgb }: { fgRgb: string; accentRgb: string; cardRgb: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 }}>
      <Animated.View entering={FadeIn.duration(400)} style={{ width: '100%' }}>
        <View
          style={{
            backgroundColor: cardRgb,
            borderRadius: 24,
            padding: 32,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: withAlpha(accentRgb, 0.12),
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <Ionicons name="receipt-outline" size={36} color={accentRgb} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: fgRgb, textAlign: 'center', marginBottom: 8 }}>
            No Payments Yet
          </Text>
          <Text style={{ fontSize: 14, color: withAlpha(fgRgb, 0.6), textAlign: 'center', lineHeight: 20 }}>
            Your donation and payment history will appear here once you make your first transaction.
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

function PaymentCard({
  payment,
  index,
  fgRgb,
  cardRgb,
  accentRgb,
  mutedFgRgb,
  mutedRgb,
}: {
  payment: Payment;
  index: number;
  fgRgb: string;
  cardRgb: string;
  accentRgb: string;
  mutedFgRgb: string;
  mutedRgb: string;
}) {
  const status = getStatusDisplay(payment.status, { accent: accentRgb, mutedFg: mutedFgRgb, muted: mutedRgb });

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(250)}>
      <View
        style={{
          backgroundColor: cardRgb,
          borderRadius: 16,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: withAlpha(fgRgb, 0.05),
          overflow: 'hidden',
          padding: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: status.bg,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name={status.icon} size={20} color={status.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: fgRgb }}>
                {formatAmount(payment.amount, payment.currency)}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: withAlpha(fgRgb, 0.6), marginTop: 2 }}>
                {payment.label || 'Donation'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Ionicons name="card-outline" size={12} color={withAlpha(fgRgb, 0.25)} />
                <Text style={{ fontSize: 11, color: withAlpha(fgRgb, 0.25), marginLeft: 4 }}>
                  {getPaymentMethodDisplay(payment.paymentMethod)}
                </Text>
              </View>
              {(payment.amount_refunded ?? 0) > 0 && (
                <Text style={{ fontSize: 11, color: mutedFgRgb, fontWeight: '500', marginTop: 3 }}>
                  Refunded {formatAmount(payment.amount_refunded!, payment.currency)}
                </Text>
              )}
            </View>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <View style={{ backgroundColor: status.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginBottom: 4 }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: status.color, letterSpacing: 0.5 }}>
                {status.badge}
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: withAlpha(fgRgb, 0.25) }}>{formatDate(payment.created)}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ── Screen ─────────────────────────────────────────────

export default function PaymentHistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const supabase = useSupabase();
  const { profile } = useProfile();
  const { colors } = useMasjidConfig();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);

  const primaryRgb = `rgb(${colors.primary.replace(/ /g, ',')})`;
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ',')})`;
  const bgRgb = `rgb(${colors.background.replace(/ /g, ',')})`;
  const cardRgb = `rgb(${colors.card.replace(/ /g, ',')})`;
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;
  const depthRgb = `rgb(${colors.depth.replace(/ /g, ',')})`;
  const pfgRgb = `rgb(${colors.primaryForeground.replace(/ /g, ',')})`;
  const mutedFgRgb = `rgb(${colors.mutedForeground.replace(/ /g, ',')})`;
  const mutedRgb = `rgb(${colors.muted.replace(/ /g, ',')})`;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showIncomplete, setShowIncomplete] = useState(false);

  const fetchPayments = useCallback(async () => {
    if (!profile?.id || !mosqueUuid) return;
    try {
      const { data, error } = await supabase.functions.invoke('get-payment-history', {
        body: { user_id: profile.id, mosque_id: mosqueUuid },
      });
      if (error) {
        console.log('Error fetching payment history:', error);
        return;
      }
      if (data?.payments) setPayments(data.payments);
    } catch (err) {
      console.log('Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, profile?.id, mosqueUuid]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) setIsLoading(false);
    }, 8000);
    return () => clearTimeout(timeout);
  }, [isLoading]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPayments().finally(() => setRefreshing(false));
  }, [fetchPayments]);

  const completedPayments = useMemo(() => payments.filter((p) => p.status === 'succeeded'), [payments]);
  const incompletePayments = useMemo(() => payments.filter((p) => p.status !== 'succeeded'), [payments]);
  const donationPayments = useMemo(() => completedPayments.filter((p) => (p.label || 'Donation') === 'Donation'), [completedPayments]);
  const businessAdPayments = useMemo(() => completedPayments.filter((p) => p.label && p.label !== 'Donation'), [completedPayments]);

  const groupedDonations = groupPaymentsByMonth(donationPayments);
  const groupedBusinessAds = groupPaymentsByMonth(businessAdPayments);
  const totalDonated = donationPayments.reduce((sum, p) => sum + p.amount, 0);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: bgRgb, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={accentRgb} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: bgRgb }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 16,
          paddingHorizontal: 20,
          backgroundColor: primaryRgb,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={{ marginRight: 16 }}>
          <Ionicons name="chevron-back" size={24} color={pfgRgb} />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '600', color: pfgRgb }}>Payment History</Text>
      </View>

      {payments.length === 0 ? (
        <EmptyState fgRgb={fgRgb} accentRgb={accentRgb} cardRgb={cardRgb} />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentRgb} />}
        >
          {/* Summary Card */}
          <Animated.View entering={FadeIn.duration(300)}>
            <LinearGradient
              colors={[depthRgb, primaryRgb]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 20,
                padding: 24,
                marginBottom: 24,
                overflow: 'hidden',
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '700', color: withAlpha(pfgRgb, 0.5), letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 4 }}>
                TOTAL DONATED
              </Text>
              <Text style={{ fontSize: 32, fontWeight: '800', color: pfgRgb, marginBottom: 8 }}>
                {formatAmount(totalDonated, 'usd')}
              </Text>
              <Text style={{ fontSize: 12, color: withAlpha(pfgRgb, 0.45) }}>
                {donationPayments.length} donation{donationPayments.length !== 1 ? 's' : ''}
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Donations */}
          {donationPayments.length > 0 && (
            <Text style={{ fontSize: 10, fontWeight: '700', color: withAlpha(fgRgb, 0.6), letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 10, marginLeft: 4 }}>
              DONATIONS
            </Text>
          )}
          {groupedDonations.map((group) => (
            <View key={`donation-${group.title}`} style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: withAlpha(fgRgb, 0.37), letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 }}>
                {group.title}
              </Text>
              {group.data.map((payment, index) => (
                <PaymentCard key={payment.id} payment={payment} index={index} fgRgb={fgRgb} cardRgb={cardRgb} accentRgb={accentRgb} mutedFgRgb={mutedFgRgb} mutedRgb={mutedRgb} />
              ))}
            </View>
          ))}

          {/* Business Ads */}
          {businessAdPayments.length > 0 && (
            <>
              <Text style={{ fontSize: 10, fontWeight: '700', color: withAlpha(fgRgb, 0.6), letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 10, marginLeft: 4, marginTop: 8 }}>
                BUSINESS ADS
              </Text>
              {groupedBusinessAds.map((group) => (
                <View key={`business-${group.title}`} style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: withAlpha(fgRgb, 0.37), letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 }}>
                    {group.title}
                  </Text>
                  {group.data.map((payment, index) => (
                    <PaymentCard key={payment.id} payment={payment} index={index} fgRgb={fgRgb} cardRgb={cardRgb} accentRgb={accentRgb} mutedFgRgb={mutedFgRgb} mutedRgb={mutedRgb} />
                  ))}
                </View>
              ))}
            </>
          )}

          {/* Incomplete Payments */}
          {incompletePayments.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => setShowIncomplete(!showIncomplete)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: cardRgb,
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: withAlpha(fgRgb, 0.1),
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: withAlpha(mutedFgRgb, 0.08), justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                    <Ionicons name="alert-circle-outline" size={18} color={mutedFgRgb} />
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: fgRgb }}>Incomplete Payments</Text>
                  <View style={{ backgroundColor: withAlpha(mutedFgRgb, 0.08), borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: mutedFgRgb }}>{incompletePayments.length}</Text>
                  </View>
                </View>
                <Ionicons name={showIncomplete ? 'chevron-up' : 'chevron-down'} size={18} color={withAlpha(fgRgb, 0.25)} />
              </TouchableOpacity>

              {showIncomplete &&
                incompletePayments.map((payment, index) => (
                  <PaymentCard key={payment.id} payment={payment} index={index} fgRgb={fgRgb} cardRgb={cardRgb} accentRgb={accentRgb} mutedFgRgb={mutedFgRgb} mutedRgb={mutedRgb} />
                ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { Icon } from '@/src/components/ui/icon';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useSupabase } from '@/src/hooks/use-supabase';
import { useProfile } from '@/src/hooks/use-profile';
import { useConfigStore } from '@/src/stores/config-store';
import { useIsRTL } from '@/src/hooks/use-is-rtl';

// ── Types ──────────────────────────────────────────────

interface SavedPaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

// ── Helpers ────────────────────────────────────────────

const getCardBrandDisplayName = (brand: string, t: TFunction): string => {
  const names: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    discover: 'Discover',
    jcb: 'JCB',
    diners: 'Diners Club',
  };
  return names[brand?.toLowerCase()] ?? t('profile.card');
};

const getCardBrandIcon = (
  brand: string,
): { name: React.ComponentProps<typeof FontAwesome>['name']; color: string } => {
  switch (brand?.toLowerCase()) {
    case 'visa':
      return { name: 'cc-visa', color: '#1A1F71' };
    case 'mastercard':
      return { name: 'cc-mastercard', color: '#EB001B' };
    case 'amex':
      return { name: 'cc-amex', color: '#006FCF' };
    case 'discover':
      return { name: 'cc-discover', color: '#FF6000' };
    case 'jcb':
      return { name: 'cc-jcb', color: '#0B7CBE' };
    case 'diners':
      return { name: 'cc-diners-club', color: '#0079BE' };
    default:
      return { name: 'credit-card', color: 'gray' };
  }
};

// ── Skeleton ──────────────────────────────────────────

function SkeletonBox({ width, height, borderRadius = 8, style }: { width: number | string; height: number; borderRadius?: number; style?: any }) {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.8, { duration: 900 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: 'currentColor' },
        animatedStyle,
        style,
      ]}
    />
  );
}

function PaymentMethodsSkeleton({ bgRgb, cardRgb, fgRgb, insets }: { bgRgb: string; cardRgb: string; fgRgb: string; insets: any }) {
  const shimmerColor = `${fgRgb}18`;
  return (
    <View style={{ flex: 1, backgroundColor: bgRgb }}>
      {/* Header skeleton */}
      <View style={{ paddingTop: insets.top + 8, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: shimmerColor, marginEnd: 16 }} />
        <SkeletonBox width={140} height={18} style={{ backgroundColor: shimmerColor }} />
      </View>

      <View style={{ padding: 16 }}>
        {/* Security card skeleton */}
        <View style={{ backgroundColor: cardRgb, borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: `${fgRgb}0D` }}>
          <SkeletonBox width={150} height={12} style={{ backgroundColor: shimmerColor, marginBottom: 10 }} />
          <SkeletonBox width="100%" height={10} style={{ backgroundColor: shimmerColor, marginBottom: 6 }} />
          <SkeletonBox width="70%" height={10} style={{ backgroundColor: shimmerColor }} />
        </View>

        {/* Add card button skeleton */}
        <SkeletonBox width="100%" height={48} borderRadius={14} style={{ backgroundColor: shimmerColor, marginBottom: 24 }} />

        {/* Card skeletons */}
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ backgroundColor: cardRgb, borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: `${fgRgb}0D` }}>
            <SkeletonBox width={32} height={22} borderRadius={4} style={{ backgroundColor: shimmerColor, marginEnd: 14 }} />
            <View style={{ flex: 1 }}>
              <SkeletonBox width={100} height={14} style={{ backgroundColor: shimmerColor, marginBottom: 6 }} />
              <SkeletonBox width={140} height={11} style={{ backgroundColor: shimmerColor }} />
            </View>
            <SkeletonBox width={40} height={40} borderRadius={20} style={{ backgroundColor: shimmerColor }} />
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────

export default function PaymentMethodsScreen() {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
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
  const pfgRgb = `rgb(${colors.primaryForeground.replace(/ /g, ',')})`;
  const mutedFgRgb = `rgb(${colors.mutedForeground.replace(/ /g, ',')})`;

  const [cards, setCards] = useState<SavedPaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadCards = useCallback(async () => {
    if (!profile?.id || !mosqueUuid) return;
    try {
      const { data, error } = await supabase.functions.invoke('get-payment-methods', {
        body: { user_id: profile.id, mosque_id: mosqueUuid },
      });
      if (error) {
        const body = error?.context ? await error.context.json().catch(() => null) : null;
        console.log('Error loading payment methods:', body ?? error);
        return;
      }
      if (data?.methods) setCards(data.methods);
    } catch (err) {
      console.log('Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, profile?.id, mosqueUuid]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) setIsLoading(false);
    }, 8000);
    return () => clearTimeout(timeout);
  }, [isLoading]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCards().finally(() => setRefreshing(false));
  }, [loadCards]);

  const handleDelete = (card: SavedPaymentMethod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      t('profile.removeCard'),
      t('profile.removeCardConfirm', { brand: getCardBrandDisplayName(card.brand, t), last4: card.last4 }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.remove'),
          style: 'destructive',
          onPress: async () => {
            setDeletingId(card.id);
            try {
              const { error } = await supabase.functions.invoke('delete-payment-method', {
                body: { user_id: profile?.id, paymentMethodId: card.id, mosque_id: mosqueUuid },
              });
              if (error) {
                // supabase-js collapses any non-2xx into a generic message;
                // the function returns the real reason in the response body.
                const body = error?.context ? await error.context.json().catch(() => null) : null;
                console.log('Error deleting payment method:', body ?? error);
                throw new Error(body?.error || body?.detail || error.message);
              }
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setCards((prev) => prev.filter((c) => c.id !== card.id));
            } catch (err: any) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert(t('profile.error'), err?.message || t('profile.failedToRemoveCard'));
            }
            setDeletingId(null);
          },
        },
      ],
    );
  };

  if (isLoading) {
    return <PaymentMethodsSkeleton bgRgb={bgRgb} cardRgb={cardRgb} fgRgb={fgRgb} insets={insets} />;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, backgroundColor: bgRgb }}>
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 8,
            paddingBottom: 16,
            paddingHorizontal: 20,
            backgroundColor: bgRgb,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ marginEnd: 16 }}>
            <Icon name={isRTL ? 'chevron-forward' : 'chevron-back'} size={24} color={fgRgb} />
          </Pressable>
          <Text style={{ fontSize: 17, fontWeight: '600', color: fgRgb }}>{t('profile.paymentMethods')}</Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          overScrollMode="never"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentRgb} />}
        >
          {/* Security Info */}
          <Animated.View entering={FadeIn.duration(300)}>
            <View
              style={{
                backgroundColor: cardRgb,
                borderRadius: 16,
                padding: 20,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: `${fgRgb}0D`,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Icon name="shield-checkmark" size={16} color={accentRgb} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: accentRgb, letterSpacing: 0.3, marginStart: 6 }}>
                  {t('profile.securedByStripe')}
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: mutedFgRgb, lineHeight: 19 }}>
                {t('profile.stripeSecurityBody')}
              </Text>
            </View>
          </Animated.View>

          {/* Add Card Button */}
          <Animated.View entering={FadeIn.duration(300)}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert(t('profile.comingSoon'), t('profile.cardManagementSoon'));
              }}
              style={{
                backgroundColor: primaryRgb,
                borderRadius: 14,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}
            >
              <Icon name="add" size={20} color={pfgRgb} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: pfgRgb, marginStart: 8 }}>
                {t('profile.addNewCard')}
              </Text>
            </Pressable>
          </Animated.View>

          {/* Card List / Empty State */}
          {cards.length === 0 ? (
            <Animated.View entering={FadeInDown.duration(400).delay(100)} style={{ alignItems: 'center', paddingTop: 40 }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: `rgba(${colors.accent.replace(/ /g, ',')},0.12)`,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <Icon name="card-outline" size={36} color={accentRgb} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: fgRgb, marginBottom: 6 }}>
                {t('profile.noSavedCards')}
              </Text>
              <Text style={{ fontSize: 13, color: mutedFgRgb, textAlign: 'center', paddingHorizontal: 40, lineHeight: 19 }}>
                {t('profile.noSavedCardsBody')}
              </Text>
            </Animated.View>
          ) : (
            <View>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: `${fgRgb}99`,
                  letterSpacing: 1.8,
                  textTransform: 'uppercase',
                  marginBottom: 12,
                  marginStart: 4,
                }}
              >
                {t('profile.savedCardsCount', { count: cards.length })}
              </Text>

              {cards.map((card, index) => {
                const brandIcon = getCardBrandIcon(card.brand);
                return (
                  <Animated.View key={card.id} entering={FadeInDown.duration(300).delay(index * 80)}>
                    <View
                      style={{
                        backgroundColor: cardRgb,
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: `${fgRgb}0D`,
                      }}
                    >
                      <View style={{ marginEnd: 14 }}>
                        <FontAwesome name={brandIcon.name} size={32} color={brandIcon.color} />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: fgRgb }}>
                          {getCardBrandDisplayName(card.brand, t)}
                        </Text>
                        <Text style={{ fontSize: 13, color: mutedFgRgb, marginTop: 2 }}>
                          •••• {card.last4} · {String(card.expMonth).padStart(2, '0')}/{String(card.expYear).slice(-2)}
                        </Text>
                      </View>

                      <Pressable
                        onPress={() => handleDelete(card)}
                        disabled={deletingId === card.id}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: deletingId === card.id ? `${fgRgb}0D` : `${mutedFgRgb}`,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        {deletingId === card.id ? (
                          <ActivityIndicator size="small" color={mutedFgRgb} />
                        ) : (
                          <Icon name="trash-outline" size={18} color={pfgRgb} />
                        )}
                      </Pressable>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

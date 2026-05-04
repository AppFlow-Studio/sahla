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
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useSupabase } from '@/src/hooks/use-supabase';
import { useProfile } from '@/src/hooks/use-profile';

// ── Types ──────────────────────────────────────────────

interface SavedPaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

// ── Helpers ────────────────────────────────────────────

const getCardBrandDisplayName = (brand: string): string => {
  const names: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    discover: 'Discover',
    jcb: 'JCB',
    diners: 'Diners Club',
  };
  return names[brand?.toLowerCase()] ?? 'Card';
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

// ── Screen ─────────────────────────────────────────────

export default function PaymentMethodsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const supabase = useSupabase();
  const { profile } = useProfile();
  const { colors } = useMasjidConfig();

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
    try {
      const { data, error } = await supabase.functions.invoke('get-payment-methods', {
        body: { user_id: profile?.id },
      });
      if (error) {
        console.log('Error loading payment methods:', error);
        return;
      }
      if (data?.methods) setCards(data.methods);
    } catch (err) {
      console.log('Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

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
      'Remove Card',
      `Remove ${getCardBrandDisplayName(card.brand)} ending in ${card.last4}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(card.id);
            try {
              const { error } = await supabase.functions.invoke('delete-payment-method', {
                body: { user_id: profile?.id, paymentMethodId: card.id },
              });
              if (error) throw error;
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setCards((prev) => prev.filter((c) => c.id !== card.id));
            } catch (err: any) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', err?.message || 'Failed to remove card');
            }
            setDeletingId(null);
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: bgRgb, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={accentRgb} />
      </View>
    );
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
            backgroundColor: primaryRgb,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ marginRight: 16 }}>
            <Ionicons name="chevron-back" size={24} color={pfgRgb} />
          </Pressable>
          <Text style={{ fontSize: 17, fontWeight: '600', color: pfgRgb }}>Payment Methods</Text>
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
                <Ionicons name="shield-checkmark" size={16} color={accentRgb} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: accentRgb, letterSpacing: 0.3, marginLeft: 6 }}>
                  SECURED BY STRIPE
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: mutedFgRgb, lineHeight: 19 }}>
                Your payment methods are securely stored by Stripe. Card details are never stored on our servers.
              </Text>
            </View>
          </Animated.View>

          {/* Add Card Button */}
          <Animated.View entering={FadeIn.duration(300)}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert('Coming Soon', 'Card management will be available soon.');
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
              <Ionicons name="add" size={20} color={pfgRgb} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: pfgRgb, marginLeft: 8 }}>
                Add New Card
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
                  backgroundColor: `${accentRgb}20`,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <Ionicons name="card-outline" size={36} color={accentRgb} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: fgRgb, marginBottom: 6 }}>
                No Saved Cards
              </Text>
              <Text style={{ fontSize: 13, color: mutedFgRgb, textAlign: 'center', paddingHorizontal: 40, lineHeight: 19 }}>
                Tap "Add New Card" to save a payment method for quick future donations.
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
                  marginLeft: 4,
                }}
              >
                {cards.length} SAVED {cards.length === 1 ? 'CARD' : 'CARDS'}
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
                      <View style={{ marginRight: 14 }}>
                        <FontAwesome name={brandIcon.name} size={32} color={brandIcon.color} />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: fgRgb }}>
                          {getCardBrandDisplayName(card.brand)}
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
                          <Ionicons name="trash-outline" size={18} color={pfgRgb} />
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

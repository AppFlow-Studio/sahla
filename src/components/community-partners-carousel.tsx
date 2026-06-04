import { useEffect, useMemo, useRef, useState } from 'react';
import { Image } from 'expo-image';
import {
  Animated,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { type CommunityPartner } from '@/src/hooks/use-community-partners';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Theme colors so the carousel works on light (Home) and dark (Prayer) surfaces. */
export type PartnerColors = {
  text: string;
  cardBg: string;
  fallbackBg: string;
  border: string;
};

const AUTO_ADVANCE_MS = 5000;
const openUrl = (url: string) => Linking.openURL(url).catch(() => {});

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Auto-advancing, swipeable carousel of approved business ads, shown in a
 * randomized order. Presentational — the caller fetches `partners` and gates
 * visibility, and passes `colors` for the surrounding surface.
 */
export function CommunityPartnersCarousel({
  partners,
  colors,
}: {
  partners: CommunityPartner[];
  colors: PartnerColors;
}) {
  const ordered = useMemo(() => shuffle(partners), [partners]);

  const [width, setWidth] = useState(0);
  const indexRef = useRef(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (ordered.length < 2 || width === 0) return;
    const id = setInterval(() => {
      const next = (indexRef.current + 1) % ordered.length;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      indexRef.current = next;
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [ordered.length, width]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    indexRef.current = Math.round(e.nativeEvent.contentOffset.x / width);
  };

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Animated.ScrollView
          ref={scrollRef as never}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true },
          )}
          onMomentumScrollEnd={onScrollEnd}
          scrollEnabled={ordered.length > 1}
        >
          {ordered.map((p, i) => {
            // Gently scale + fade each card as it slides through center, so the
            // auto-advance/swipe reads as a smooth glide rather than a hard snap.
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [0.92, 1, 0.92],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.35, 1, 0.35],
              extrapolate: 'clamp',
            });
            return (
              <View key={p.id} style={{ width }}>
                <Animated.View style={{ transform: [{ scale }], opacity }}>
                  <PartnerCard partner={p} colors={colors} />
                </Animated.View>
              </View>
            );
          })}
        </Animated.ScrollView>
      ) : null}
    </View>
  );
}

function PartnerCard({ partner, colors }: { partner: CommunityPartner; colors: PartnerColors }) {
  return (
    <View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: colors.cardBg }}>
      <View style={{ height: 189, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.fallbackBg }}>
        {partner.flyerImg ? (
          <Image source={{ uri: partner.flyerImg }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
        ) : (
          <>
            <MaterialCommunityIcons name="storefront-outline" size={64} color={colors.text} />
            {partner.name ? (
              <Text
                style={{ marginTop: 8, paddingHorizontal: 16, textAlign: 'center', fontSize: 18, fontWeight: '700', color: colors.text, fontFamily: 'Georgia' }}
              >
                {partner.name}
              </Text>
            ) : null}
          </>
        )}
      </View>

      <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
        {partner.flyerImg && partner.name ? (
          <Text style={{ marginBottom: 6, fontSize: 16, fontWeight: '700', color: colors.text, fontFamily: 'Georgia' }}>
            {partner.name}
          </Text>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            {partner.address ? (
              <Text style={{ fontSize: 11, lineHeight: 16, color: colors.text, opacity: 0.85 }}>{partner.address}</Text>
            ) : null}
            {partner.address ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => openUrl('https://maps.apple.com/?q=' + encodeURIComponent(partner.address!))}
                style={{ marginTop: 8, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 5 }}
              >
                <MaterialCommunityIcons name="map-marker-outline" size={12} color={colors.text} />
                <Text style={{ marginLeft: 4, fontSize: 10, fontWeight: '600', color: colors.text }}>Directions</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {partner.phone ? <Pill icon="phone" color={colors.text} border={colors.border} onPress={() => openUrl('tel:' + partner.phone)} /> : null}
            {partner.phone ? <Pill icon="message-text-outline" color={colors.text} border={colors.border} onPress={() => openUrl('sms:' + partner.phone)} /> : null}
            {partner.email ? <Pill icon="email-outline" color={colors.text} border={colors.border} onPress={() => openUrl('mailto:' + partner.email)} /> : null}
          </View>
        </View>
      </View>
    </View>
  );
}

function Pill({ icon, color, border, onPress }: { icon: string; color: string; border: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{ height: 30, width: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15, borderWidth: 1, borderColor: border }}
    >
      <MaterialCommunityIcons name={icon as IconName} size={15} color={color} />
    </TouchableOpacity>
  );
}

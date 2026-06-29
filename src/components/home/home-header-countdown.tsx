import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MasjidLogo from '@/assets/masjid-logo.svg';
import { Icon } from '@/src/components/ui/icon';
import { useFontFamily } from '@/src/hooks/use-font-family';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { usePrayerTimes } from '@/src/hooks/use-prayer-times';
import { HomeHeaderBackdrop } from './home-header-backdrop';
import { PrayerTimesBar } from './prayer-times-bar';

/** "Friday, March 15" in the masjid's timezone. */
function formatGregorian(timeZone?: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    ...(timeZone ? { timeZone } : {}),
  };
  try {
    return new Intl.DateTimeFormat('en-US', opts).format(new Date());
  } catch {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(new Date());
  }
}

/**
 * The new "countdown" home header: a masjid-branded bar (logo + name + bell)
 * over a live H:MM:SS countdown to the next prayer, the date (Gregorian + Hijri),
 * and the prayer-times row. `align` is the ONLY difference between the two
 * countdown header styles:
 *   - 'center' → `countdown-centered` (Figma "homepage final version 1")
 *   - 'left'   → `countdown-left`     (Figma "homepage final version 2")
 */
export function CountdownHomeHeader({ align = 'center' }: { align?: 'center' | 'left' }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const fonts = useFontFamily();
  const { colors, displayName, logoUrl, timezone } = useMasjidConfig();
  const { nextPrayer, countdownClockFull, hijriDate } = usePrayerTimes();

  const accent = colors.accent.replace(/ /g, ',');
  const accentRgb = `rgb(${accent})`;
  const accentSoft = `rgba(${accent},0.8)`; // "Time until" label (Figma: B8922A @ 0.8)
  const fg = `rgb(${colors.primaryForeground.replace(/ /g, ',')})`;
  const dateColor = `rgba(${colors.primaryForeground.replace(/ /g, ',')},0.8)`;

  const gregorian = formatGregorian(timezone);
  const alignItems = align === 'center' ? 'center' : 'flex-start';
  const textAlign = align === 'center' ? 'center' : 'left';

  return (
    <View className="overflow-hidden bg-primary" style={{ paddingTop: insets.top + 12 }}>
      <HomeHeaderBackdrop />

      {/* Masjid identity bar: logo + name (left), notifications bell (right). */}
      <View className="flex-row items-center justify-between px-5">
        <View className="min-w-0 flex-1 flex-row items-center gap-2 pe-3">
          {logoUrl ? (
            <Image
              source={{ uri: logoUrl }}
              style={{ width: 18, height: 18, borderRadius: 5 }}
              contentFit="cover"
            />
          ) : (
            <MasjidLogo width={18} height={18} />
          )}
          <Text
            numberOfLines={1}
            style={{ color: fg, fontSize: 13, fontWeight: '600', fontFamily: fonts.bodySemibold }}
          >
            {displayName}
          </Text>
        </View>
        <Pressable
          hitSlop={12}
          onPress={() => router.push('/profile/notification-center')}
          accessibilityRole="button"
          accessibilityLabel={t('home.notifications', { defaultValue: 'Notifications' })}
        >
          <Icon name="bell" size={16} color={fg} />
        </Pressable>
      </View>

      {/* Hero: countdown label + live H:MM:SS timer + date. Alignment per variant. */}
      <View className="px-5" style={{ marginTop: 30, alignItems }}>
        {nextPrayer ? (
          <Text
            style={{
              color: accentSoft,
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 0.55,
              textTransform: 'uppercase',
              textAlign,
            }}
          >
            {t('home.timeUntil', { name: nextPrayer.name })}
          </Text>
        ) : null}

        <Text
          style={{
            color: fg,
            fontSize: 38,
            lineHeight: 52,
            letterSpacing: -2,
            marginTop: 2,
            fontFamily: fonts.displayRegular,
            textAlign,
          }}
        >
          {countdownClockFull ?? '—'}
        </Text>

        <View
          style={{
            marginTop: 4,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: align === 'center' ? 'center' : 'flex-start',
          }}
        >
          <Text style={{ color: dateColor, fontSize: 13 }}>{gregorian}</Text>
          {hijriDate ? (
            <>
              <View
                style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: accentRgb, marginHorizontal: 7 }}
              />
              <Text style={{ color: dateColor, fontSize: 13 }}>{hijriDate}</Text>
            </>
          ) : null}
        </View>
      </View>

      <View style={{ marginTop: 34 }} className="pb-6">
        <PrayerTimesBar />
      </View>
    </View>
  );
}

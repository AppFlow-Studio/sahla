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

  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;
  const fg = `rgb(${colors.primaryForeground.replace(/ /g, ',')})`;
  const fgMuted = `rgba(${colors.primaryForeground.replace(/ /g, ',')},0.6)`;

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
              style={{ width: 26, height: 26, borderRadius: 7 }}
              contentFit="cover"
            />
          ) : (
            <MasjidLogo width={24} height={24} />
          )}
          <Text
            numberOfLines={1}
            style={{ color: fg, fontSize: 16, fontWeight: '700', fontFamily: fonts.bodySemibold }}
          >
            {displayName}
          </Text>
        </View>
        <Pressable
          hitSlop={10}
          onPress={() => router.push('/profile/notification-center')}
          accessibilityRole="button"
          accessibilityLabel={t('home.notifications', { defaultValue: 'Notifications' })}
        >
          <Icon name="bell" size={22} color={fg} />
        </Pressable>
      </View>

      {/* Hero: countdown label + live H:MM:SS timer + date. Alignment per variant. */}
      <View className="px-5" style={{ marginTop: 28, alignItems }}>
        {nextPrayer ? (
          <Text
            style={{
              color: accentRgb,
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1.5,
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
            fontSize: 52,
            lineHeight: 60,
            letterSpacing: -1,
            marginTop: 6,
            fontFamily: fonts.displayRegular,
            textAlign,
          }}
        >
          {countdownClockFull ?? '—'}
        </Text>

        <Text style={{ color: fgMuted, fontSize: 13, fontWeight: '500', marginTop: 6, textAlign }}>
          {gregorian}
          {hijriDate ? `  ·  ${hijriDate}` : ''}
        </Text>
      </View>

      <View className="mt-7 pb-6">
        <PrayerTimesBar />
      </View>
    </View>
  );
}

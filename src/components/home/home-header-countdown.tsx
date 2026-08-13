import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MasjidLogo from '@/assets/masjid-logo.svg';
import { Icon } from '@/src/components/ui/icon';
import { LTR_ROW, LTR_START } from '@/src/i18n/ltr';
import { useFontFamily } from '@/src/hooks/use-font-family';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { usePrayerTimes } from '@/src/hooks/use-prayer-times';
import { useNotificationStatus } from '@/src/hooks/use-notification-status';
import { HomeHeaderBackdrop } from './home-header-backdrop';
import { PrayerTimesBar } from './prayer-times-bar';

/**
 * "Friday, March 15" in the masjid's timezone, in the active language. Digits
 * are pinned to Latin (`-nu-latn`) to match the countdown clock and the prayer
 * strip — see `formatTo12Hour` in `use-prayer-times`.
 */
function formatGregorian(timeZone: string | undefined, locale: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    ...(timeZone ? { timeZone } : {}),
  };
  const tag = `${locale.split('-')[0] || 'en'}-u-nu-latn`;
  for (const candidate of [tag, 'en-US']) {
    try {
      return new Intl.DateTimeFormat(candidate, opts).format(new Date());
    } catch {
      // Fall through: bad tag or unsupported timeZone.
    }
  }
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
}

/**
 * The new "countdown" home header: a masjid-branded bar (logo + name + bell)
 * over a live H:MM:SS countdown to the next prayer, the date (Gregorian + Hijri),
 * and the prayer-times row. `align` is the ONLY difference between the two
 * countdown header styles:
 *   - 'center' → `countdown-centered` (Figma "homepage final version 1")
 *   - 'left'   → `countdown-left`     (Figma "homepage final version 2")
 *
 * Layout is pinned left-to-right in every language (`LTR_ROW` / `LTR_START`):
 * the branding bar and the Fajr → Isha strip keep their designed positions
 * under RTL. Only the text inside translates.
 */
/** Masjid mark in the branding bar. Sized against the name beside it. */
const LOGO_SIZE = 26;

/** Masjid name in the branding bar. */
const NAME_SIZE = 15;

export function CountdownHomeHeader({ align = 'center' }: { align?: 'center' | 'left' }) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const fonts = useFontFamily();
  const { colors, displayName, logoUrl, timezone } = useMasjidConfig();
  const { nextPrayer, countdownClockFull, hijriDate } = usePrayerTimes();
  // Bell reflects notification permission: filled-accent when on, outline when off.
  const notifGranted = useNotificationStatus().permissionGranted;

  const accent = colors.accent.replace(/ /g, ',');
  const accentRgb = `rgb(${accent})`;
  const accentSoft = `rgba(${accent},0.8)`; // "Time until" label (Figma: B8922A @ 0.8)
  const fg = `rgb(${colors.primaryForeground.replace(/ /g, ',')})`;
  const dateColor = `rgba(${colors.primaryForeground.replace(/ /g, ',')},0.8)`;

  const gregorian = formatGregorian(timezone, i18n.language);
  const alignItems = align === 'center' ? 'center' : LTR_START;
  const textAlign = align === 'center' ? 'center' : 'left';

  return (
    <View className="overflow-hidden bg-primary" style={{ paddingTop: insets.top + 12 }}>
      <HomeHeaderBackdrop variant="band" />

      {/* Masjid identity bar: logo + name (left), notifications bell (right). */}
      <View className="items-center justify-between px-5" style={{ flexDirection: LTR_ROW }}>
        <View
          className="min-w-0 flex-1 items-center gap-2"
          style={{ flexDirection: LTR_ROW, paddingRight: 12 }}
        >
          {logoUrl ? (
            <Image
              source={{ uri: logoUrl }}
              style={{ width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: 6 }}
              contentFit="cover"
            />
          ) : (
            <MasjidLogo width={LOGO_SIZE} height={LOGO_SIZE} />
          )}
          <Text
            numberOfLines={1}
            style={{
              color: fg,
              fontSize: NAME_SIZE,
              fontWeight: '600',
              fontFamily: fonts.bodySemibold,
              textAlign: 'left',
            }}
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
          <Icon
            name="bell"
            size={16}
            color={notifGranted ? accentRgb : fg}
            fill={notifGranted ? accentRgb : 'none'}
          />
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
            {t('home.timeUntil', {
              name: t(`prayer.${nextPrayer.rawName}`, { defaultValue: nextPrayer.name }),
            })}
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
            // LTR_ROW keeps Gregorian · Hijri in that order under RTL, where a
            // plain 'row' would render the pair backwards.
            flexDirection: LTR_ROW,
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

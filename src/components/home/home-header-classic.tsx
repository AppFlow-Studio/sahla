import { useUser } from '@clerk/clerk-expo';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFontFamily } from '@/src/hooks/use-font-family';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useOnboardingStore } from '@/src/stores/onboarding-store';
import { usePrayerTimes } from '@/src/hooks/use-prayer-times';
import { LTR_ROW } from '@/src/i18n/ltr';
import { HomeHeaderBackdrop } from './home-header-backdrop';
import { PrayerTimesBar } from './prayer-times-bar';

/**
 * The original home header (the default `classic` header style): a personalized
 * greeting, the big live clock, the Hijri date, the next-prayer iqamah line, and
 * the prayer-times row. Selected when `mosques.header_style` is `classic`.
 *
 * Like the countdown header, this block is pinned left-to-right in every
 * language so the header keeps its designed layout under RTL; the text inside
 * still translates.
 */
export function ClassicHomeHeader() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const fonts = useFontFamily();
  const { clerkOrgId } = useMasjidConfig();
  const { user } = useUser();
  const storedFirstName = useOnboardingStore((s) => s.firstName);
  const { currentTime, hijriDate, nextPrayer } = usePrayerTimes();

  // Read firstName: Clerk metadata (org-keyed) → onboarding store → Clerk user
  const meta = user?.publicMetadata as Record<string, any> | undefined;
  const firstName =
    (clerkOrgId ? meta?.[clerkOrgId]?.firstName : null) ??
    (storedFirstName.trim() || null) ??
    user?.firstName ??
    '';

  return (
    <View className="overflow-hidden bg-primary" style={{ paddingTop: insets.top + 16 }}>
      <HomeHeaderBackdrop />

      <View className="px-5">
        <Text
          className="text-primary-foreground/50"
          style={{
            fontSize: 9,
            fontWeight: '700',
            letterSpacing: 1.62,
            textTransform: 'uppercase',
            textAlign: 'left',
          }}
        >
          {t('home.greeting')}{firstName ? ` ${firstName}` : ''}!
        </Text>

        <Text
          className="text-primary-foreground"
          style={{
            fontSize: 45,
            lineHeight: 52,
            marginTop: 8,
            letterSpacing: -2,
            fontFamily: fonts.displayRegular,
            textAlign: 'left',
          }}
        >
          {currentTime}
        </Text>

        {hijriDate ? (
          <Text
            className="text-primary-foreground"
            style={{ fontSize: 13, fontWeight: '600', marginTop: 4, textAlign: 'left' }}
          >
            {hijriDate}
          </Text>
        ) : null}

        {nextPrayer && (
          <View className="mt-3 items-center" style={{ flexDirection: LTR_ROW }}>
            <Text style={{ fontSize: 13, textAlign: 'left' }}>
              <Text className="text-primary-foreground/50">
                {t(`prayer.${nextPrayer.rawName}`, { defaultValue: nextPrayer.name })}
              </Text>
              <Text className="text-primary-foreground/80">
                {' '}
                {t('home.prayerTypeIn', {
                  type: t(`prayer.${nextPrayer.type}`, { defaultValue: nextPrayer.type }),
                  time: nextPrayer.timeRemaining,
                })}
              </Text>
            </Text>
          </View>
        )}
      </View>

      <View className="mt-6 pb-6">
        <PrayerTimesBar />
      </View>
    </View>
  );
}

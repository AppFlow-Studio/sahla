import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { Icon } from '@/src/components/ui/icon';
import type { IconName } from '@/src/components/ui/icon';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useIsRTL } from '@/src/hooks/use-is-rtl';
import { useContentItems, type ContentItem } from '@/src/hooks/use-content-items';
import { describeRecurrence, ruleFromRow } from '@/src/lib/recurrence';

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatProgramDate(item: ContentItem): string {
  // Recurring programs have no single start_date — describe the pattern.
  if (item.recurrence_freq && item.recurrence_freq !== 'once') {
    return describeRecurrence(ruleFromRow(item)) ?? (item.days ?? []).join(', ');
  }
  if (item.start_date) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(item.start_date);
    if (m) {
      const month = SHORT_MONTHS[Number(m[2]) - 1];
      if (month) return `${month} ${Number(m[3])}, ${m[1]}`;
    }
  }
  if (item.days && item.days.length > 0) return item.days.join(', ');
  return '';
}

function categoryFor(item: ContentItem, t: TFunction): string {
  if (item.is_quran) return t('home.categoryQuranStudy');
  if (item.is_kids) return t('home.categoryKids');
  if (item.is_pace) return t('home.categoryPace');
  if (item.is_young_professionals) return t('home.categoryYoungProfessionals');
  if (item.is_fourteen_plus) return t('home.categoryYouth');
  if (item.is_weekly_program) return t('home.categoryWeeklyProgram');
  return '';
}

function iconFor(item: ContentItem): IconName {
  if (item.is_quran) return 'book-open-page-variant';
  if (item.is_kids) return 'account-child';
  if (item.is_pace) return 'school';
  if (item.is_young_professionals) return 'briefcase-outline';
  return 'star-outline';
}

export function ProgramsSection() {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const { colors } = useMasjidConfig();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ',')})`;
  const { items, status, error } = useContentItems();
  const programs = items.filter((i) => i.type === 'program').slice(0, 3);

  if (programs.length === 0) return null;

  return (
    <View>
      <View className="flex-row items-center justify-between pb-3">
        <Text className="text-[13px] font-semibold uppercase tracking-[1px] text-foreground">
          {t('home.programs')}
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/discover?tab=Programs')}
        >
          <Text className="text-[10px] text-foreground/60">{t('home.seeAll')} {isRTL ? '←' : '→'}</Text>
        </TouchableOpacity>
      </View>
      <View className="border-t border-foreground">
        {status === 'loading' && (
          <Text className="py-4 text-[12px] text-foreground/60">{t('common.loading')}</Text>
        )}
        {status === 'error' && (
          <Text className="py-4 text-[12px] text-foreground/60">{t('home.couldNotLoad', { error })}</Text>
        )}
        {status === 'success' && programs.length === 0 && (
          <Text className="py-4 text-[12px] text-foreground/60">{t('home.noProgramsYet')}</Text>
        )}
        {programs.map((program, index) => (
          <TouchableOpacity
            key={program.content_id}
            activeOpacity={0.7}
            onPress={() => router.push(`/content/${program.content_id}`)}
            className={`flex-row items-center py-4 ${
              index < programs.length - 1 ? 'border-b border-foreground/10' : ''
            }`}
          >
            <View className="me-3 h-[50px] w-[50px] items-center justify-center overflow-hidden rounded-[10px] bg-primary/10">
              {program.image ? (
                <Image
                  source={{ uri: program.image }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <Icon
                  name={iconFor(program)}
                  size={24}
                  color={fgRgb}
                />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-semibold text-foreground" numberOfLines={1}>
                {program.name ?? t('home.untitled')}
              </Text>
              <Text className="mt-0.5 text-[10px] text-foreground/60" numberOfLines={1}>
                {formatProgramDate(program)}
              </Text>
              <Text className="mt-0.5 text-[10px] text-accent" numberOfLines={1}>
                {categoryFor(program, t)}
              </Text>
            </View>
            <Icon
              name={isRTL ? 'chevron-left' : 'chevron-right'}
              size={16}
              color={`rgba(${colors.foreground.replace(/ /g, ',')},0.4)`}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

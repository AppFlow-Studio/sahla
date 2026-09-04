import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/src/components/ui/icon';
import { useFontFamily } from '@/src/hooks/use-font-family';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useIsRTL } from '@/src/hooks/use-is-rtl';
import { useAutoStatusBarStyle } from '@/src/hooks/use-status-bar-style';
import { useSpeakers } from '@/src/hooks/use-speakers';
import {
  CONTENT_TYPES,
  WEEK_DAYS,
  useAdminContentItems,
  useCreateContentItem,
  useDeleteContentItem,
  useUpdateContentItem,
  useUploadContentImage,
  type AdminContentItem,
  type ContentType,
} from '@/src/hooks/use-content-admin';
import { TimePicker } from '@/src/components/admin/time-picker';
import { DatePicker } from '@/src/components/admin/date-picker';
import { FilterButton } from '@/src/components/admin/filter-button';
import {
  WEEK_OF_MONTH_OPTIONS,
  describeRecurrence,
  type RecurrenceFreq,
} from '@/src/lib/recurrence';

const SCREEN_H = Dimensions.get('window').height;

type Filter = 'all' | 'program' | 'event';
const FILTERS: { value: Filter; labelKey: string }[] = [
  { value: 'all', labelKey: 'common.all' },
  { value: 'program', labelKey: 'admin.filterPrograms' },
  { value: 'event', labelKey: 'admin.filterEvents' },
];

type DateFilter = 'all' | 'upcoming' | 'past';
const DATE_FILTER_VALUES: DateFilter[] = ['all', 'upcoming', 'past'];

type TFn = (key: string, opts?: Record<string, unknown>) => string;

// Labels follow the active type tab so the wording matches what the user is
// actually filtering: "All events" on Events, "All programs" on Programs,
// "All events and programs" on All.
function dateFilterLabel(t: TFn, value: DateFilter, filter: Filter): string {
  const noun =
    filter === 'event'
      ? t('admin.nounEvents')
      : filter === 'program'
        ? t('admin.nounPrograms')
        : t('admin.nounEventsAndPrograms');
  const prefix =
    value === 'all'
      ? t('admin.datePrefixAll')
      : value === 'upcoming'
        ? t('admin.datePrefixUpcoming')
        : t('admin.datePrefixPast');
  return `${prefix} ${noun}`;
}

function typeLabel(type: string) {
  return CONTENT_TYPES.find((t) => t.value === type)?.label ?? type;
}

// content_items.start_time is stored as 24-hour `HH:MM` or `HH:MM:SS`. The
// list cell shows it to admins in 12-hour format, dropping the seconds.
function formatTime12(time: string | null | undefined): string {
  if (!time) return '';
  const m = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!m) return time;
  const hour = Number(m[1]);
  const minute = m[2];
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${minute} ${period}`;
}

export default function ProgramsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const fonts = useFontFamily();
  const { colors } = useMasjidConfig();
  useAutoStatusBarStyle(colors.card);
  const fg = colors.foreground.replace(/ /g, ',');
  const fgRgb = `rgb(${fg})`;
  const mutedRgb = `rgba(${fg}, 0.5)`;
  const borderColor = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.1)`;
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;
  const cardRgb = `rgb(${colors.card.replace(/ /g, ',')})`;

  const { items, isLoading } = useAdminContentItems();
  const deleteItem = useDeleteContentItem();

  const [editing, setEditing] = useState<AdminContentItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const filteredItems = useMemo(() => {
    // Type filter (All / Programs / Events tabs)
    const typeFiltered =
      filter === 'all' ? items : items.filter((i) => i.type === filter);

    // Date filter (popover next to +).
    // YYYY-MM-DD string compare so "today" boundary lines up with how
    // start_date is stored. Items without a start_date are excluded from
    // upcoming/past (they're typically open-ended recurring programs).
    if (dateFilter === 'all') return typeFiltered;
    const today = new Date().toISOString().slice(0, 10);
    return typeFiltered.filter((i) => {
      if (!i.start_date) return false;
      return dateFilter === 'upcoming' ? i.start_date >= today : i.start_date < today;
    });
  }, [items, filter, dateFilter]);


  const handleAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleEdit = (item: AdminContentItem) => {
    setEditing(item);
    setShowForm(true);
  };

  const handleDelete = (item: AdminContentItem) => {
    Alert.alert(
      t('admin.deleteItemTitle'),
      t('admin.deleteItemMessage', { name: item.name ?? t('admin.thisItem') }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.delete'),
          style: 'destructive',
          onPress: () => deleteItem.mutate(item.content_id),
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-card">
      <View style={{ flex: 1, paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5" style={{ height: 52 }}>
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Icon name={isRTL ? 'chevron-forward' : 'chevron-back'} size={22} color={fgRgb} />
          </Pressable>
          <Text style={{ color: fgRgb, fontSize: 16, fontWeight: '600', marginStart: 12 }}>
            {t('admin.programsEvents')}
          </Text>
        </View>
        {/* The date-filter button is rendered as a screen-root overlay (see
            <FilterButton/> below) so it can morph open over the page — it
            floats one gap to the left of the "+". */}
        <View className="flex-row items-center" style={{ gap: 14 }}>
          <TouchableOpacity onPress={handleAdd} activeOpacity={0.7} hitSlop={8}>
            <Icon name="add-circle-outline" size={26} color={accentRgb} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter tabs — visual style mirrors DiscoverHeader / saved-clips:
          plain label with a thin 16px underline under the active tab. */}
      <View className="flex-row items-center gap-4 px-5 pb-3">
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <Pressable key={f.value} onPress={() => setFilter(f.value)} hitSlop={6}>
              <Text
                style={{
                  fontFamily: active ? fonts.bodySemibold : fonts.bodyMedium,
                  fontSize: 12,
                  fontWeight: active ? '600' : '500',
                  color: active ? fgRgb : mutedRgb,
                }}
              >
                {t(f.labelKey)}
              </Text>
              {active ? (
                <View
                  className="mt-1 h-px w-4"
                  style={{ backgroundColor: fgRgb }}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={fgRgb} />
        </View>
      ) : filteredItems.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <Icon name="megaphone-outline" size={48} color={mutedRgb} />
          <Text style={{ color: mutedRgb, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
            {items.length === 0
              ? t('admin.noProgramsOrEvents')
              : dateFilter !== 'all'
                ? t('admin.noFilteredItems', {
                    label: dateFilterLabel(t, dateFilter, filter).toLowerCase(),
                  })
                : filter === 'program'
                  ? t('admin.noProgramsYet')
                  : t('admin.noEventsYet')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(i) => i.content_id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}
          renderItem={({ item }) => (
            <ContentCard
              item={item}
              fgRgb={fgRgb}
              mutedRgb={mutedRgb}
              borderColor={borderColor}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
        />
      )}

        <ContentFormModal visible={showForm} item={editing} onClose={() => setShowForm(false)} />
      </View>

      {/* Date-filter button — a glass disc that morphs into its options
          popover, anchored at the header's top-right. */}
      <FilterButton
        value={dateFilter}
        options={DATE_FILTER_VALUES.map((v) => ({
          id: v,
          title: dateFilterLabel(t, v, filter),
        }))}
        onChange={(id) => setDateFilter(id as DateFilter)}
        fgRgb={fgRgb}
        accentRgb={accentRgb}
        cardRgb={cardRgb}
        borderColor={borderColor}
        insetsTop={insets.top}
        active={dateFilter !== 'all'}
      />
    </View>
  );
}

// ── Content Card ──────────────────────────────────────────

function ContentCard({
  item,
  fgRgb,
  mutedRgb,
  borderColor,
  onEdit,
  onDelete,
}: {
  item: AdminContentItem;
  fgRgb: string;
  mutedRgb: string;
  borderColor: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const schedule =
    item.recurrence_freq && item.recurrence_freq !== 'once'
      ? (describeRecurrence({
          freq: item.recurrence_freq as RecurrenceFreq,
          interval: item.recurrence_interval ?? 1,
          days: item.days,
          anchor: item.recurrence_anchor,
          weekOfMonth: item.week_of_month,
          startDate: item.start_date,
          endDate: item.end_date,
        }) ?? '')
      : item.is_weekly_program
        ? (item.days ?? []).map((d) => d.slice(0, 3)).join(', ')
        : (item.start_date ?? '');
  const sub = [typeLabel(item.type), schedule, formatTime12(item.start_time)].filter(Boolean).join(' · ');

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 0.5,
        borderBottomColor: borderColor,
      }}
    >
      <View
        style={{
          width: 56,
          height: 44,
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: borderColor,
          marginEnd: 12,
        }}
      >
        {item.image ? (
          <Image source={{ uri: item.image }} style={{ width: 56, height: 44 }} />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Icon name="image-outline" size={18} color={mutedRgb} />
          </View>
        )}
      </View>

      <View className="flex-1">
        <Text style={{ color: fgRgb, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
          {item.name ?? t('admin.untitled')}
        </Text>
        <Text style={{ color: mutedRgb, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
          {sub}
        </Text>
      </View>

      <TouchableOpacity onPress={onEdit} hitSlop={8} style={{ marginEnd: 12 }}>
        <Icon name="pencil-outline" size={18} color={mutedRgb} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} hitSlop={8}>
        <Icon name="trash-outline" size={18} color="rgb(239,68,68)" />
      </TouchableOpacity>
    </View>
  );
}

// ── Content Form Modal ────────────────────────────────────

function ContentFormModal({
  visible,
  item,
  onClose,
}: {
  visible: boolean;
  item: AdminContentItem | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useMasjidConfig();
  const insets = useSafeAreaInsets();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ',')})`;
  const bgRgb = `rgb(${colors.card.replace(/ /g, ',')})`;
  const labelColor = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.6)`;
  const borderColor = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.1)`;
  const placeholderColor = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.25)`;
  const mutedRgb = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.5)`;
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;

  const createItem = useCreateContentItem();
  const updateItem = useUpdateContentItem();
  const { pickAndUpload, isUploading } = useUploadContentImage();
  const { speakers } = useSpeakers();

  const todayStr = new Date().toLocaleDateString('en-CA');

  const isEditing = item !== null;
  const mutation = isEditing ? updateItem : createItem;

  const [name, setName] = useState('');
  const [type, setType] = useState<ContentType>('event');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [freq, setFreq] = useState<RecurrenceFreq>('once');
  const [repeatInterval, setRepeatInterval] = useState(1);
  const [weekOfMonth, setWeekOfMonth] = useState(1);
  const [anchor, setAnchor] = useState('');
  const [days, setDays] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([]);
  const [isKids, setIsKids] = useState(false);
  const [isFourteenPlus, setIsFourteenPlus] = useState(false);
  const [isYoungPros, setIsYoungPros] = useState(false);

  const [mounted, setMounted] = useState(false);
  const [keyboardUp, setKeyboardUp] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const animate = (duration?: number) =>
      LayoutAnimation.configureNext({
        duration: duration ?? 250,
        update: { type: LayoutAnimation.Types.keyboard ?? LayoutAnimation.Types.easeInEaseOut },
      });
    const showSub = Keyboard.addListener(showEvt, (e) => {
      animate(e.duration);
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
      setKeyboardUp(true);
    });
    const hideSub = Keyboard.addListener(hideEvt, (e) => {
      animate(e?.duration);
      setKeyboardUp(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // When the keyboard is up, shrink the sheet from the top so the whole thing
  // fits in the space above the keyboard instead of clipping.
  const sheetMaxHeight = keyboardUp
    ? SCREEN_H - keyboardHeight - insets.top - 20
    : SCREEN_H * 0.84;

  useEffect(() => {
    if (visible) {
      setName(item?.name ?? '');
      setType((item?.type as ContentType) ?? 'event');
      setDescription(item?.description ?? '');
      setImage(item?.image ?? null);
      const initFreq: RecurrenceFreq =
        (item?.recurrence_freq as RecurrenceFreq) ??
        (item?.is_weekly_program ? 'weekly' : 'once');
      setFreq(initFreq);
      setRepeatInterval(item?.recurrence_interval ?? 1);
      setWeekOfMonth(item?.week_of_month ?? 1);
      setAnchor(item?.recurrence_anchor ?? todayStr);
      setDays(item?.days ?? []);
      setStartDate(item?.start_date ?? '');
      setEndDate(item?.end_date ?? '');
      setStartTime(item?.start_time ?? '16:00');
      setSelectedSpeakers(item?.speakers ?? []);
      setIsKids(item?.is_kids ?? false);
      setIsFourteenPlus(item?.is_fourteen_plus ?? false);
      setIsYoungPros(item?.is_young_professionals ?? false);
    }
  }, [visible, item]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 0,
          duration: 160,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: SCREEN_H,
          duration: 260,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [visible, translateY, backdrop, mounted]);

  const handlePickImage = useCallback(async () => {
    const key = item?.content_id ?? 'draft-' + Date.now();
    try {
      const url = await pickAndUpload(key, 'gallery');
      if (url) setImage(url);
    } catch (e) {
      // Surface real failures (permission denied, upload errors) instead of
      // silently doing nothing.
      Alert.alert(t('admin.couldNotAddImage'), e instanceof Error ? e.message : t('admin.pleaseTryAgain'));
    }
  }, [item, pickAndUpload]);

  // Weekly programs can land on several weekdays; monthly "Nth weekday" picks
  // exactly one.
  const toggleDay = (day: string) =>
    setDays((prev) =>
      freq === 'monthly'
        ? [day]
        : prev.includes(day)
          ? prev.filter((d) => d !== day)
          : [...prev, day],
    );

  const toggleSpeaker = (n: string) =>
    setSelectedSpeakers((prev) =>
      prev.includes(n) ? prev.filter((s) => s !== n) : [...prev, n],
    );

  const isRecurring = freq !== 'once';

  const handleSave = () => {
    const payload = {
      name: name.trim(),
      type,
      description: description.trim() || null,
      image,
      start_time: startTime.trim() || null,
      end_date: endDate.trim() || null,
      // is_weekly_program is kept for back-compat reads; recurrence_* is the
      // source of truth. Recurring items repeat on days[] from recurrence_anchor
      // with no single start_date; one-time events use start_date only.
      is_weekly_program: isRecurring,
      recurrence_freq: freq,
      recurrence_interval: isRecurring ? repeatInterval : 1,
      recurrence_anchor: isRecurring ? anchor.trim() || null : null,
      week_of_month: freq === 'monthly' ? weekOfMonth : null,
      days: isRecurring ? days : null,
      start_date: isRecurring ? null : startDate.trim() || null,
      speakers: selectedSpeakers.length > 0 ? selectedSpeakers : null,
      is_kids: isKids,
      is_fourteen_plus: isFourteenPlus,
      is_young_professionals: isYoungPros,
    };

    if (isEditing && item) {
      updateItem.mutate({ content_id: item.content_id, ...payload }, { onSuccess: onClose });
    } else {
      createItem.mutate(payload, { onSuccess: onClose });
    }
  };

  const scheduleValid =
    freq === 'once'
      ? startDate.trim().length > 0
      : freq === 'weekly'
        ? days.length > 0 && anchor.trim().length > 0
        : days.length === 1 && anchor.trim().length > 0;
  const canSave = name.trim().length > 0 && scheduleValid && !mutation.isPending;

  const recurrencePreview = isRecurring
    ? describeRecurrence({
        freq,
        interval: repeatInterval,
        days,
        anchor,
        weekOfMonth,
        startDate: null,
        endDate: endDate.trim() || null,
      })
    : null;

  const sectionLabel = (text: string) => (
    <Text
      style={{
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        color: labelColor,
        marginBottom: 8,
      }}
    >
      {text}
    </Text>
  );

  const pill = (label: string, active: boolean, onPress: () => void) => (
    <TouchableOpacity
      key={label}
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: active ? accentRgb : 'transparent',
        borderWidth: 1,
        borderColor: active ? accentRgb : borderColor,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#fff' : fgRgb }}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const inputStyle = {
    fontSize: 14,
    fontWeight: '500' as const,
    color: fgRgb,
    borderBottomWidth: 1,
    borderBottomColor: borderColor,
    paddingBottom: 8,
    paddingTop: 2,
  };

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end px-2"
      >
        <Animated.View
          pointerEvents={visible ? 'auto' : 'none'}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: `rgba(${colors.foreground.replace(/ /g, ',')}, 0.4)`,
            opacity: backdrop,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={{
            backgroundColor: bgRgb,
            borderRadius: 40,
            maxHeight: sheetMaxHeight,
            marginBottom: keyboardUp ? 8 : 12,
            transform: [{ translateY }],
            shadowColor: fgRgb,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 24,
            elevation: 12,
          }}
        >
          <View className="items-center pb-2 pt-3">
            <View className="h-1 w-10 rounded-full bg-foreground/20" />
          </View>

          <View className="px-6 pt-1 pb-3">
            <Text
              className="text-center text-foreground/40"
              style={{ fontSize: 13, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' }}
            >
              {isEditing ? t('admin.editItem') : t('admin.newProgramOrEvent')}
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          >
            {/* Cover image */}
            <TouchableOpacity
              onPress={handlePickImage}
              activeOpacity={0.8}
              disabled={isUploading}
              style={{
                height: 132,
                borderRadius: 16,
                backgroundColor: borderColor,
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              {isUploading ? (
                <ActivityIndicator color={fgRgb} />
              ) : image ? (
                <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <>
                  <Icon name="image-outline" size={26} color={mutedRgb} />
                  <Text style={{ color: labelColor, fontSize: 11, marginTop: 6 }}>{t('admin.addCoverImage')}</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Type selector */}
            {sectionLabel(t('admin.type'))}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {CONTENT_TYPES.map((t) => {
                const active = type === t.value;
                return (
                  <TouchableOpacity
                    key={t.value}
                    onPress={() => setType(t.value)}
                    activeOpacity={0.8}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      alignItems: 'center',
                      backgroundColor: active ? accentRgb : 'transparent',
                      borderWidth: 1,
                      borderColor: active ? accentRgb : borderColor,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: active ? '#fff' : fgRgb,
                      }}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Name */}
            <View style={{ marginBottom: 20 }}>
              {sectionLabel(t('admin.name'))}
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t('admin.programNamePlaceholder')}
                placeholderTextColor={placeholderColor}
                autoCapitalize="words"
                style={inputStyle}
              />
            </View>

            {/* Description */}
            <View style={{ marginBottom: 20 }}>
              {sectionLabel(t('admin.description'))}
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder={t('admin.descriptionPlaceholder')}
                placeholderTextColor={placeholderColor}
                multiline
                style={{ ...inputStyle, minHeight: 44, textAlignVertical: 'top' }}
              />
            </View>

            {/* Schedule: how often it repeats */}
            {sectionLabel(t('admin.schedule'))}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {(
                [
                  { label: t('admin.freqOnce'), value: 'once' },
                  { label: t('admin.freqWeekly'), value: 'weekly' },
                  { label: t('admin.freqMonthly'), value: 'monthly' },
                ] as { label: string; value: RecurrenceFreq }[]
              ).map((opt) => {
                const active = freq === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => {
                      setFreq(opt.value);
                      if (opt.value !== 'once' && !anchor) setAnchor(todayStr);
                      // Monthly picks a single weekday; trim any extra selection.
                      if (opt.value === 'monthly' && days.length > 1) setDays(days.slice(0, 1));
                    }}
                    activeOpacity={0.8}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      alignItems: 'center',
                      backgroundColor: active ? accentRgb : 'transparent',
                      borderWidth: 1,
                      borderColor: active ? accentRgb : borderColor,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#fff' : fgRgb }}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* One-time: single date */}
            {freq === 'once' && (
              <View style={{ marginBottom: 20 }}>
                {sectionLabel(t('admin.date'))}
                <DatePicker
                  value={startDate}
                  onChange={setStartDate}
                  accentRgb={accentRgb}
                  fgRgb={fgRgb}
                  labelColor={labelColor}
                  borderColor={borderColor}
                />
              </View>
            )}

            {/* Weekly: how often + which weekdays */}
            {freq === 'weekly' && (
              <>
                <View style={{ marginBottom: 20 }}>
                  {sectionLabel(t('admin.howOften'))}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {[
                      { label: t('admin.everyWeek'), value: 1 },
                      { label: t('admin.everyOther'), value: 2 },
                      { label: t('admin.every3Weeks'), value: 3 },
                    ].map((o) => pill(o.label, repeatInterval === o.value, () => setRepeatInterval(o.value)))}
                  </View>
                </View>
                <View style={{ marginBottom: 20 }}>
                  {sectionLabel(t('admin.repeatsOn'))}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {WEEK_DAYS.map((d) => pill(d.slice(0, 3), days.includes(d), () => toggleDay(d)))}
                  </View>
                </View>
              </>
            )}

            {/* Monthly: which week of the month + which weekday */}
            {freq === 'monthly' && (
              <>
                <View style={{ marginBottom: 20 }}>
                  {sectionLabel(t('admin.whichWeek'))}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {WEEK_OF_MONTH_OPTIONS.map((o) =>
                      pill(o.label, weekOfMonth === o.value, () => setWeekOfMonth(o.value)),
                    )}
                  </View>
                </View>
                <View style={{ marginBottom: 20 }}>
                  {sectionLabel(t('admin.on'))}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {WEEK_DAYS.map((d) => pill(d.slice(0, 3), days.includes(d), () => toggleDay(d)))}
                  </View>
                </View>
                <View style={{ marginBottom: 20 }}>
                  {sectionLabel(t('admin.howOften'))}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {[
                      { label: t('admin.everyMonth'), value: 1 },
                      { label: t('admin.everyOtherMonth'), value: 2 },
                    ].map((o) => pill(o.label, repeatInterval === o.value, () => setRepeatInterval(o.value)))}
                  </View>
                </View>
              </>
            )}

            {/* Recurring: when the series starts (anchors "every other" parity) */}
            {isRecurring && (
              <View style={{ marginBottom: 20 }}>
                {sectionLabel(t('admin.startsOn'))}
                <DatePicker
                  value={anchor}
                  onChange={setAnchor}
                  accentRgb={accentRgb}
                  fgRgb={fgRgb}
                  labelColor={labelColor}
                  borderColor={borderColor}
                />
              </View>
            )}

            {recurrencePreview && (
              <View
                style={{
                  marginBottom: 20,
                  marginTop: -4,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  backgroundColor: `rgba(${colors.accent.replace(/ /g, ',')}, 0.08)`,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: accentRgb }}>
                  {recurrencePreview}
                </Text>
              </View>
            )}

            {/* Time */}
            <View style={{ marginBottom: 20 }}>
              {sectionLabel(t('admin.startTime'))}
              <TimePicker
                value={startTime}
                onChange={setStartTime}
                mode="24h"
                accentRgb={accentRgb}
                fgRgb={fgRgb}
                borderColor={borderColor}
              />
            </View>

            {/* End date (optional) */}
            <View style={{ marginBottom: 20 }}>
              {sectionLabel(t('admin.endDateOptional'))}
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                accentRgb={accentRgb}
                fgRgb={fgRgb}
                labelColor={labelColor}
                borderColor={borderColor}
                allowClear
              />
            </View>

            {/* Speakers */}
            {speakers.length > 0 ? (
              <View style={{ marginBottom: 20 }}>
                {sectionLabel(t('admin.speakers'))}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {speakers.map((sp) => {
                    const n = sp.speaker_name ?? '';
                    if (!n) return null;
                    const active = selectedSpeakers.includes(n);
                    return (
                      <TouchableOpacity
                        key={sp.speaker_id}
                        onPress={() => toggleSpeaker(n)}
                        activeOpacity={0.8}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: 999,
                          backgroundColor: active ? accentRgb : 'transparent',
                          borderWidth: 1,
                          borderColor: active ? accentRgb : borderColor,
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#fff' : fgRgb }}>
                          {n}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* Audience */}
            <View style={{ marginBottom: 8 }}>
              {sectionLabel(t('admin.audienceOptional'))}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { label: t('admin.audienceKids'), value: isKids, set: setIsKids },
                  { label: t('admin.audience14Plus'), value: isFourteenPlus, set: setIsFourteenPlus },
                  { label: t('admin.audienceYoungPros'), value: isYoungPros, set: setIsYoungPros },
                ].map((a) => (
                  <TouchableOpacity
                    key={a.label}
                    onPress={() => a.set((v) => !v)}
                    activeOpacity={0.8}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 999,
                      backgroundColor: a.value ? accentRgb : 'transparent',
                      borderWidth: 1,
                      borderColor: a.value ? accentRgb : borderColor,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: a.value ? '#fff' : fgRgb }}>
                      {a.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Save */}
          <View className="px-6 pb-8 pt-3" style={{ borderTopWidth: 0.5, borderTopColor: borderColor }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSave}
              disabled={!canSave}
              className="items-center justify-center rounded-full bg-primary"
              style={{ height: 43, opacity: canSave ? 1 : 0.5 }}
            >
              <Text className="text-[14px] font-semibold text-primary-foreground">
                {mutation.isPending ? t('admin.saving') : isEditing ? t('admin.saveChanges') : t('admin.create')}
              </Text>
            </TouchableOpacity>
            {mutation.isError && (
              <Text className="mt-2 text-center text-[11px] text-red-500">
                {mutation.error?.message ?? t('admin.failedToSave')}
              </Text>
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

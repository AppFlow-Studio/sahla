import { useCallback, useEffect, useRef, useState } from 'react';
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Icon } from '@/src/components/ui/icon';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useIsRTL } from '@/src/hooks/use-is-rtl';
import { useAutoStatusBarStyle } from '@/src/hooks/use-status-bar-style';
import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';
import { useSpeakers, type SpeakerRow } from '@/src/hooks/use-speakers';
import {
  jummahTimeToMinutes,
  jummahTitle,
  MAX_REGULAR_JUMMAHS,
} from '@/src/hooks/use-jummah-schedule';
import { TimePicker } from '@/src/components/admin/time-picker';

const SCREEN_H = Dimensions.get('window').height;

type JummahRow = {
  id: number;
  mosque_id: string;
  speaker: string | null;
  topic: string | null;
  prayer_time: string | null;
  is_school: boolean;
  speaker_data: {
    speaker_id: string;
    speaker_name: string | null;
    speaker_img: string | null;
  } | null;
};

function useJummahAdmin() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);

  const query = useQuery({
    queryKey: ['jummah-admin', mosqueUuid],
    queryFn: async (): Promise<JummahRow[]> => {
      const { data, error } = await supabase
        .from('jummah')
        .select(
          `id, mosque_id, speaker, topic, prayer_time, is_school,
           speaker_data!jummah_speaker_fkey (speaker_id, speaker_name, speaker_img)`,
        )
        .eq('mosque_id', mosqueUuid!);

      if (error) throw new Error(error.message);
      const rows = (data as unknown as JummahRow[]) ?? [];
      return rows.sort(
        (a, b) => jummahTimeToMinutes(a.prayer_time) - jummahTimeToMinutes(b.prayer_time),
      );
    },
    enabled: !!mosqueUuid,
  });

  return {
    slots: query.data ?? [],
    isLoading: query.isPending,
    refetch: query.refetch,
  };
}

function useUpdateJummah() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      speaker,
      topic,
      prayer_time,
      is_school,
    }: {
      id: number;
      speaker?: string | null;
      topic?: string | null;
      prayer_time?: string | null;
      is_school?: boolean;
    }) => {
      const { error } = await supabase
        .from('jummah')
        .update({ speaker, topic, prayer_time, is_school })
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jummah-admin', mosqueUuid] });
      queryClient.invalidateQueries({ queryKey: ['jummah', mosqueUuid] });
    },
  });
}

function useCreateJummah() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      speaker,
      topic,
      prayer_time,
      is_school,
    }: {
      speaker?: string | null;
      topic?: string | null;
      prayer_time?: string | null;
      is_school?: boolean;
    }) => {
      if (!mosqueUuid) throw new Error('No mosque configured');
      const { error } = await supabase.from('jummah').insert({
        mosque_id: mosqueUuid,
        speaker: speaker ?? null,
        topic: topic ?? null,
        prayer_time: prayer_time ?? '12:15 PM',
        is_school: is_school ?? false,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jummah-admin', mosqueUuid] });
      queryClient.invalidateQueries({ queryKey: ['jummah', mosqueUuid] });
    },
  });
}

function useDeleteJummah() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('jummah').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jummah-admin', mosqueUuid] });
      queryClient.invalidateQueries({ queryKey: ['jummah', mosqueUuid] });
    },
  });
}

export default function JummahAdminScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const { colors } = useMasjidConfig();
  useAutoStatusBarStyle(colors.card);
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ',')})`;
  const mutedRgb = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.5)`;
  const borderColor = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.1)`;
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;

  const { slots, isLoading } = useJummahAdmin();
  const deleteJummah = useDeleteJummah();

  const regularCount = slots.filter((s) => !s.is_school).length;
  const schoolCount = slots.filter((s) => s.is_school).length;
  const atCapacity = regularCount >= MAX_REGULAR_JUMMAHS && schoolCount >= 1;

  // slots arrive sorted by time; number the regular ones, label the school one.
  let regularSeen = 0;
  const labeled = slots.map((slot) => {
    if (slot.is_school) return { slot, title: t('admin.schoolJummah'), badge: '' };
    regularSeen += 1;
    return { slot, title: jummahTitle(false, regularSeen - 1), badge: String(regularSeen) };
  });

  const [editingSlot, setEditingSlot] = useState<JummahRow | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleEdit = (slot: JummahRow) => {
    setEditingSlot(slot);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingSlot(null);
    setShowForm(true);
  };

  const handleDelete = (slot: JummahRow, title: string) => {
    Alert.alert(
      t('admin.deleteSlotTitle'),
      t('admin.deleteSlotMessage', { title }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.delete'),
          style: 'destructive',
          onPress: () => deleteJummah.mutate(slot.id),
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-card" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5" style={{ height: 52 }}>
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Icon name={isRTL ? 'chevron-forward' : 'chevron-back'} size={22} color={fgRgb} />
          </Pressable>
          <Text style={{ color: fgRgb, fontSize: 16, fontWeight: '600', marginStart: 12 }}>
            {t('admin.jummahSchedule')}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleAdd}
          activeOpacity={0.7}
          hitSlop={8}
          disabled={atCapacity}
          style={{ opacity: atCapacity ? 0.35 : 1 }}
        >
          <Icon name="add-circle-outline" size={26} color={accentRgb} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={fgRgb} />
        </View>
      ) : slots.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <Icon name="calendar-outline" size={48} color={mutedRgb} />
          <Text style={{ color: mutedRgb, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
            {t('admin.noJummahSlots')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={labeled}
          keyExtractor={(l) => String(l.slot.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}
          renderItem={({ item }) => (
            <JummahCard
              slot={item.slot}
              title={item.title}
              badge={item.badge}
              fgRgb={fgRgb}
              mutedRgb={mutedRgb}
              borderColor={borderColor}
              accentRgb={accentRgb}
              onEdit={() => handleEdit(item.slot)}
              onDelete={() => handleDelete(item.slot, item.title)}
            />
          )}
        />
      )}

      <JummahFormModal
        visible={showForm}
        slot={editingSlot}
        regularUsed={slots.filter((s) => !s.is_school && s.id !== editingSlot?.id).length}
        schoolUsed={slots.filter((s) => s.is_school && s.id !== editingSlot?.id).length}
        onClose={() => setShowForm(false)}
      />
    </View>
  );
}

// ── Jummah Card ───────────────────────────────────────────

function JummahCard({
  slot,
  title,
  badge,
  fgRgb,
  mutedRgb,
  borderColor,
  accentRgb,
  onEdit,
  onDelete,
}: {
  slot: JummahRow;
  title: string;
  badge: string;
  fgRgb: string;
  mutedRgb: string;
  borderColor: string;
  accentRgb: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const speakerName =
    (slot.speaker_data as JummahRow['speaker_data'])?.speaker_name ?? t('admin.unassigned');
  const speakerImg = (slot.speaker_data as JummahRow['speaker_data'])?.speaker_img;

  return (
    <Pressable
      onPress={onEdit}
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
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: `rgba(${accentRgb.slice(4, -1)}, 0.15)`,
          alignItems: 'center',
          justifyContent: 'center',
          marginEnd: 12,
        }}
      >
        {slot.is_school ? (
          <Icon name="school-outline" size={18} color={accentRgb} />
        ) : (
          <Text style={{ color: accentRgb, fontSize: 13, fontWeight: '700' }}>
            {badge}
          </Text>
        )}
      </View>

      <View className="flex-1">
        <Text style={{ color: fgRgb, fontSize: 14, fontWeight: '600' }}>
          {title}
        </Text>
        <Text style={{ color: mutedRgb, fontSize: 11, marginTop: 2 }}>
          {speakerName} · {slot.prayer_time ?? t('admin.noTimeSet')}
        </Text>
        {slot.topic ? (
          <Text style={{ color: mutedRgb, fontSize: 11, marginTop: 1 }} numberOfLines={1}>
            {slot.topic}
          </Text>
        ) : null}
      </View>

      {speakerImg ? (
        <View style={{ width: 32, height: 32, borderRadius: 16, overflow: 'hidden', marginEnd: 8 }}>
          <Image source={{ uri: speakerImg }} style={{ width: 32, height: 32 }} />
        </View>
      ) : null}

      <TouchableOpacity onPress={onEdit} hitSlop={8} style={{ marginEnd: 16 }}>
        <Icon name="pencil-outline" size={16} color={mutedRgb} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} hitSlop={8}>
        <Icon name="trash-outline" size={16} color="rgb(239,68,68)" />
      </TouchableOpacity>
    </Pressable>
  );
}

// ── Jummah Form Modal ─────────────────────────────────────

function JummahFormModal({
  visible,
  slot,
  regularUsed,
  schoolUsed,
  onClose,
}: {
  visible: boolean;
  slot: JummahRow | null;
  /** Regular/school slots already taken by *other* slots (excludes this one). */
  regularUsed: number;
  schoolUsed: number;
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
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;

  const { speakers } = useSpeakers();
  const updateJummah = useUpdateJummah();
  const createJummah = useCreateJummah();
  const isEditing = slot !== null;
  const mutation = isEditing ? updateJummah : createJummah;

  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [prayerTime, setPrayerTime] = useState('');
  const [isSchool, setIsSchool] = useState(false);

  const canRegular = regularUsed < MAX_REGULAR_JUMMAHS;
  const canSchool = schoolUsed < 1;

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
    : SCREEN_H * 0.75;

  useEffect(() => {
    if (visible) {
      setSelectedSpeaker(slot?.speaker ?? null);
      setTopic(slot?.topic ?? '');
      setPrayerTime(slot?.prayer_time ?? '12:15 PM');
      // Editing keeps its type; new slots default to regular when there's room.
      setIsSchool(slot ? slot.is_school : !canRegular && canSchool);
    }
  }, [visible, slot, canRegular, canSchool]);

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
          duration: 600,
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

  const handleSave = () => {
    if (isEditing && slot) {
      updateJummah.mutate(
        {
          id: slot.id,
          speaker: selectedSpeaker,
          topic: topic.trim() || null,
          prayer_time: prayerTime.trim() || null,
          is_school: isSchool,
        },
        { onSuccess: onClose },
      );
    } else {
      createJummah.mutate(
        {
          speaker: selectedSpeaker,
          topic: topic.trim() || null,
          prayer_time: prayerTime.trim() || null,
          is_school: isSchool,
        },
        { onSuccess: onClose },
      );
    }
  };

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
            borderRadius: 48,
            marginBottom: keyboardUp ? 8 : 12,
            transform: [{ translateY }],
            shadowColor: fgRgb,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 24,
            elevation: 12,
            maxHeight: sheetMaxHeight,
          }}
        >
          <View className="items-center pb-2 pt-3">
            <View className="h-1 w-10 rounded-full bg-foreground/20" />
          </View>

          <View className="px-6 pt-2 pb-4">
            <Text
              className="text-center text-foreground/40"
              style={{
                fontSize: 13,
                fontWeight: '600',
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              {isEditing ? t('admin.editJummahSlot') : t('admin.addJummahSlot')}
            </Text>
          </View>

          <ScrollView
            className="px-6"
            keyboardShouldPersistTaps="handled"
            style={{
              maxHeight: keyboardUp
                ? Math.max(sheetMaxHeight - 190, 120)
                : SCREEN_H * 0.45,
            }}
          >
            {/* Type: Regular vs School Jummah */}
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
              {t('admin.type')}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: borderColor,
                borderRadius: 12,
                padding: 3,
                marginBottom: 20,
              }}
            >
              {[
                { label: t('admin.regularJummah'), value: false, enabled: canRegular },
                { label: t('admin.schoolJummah'), value: true, enabled: canSchool },
              ].map((opt) => {
                const active = isSchool === opt.value;
                const disabled = !active && !opt.enabled;
                return (
                  <TouchableOpacity
                    key={opt.label}
                    activeOpacity={0.8}
                    disabled={disabled}
                    onPress={() => setIsSchool(opt.value)}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 9,
                      borderRadius: 10,
                      backgroundColor: active ? accentRgb : 'transparent',
                      opacity: disabled ? 0.35 : 1,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: active ? bgRgb : labelColor,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Speaker Picker */}
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
              {t('admin.speaker')}
            </Text>

            {/* Unassign option */}
            <TouchableOpacity
              onPress={() => setSelectedSpeaker(null)}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 10,
                borderBottomWidth: 0.5,
                borderBottomColor: borderColor,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: borderColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginEnd: 10,
                }}
              >
                <Icon name="person-outline" size={14} color={labelColor} />
              </View>
              <Text style={{ color: fgRgb, fontSize: 13, flex: 1 }}>{t('admin.unassigned')}</Text>
              {selectedSpeaker === null && (
                <Icon name="checkmark-circle" size={20} color={accentRgb} />
              )}
            </TouchableOpacity>

            {speakers.map((s) => (
              <TouchableOpacity
                key={s.speaker_id}
                onPress={() => setSelectedSpeaker(s.speaker_id)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10,
                  borderBottomWidth: 0.5,
                  borderBottomColor: borderColor,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    overflow: 'hidden',
                    backgroundColor: borderColor,
                    marginEnd: 10,
                  }}
                >
                  {s.speaker_img ? (
                    <Image source={{ uri: s.speaker_img }} style={{ width: 32, height: 32 }} />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <Icon name="person" size={14} color={labelColor} />
                    </View>
                  )}
                </View>
                <Text style={{ color: fgRgb, fontSize: 13, flex: 1 }}>
                  {s.speaker_name ?? t('admin.unnamed')}
                </Text>
                {selectedSpeaker === s.speaker_id && (
                  <Icon name="checkmark-circle" size={20} color={accentRgb} />
                )}
              </TouchableOpacity>
            ))}

            {speakers.length === 0 && (
              <Text style={{ color: placeholderColor, fontSize: 12, paddingVertical: 8 }}>
                {t('admin.noSheikhsAddOne')}
              </Text>
            )}

            {/* Topic */}
            <View style={{ marginTop: 20, marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  letterSpacing: 1.4,
                  textTransform: 'uppercase',
                  color: labelColor,
                  marginBottom: 6,
                }}
              >
                {t('admin.khutbahTopic')}
              </Text>
              <TextInput
                value={topic}
                onChangeText={setTopic}
                placeholder={t('admin.khutbahTopicPlaceholder')}
                placeholderTextColor={placeholderColor}
                autoCapitalize="sentences"
                multiline
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: fgRgb,
                  borderBottomWidth: 1,
                  borderBottomColor: borderColor,
                  paddingBottom: 8,
                  paddingTop: 2,
                }}
              />
            </View>

            {/* Time */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  letterSpacing: 1.4,
                  textTransform: 'uppercase',
                  color: labelColor,
                  marginBottom: 6,
                }}
              >
                {t('admin.prayerTime')}
              </Text>
              <TimePicker
                value={prayerTime}
                onChange={setPrayerTime}
                accentRgb={accentRgb}
                fgRgb={fgRgb}
                borderColor={borderColor}
              />
            </View>
          </ScrollView>

          {/* Save */}
          <View className="px-6 pb-8 pt-4">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSave}
              disabled={mutation.isPending}
              className="items-center justify-center rounded-full bg-primary"
              style={{ height: 43, opacity: mutation.isPending ? 0.5 : 1 }}
            >
              <Text className="text-[14px] font-semibold text-primary-foreground">
                {mutation.isPending ? t('admin.saving') : isEditing ? t('admin.saveChanges') : t('admin.addSlot')}
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

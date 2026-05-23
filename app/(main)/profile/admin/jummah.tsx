import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  KeyboardAvoidingView,
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
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';
import { useSpeakers, type SpeakerRow } from '@/src/hooks/use-speakers';

const SCREEN_H = Dimensions.get('window').height;

type JummahRow = {
  id: number;
  mosque_id: string;
  speaker: string | null;
  topic: string | null;
  prayer_time: string | null;
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
          `id, mosque_id, speaker, topic, prayer_time,
           speaker_data!jummah_speaker_fkey (speaker_id, speaker_name, speaker_img)`,
        )
        .eq('mosque_id', mosqueUuid!)
        .order('prayer_time', { ascending: true });

      if (error) throw new Error(error.message);
      return (data as unknown as JummahRow[]) ?? [];
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
    }: {
      id: number;
      speaker?: string | null;
      topic?: string | null;
      prayer_time?: string | null;
    }) => {
      const { error } = await supabase
        .from('jummah')
        .update({ speaker, topic, prayer_time })
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
    }: {
      speaker?: string | null;
      topic?: string | null;
      prayer_time?: string | null;
    }) => {
      if (!mosqueUuid) throw new Error('No mosque configured');
      const { error } = await supabase.from('jummah').insert({
        mosque_id: mosqueUuid,
        speaker: speaker ?? null,
        topic: topic ?? null,
        prayer_time: prayer_time ?? '12:15 PM',
      });
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
  const { colors } = useMasjidConfig();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ',')})`;
  const mutedRgb = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.5)`;
  const borderColor = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.1)`;
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;

  const { slots, isLoading } = useJummahAdmin();

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

  return (
    <View className="flex-1 bg-card" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5" style={{ height: 52 }}>
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={fgRgb} />
          </Pressable>
          <Text style={{ color: fgRgb, fontSize: 16, fontWeight: '600', marginLeft: 12 }}>
            Jummah Schedule
          </Text>
        </View>
        <TouchableOpacity onPress={handleAdd} activeOpacity={0.7} hitSlop={8}>
          <Ionicons name="add-circle-outline" size={26} color={accentRgb} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={fgRgb} />
        </View>
      ) : slots.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <Ionicons name="calendar-outline" size={48} color={mutedRgb} />
          <Text style={{ color: mutedRgb, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
            No Jummah slots yet. Tap + to add one.
          </Text>
        </View>
      ) : (
        <FlatList
          data={slots}
          keyExtractor={(s) => String(s.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          renderItem={({ item, index }) => (
            <JummahCard
              slot={item}
              index={index}
              fgRgb={fgRgb}
              mutedRgb={mutedRgb}
              borderColor={borderColor}
              accentRgb={accentRgb}
              onEdit={() => handleEdit(item)}
            />
          )}
        />
      )}

      <JummahFormModal
        visible={showForm}
        slot={editingSlot}
        onClose={() => setShowForm(false)}
      />
    </View>
  );
}

// ── Jummah Card ───────────────────────────────────────────

function JummahCard({
  slot,
  index,
  fgRgb,
  mutedRgb,
  borderColor,
  accentRgb,
  onEdit,
}: {
  slot: JummahRow;
  index: number;
  fgRgb: string;
  mutedRgb: string;
  borderColor: string;
  accentRgb: string;
  onEdit: () => void;
}) {
  const speakerName =
    (slot.speaker_data as JummahRow['speaker_data'])?.speaker_name ?? 'Unassigned';
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
          marginRight: 12,
        }}
      >
        <Text style={{ color: accentRgb, fontSize: 13, fontWeight: '700' }}>
          {index + 1}
        </Text>
      </View>

      <View className="flex-1">
        <Text style={{ color: fgRgb, fontSize: 14, fontWeight: '600' }}>
          Jummah {index + 1}
        </Text>
        <Text style={{ color: mutedRgb, fontSize: 11, marginTop: 2 }}>
          {speakerName} · {slot.prayer_time ?? 'No time set'}
        </Text>
        {slot.topic ? (
          <Text style={{ color: mutedRgb, fontSize: 11, marginTop: 1 }} numberOfLines={1}>
            {slot.topic}
          </Text>
        ) : null}
      </View>

      {speakerImg ? (
        <View style={{ width: 32, height: 32, borderRadius: 16, overflow: 'hidden', marginRight: 8 }}>
          <Image source={{ uri: speakerImg }} style={{ width: 32, height: 32 }} />
        </View>
      ) : null}

      <Ionicons name="pencil-outline" size={16} color={mutedRgb} />
    </Pressable>
  );
}

// ── Jummah Form Modal ─────────────────────────────────────

function JummahFormModal({
  visible,
  slot,
  onClose,
}: {
  visible: boolean;
  slot: JummahRow | null;
  onClose: () => void;
}) {
  const { colors } = useMasjidConfig();
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

  const [mounted, setMounted] = useState(false);
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setSelectedSpeaker(slot?.speaker ?? null);
      setTopic(slot?.topic ?? '');
      setPrayerTime(slot?.prayer_time ?? '12:15 PM');
    }
  }, [visible, slot]);

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
        },
        { onSuccess: onClose },
      );
    } else {
      createJummah.mutate(
        {
          speaker: selectedSpeaker,
          topic: topic.trim() || null,
          prayer_time: prayerTime.trim() || null,
        },
        { onSuccess: onClose },
      );
    }
  };

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end px-2 pb-3"
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
            transform: [{ translateY }],
            shadowColor: fgRgb,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 24,
            elevation: 12,
            maxHeight: SCREEN_H * 0.75,
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
              {isEditing ? 'Edit Jummah Slot' : 'Add Jummah Slot'}
            </Text>
          </View>

          <ScrollView className="px-6" style={{ maxHeight: SCREEN_H * 0.45 }}>
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
              Speaker
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
                  marginRight: 10,
                }}
              >
                <Ionicons name="person-outline" size={14} color={labelColor} />
              </View>
              <Text style={{ color: fgRgb, fontSize: 13, flex: 1 }}>Unassigned</Text>
              {selectedSpeaker === null && (
                <Ionicons name="checkmark-circle" size={20} color={accentRgb} />
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
                    marginRight: 10,
                  }}
                >
                  {s.speaker_img ? (
                    <Image source={{ uri: s.speaker_img }} style={{ width: 32, height: 32 }} />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <Ionicons name="person" size={14} color={labelColor} />
                    </View>
                  )}
                </View>
                <Text style={{ color: fgRgb, fontSize: 13, flex: 1 }}>
                  {s.speaker_name ?? 'Unnamed'}
                </Text>
                {selectedSpeaker === s.speaker_id && (
                  <Ionicons name="checkmark-circle" size={20} color={accentRgb} />
                )}
              </TouchableOpacity>
            ))}

            {speakers.length === 0 && (
              <Text style={{ color: placeholderColor, fontSize: 12, paddingVertical: 8 }}>
                No sheikhs added yet. Add one from the Sheikhs screen.
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
                Khutbah Topic
              </Text>
              <TextInput
                value={topic}
                onChangeText={setTopic}
                placeholder="e.g. The importance of brotherhood"
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
                Prayer Time
              </Text>
              <TextInput
                value={prayerTime}
                onChangeText={setPrayerTime}
                placeholder="e.g. 12:15 PM"
                placeholderTextColor={placeholderColor}
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
                {mutation.isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Slot'}
              </Text>
            </TouchableOpacity>
            {mutation.isError && (
              <Text className="mt-2 text-center text-[11px] text-red-500">
                {mutation.error?.message ?? 'Failed to save'}
              </Text>
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

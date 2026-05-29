import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
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

const SCREEN_H = Dimensions.get('window').height;

function typeLabel(type: string) {
  return CONTENT_TYPES.find((t) => t.value === type)?.label ?? type;
}

export default function ProgramsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useMasjidConfig();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ',')})`;
  const mutedRgb = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.5)`;
  const borderColor = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.1)`;
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;

  const { items, isLoading } = useAdminContentItems();
  const deleteItem = useDeleteContentItem();

  const [editing, setEditing] = useState<AdminContentItem | null>(null);
  const [showForm, setShowForm] = useState(false);

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
      'Delete item',
      `Delete "${item.name ?? 'this item'}"? People who saved or set reminders for it will lose them.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteItem.mutate(item.content_id),
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
            <Ionicons name="chevron-back" size={22} color={fgRgb} />
          </Pressable>
          <Text style={{ color: fgRgb, fontSize: 16, fontWeight: '600', marginLeft: 12 }}>
            Programs & Events
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
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <Ionicons name="megaphone-outline" size={48} color={mutedRgb} />
          <Text style={{ color: mutedRgb, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
            No programs or events yet. Tap + to create one.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.content_id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
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
  const schedule = item.is_weekly_program
    ? (item.days ?? []).map((d) => d.slice(0, 3)).join(', ')
    : (item.start_date ?? '');
  const sub = [typeLabel(item.type), schedule, item.start_time].filter(Boolean).join(' · ');

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
          marginRight: 12,
        }}
      >
        {item.image ? (
          <Image source={{ uri: item.image }} style={{ width: 56, height: 44 }} />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="image-outline" size={18} color={mutedRgb} />
          </View>
        )}
      </View>

      <View className="flex-1">
        <Text style={{ color: fgRgb, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
          {item.name ?? 'Untitled'}
        </Text>
        <Text style={{ color: mutedRgb, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
          {sub}
        </Text>
      </View>

      <TouchableOpacity onPress={onEdit} hitSlop={8} style={{ marginRight: 12 }}>
        <Ionicons name="pencil-outline" size={18} color={mutedRgb} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} hitSlop={8}>
        <Ionicons name="trash-outline" size={18} color="rgb(239,68,68)" />
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
  const { colors } = useMasjidConfig();
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

  const isEditing = item !== null;
  const mutation = isEditing ? updateItem : createItem;

  const [name, setName] = useState('');
  const [type, setType] = useState<ContentType>('event');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isWeekly, setIsWeekly] = useState(false);
  const [days, setDays] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([]);
  const [isKids, setIsKids] = useState(false);
  const [isFourteenPlus, setIsFourteenPlus] = useState(false);
  const [isYoungPros, setIsYoungPros] = useState(false);

  const [mounted, setMounted] = useState(false);
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setName(item?.name ?? '');
      setType((item?.type as ContentType) ?? 'event');
      setDescription(item?.description ?? '');
      setImage(item?.image ?? null);
      setIsWeekly(item?.is_weekly_program ?? false);
      setDays(item?.days ?? []);
      setStartDate(item?.start_date ?? '');
      setEndDate(item?.end_date ?? '');
      setStartTime(item?.start_time ?? '');
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
    } catch {
      // Permission denied or picker cancelled
    }
  }, [item, pickAndUpload]);

  const toggleDay = (day: string) =>
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));

  const toggleSpeaker = (n: string) =>
    setSelectedSpeakers((prev) =>
      prev.includes(n) ? prev.filter((s) => s !== n) : [...prev, n],
    );

  const handleSave = () => {
    const payload = {
      name: name.trim(),
      type,
      description: description.trim() || null,
      image,
      start_time: startTime.trim() || null,
      end_date: endDate.trim() || null,
      is_weekly_program: isWeekly,
      // Weekly programs recur on days[] with no single start_date; one-time
      // events use start_date and carry no recurring days.
      days: isWeekly ? days : null,
      start_date: isWeekly ? null : startDate.trim() || null,
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

  const scheduleValid = isWeekly ? days.length > 0 : startDate.trim().length > 0;
  const canSave = name.trim().length > 0 && scheduleValid && !mutation.isPending;

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
            borderRadius: 40,
            maxHeight: SCREEN_H * 0.88,
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
              {isEditing ? 'Edit Item' : 'New Program or Event'}
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
                  <Ionicons name="image-outline" size={26} color={mutedRgb} />
                  <Text style={{ color: labelColor, fontSize: 11, marginTop: 6 }}>Add cover image</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Type selector */}
            {sectionLabel('Type')}
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
              {sectionLabel('Name')}
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Friday Youth Halaqa"
                placeholderTextColor={placeholderColor}
                autoCapitalize="words"
                style={inputStyle}
              />
            </View>

            {/* Description */}
            <View style={{ marginBottom: 20 }}>
              {sectionLabel('Description')}
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="What is this about?"
                placeholderTextColor={placeholderColor}
                multiline
                style={{ ...inputStyle, minHeight: 44, textAlignVertical: 'top' }}
              />
            </View>

            {/* Schedule: one-time vs recurring */}
            {sectionLabel('Schedule')}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {[
                { label: 'One-time', recurring: false },
                { label: 'Recurring', recurring: true },
              ].map((opt) => {
                const active = isWeekly === opt.recurring;
                return (
                  <TouchableOpacity
                    key={opt.label}
                    onPress={() => setIsWeekly(opt.recurring)}
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

            {isWeekly ? (
              <View style={{ marginBottom: 20 }}>
                {sectionLabel('Repeats on')}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {WEEK_DAYS.map((d) => {
                    const active = days.includes(d);
                    return (
                      <TouchableOpacity
                        key={d}
                        onPress={() => toggleDay(d)}
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
                          {d.slice(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View style={{ marginBottom: 20 }}>
                {sectionLabel('Date (YYYY-MM-DD)')}
                <TextInput
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="2026-06-15"
                  placeholderTextColor={placeholderColor}
                  keyboardType="numbers-and-punctuation"
                  style={inputStyle}
                />
              </View>
            )}

            {/* Time */}
            <View style={{ marginBottom: 20 }}>
              {sectionLabel('Start time (HH:MM, 24h)')}
              <TextInput
                value={startTime}
                onChangeText={setStartTime}
                placeholder="16:00"
                placeholderTextColor={placeholderColor}
                keyboardType="numbers-and-punctuation"
                style={inputStyle}
              />
            </View>

            {/* End date (optional) */}
            <View style={{ marginBottom: 20 }}>
              {sectionLabel('End date (optional, YYYY-MM-DD)')}
              <TextInput
                value={endDate}
                onChangeText={setEndDate}
                placeholder="Leave blank for single day"
                placeholderTextColor={placeholderColor}
                keyboardType="numbers-and-punctuation"
                style={inputStyle}
              />
            </View>

            {/* Speakers */}
            {speakers.length > 0 ? (
              <View style={{ marginBottom: 20 }}>
                {sectionLabel('Speakers')}
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
              {sectionLabel('Audience (optional)')}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { label: 'Kids', value: isKids, set: setIsKids },
                  { label: '14+', value: isFourteenPlus, set: setIsFourteenPlus },
                  { label: 'Young Professionals', value: isYoungPros, set: setIsYoungPros },
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
                {mutation.isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create'}
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

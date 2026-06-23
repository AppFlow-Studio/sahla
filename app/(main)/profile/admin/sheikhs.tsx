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

import { Icon } from '@/src/components/ui/icon';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useIsRTL } from '@/src/hooks/use-is-rtl';
import {
  useCreateSpeaker,
  useDeleteSpeaker,
  useSpeakers,
  useUpdateSpeaker,
  type SpeakerRow,
} from '@/src/hooks/use-speakers';
import { useUploadSpeakerPhoto } from '@/src/hooks/use-upload-speaker-photo';

const SCREEN_H = Dimensions.get('window').height;

export default function SheikhsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const { colors } = useMasjidConfig();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ',')})`;
  const mutedRgb = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.5)`;
  const borderColor = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.1)`;
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;

  const { speakers, isLoading, refetch } = useSpeakers();
  const deleteSpeaker = useDeleteSpeaker();

  const [editing, setEditing] = useState<SpeakerRow | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleEdit = (speaker: SpeakerRow) => {
    setEditing(speaker);
    setShowForm(true);
  };

  const handleDelete = (speaker: SpeakerRow) => {
    Alert.alert(
      t('admin.removeSheikhTitle'),
      t('admin.removeSheikhMessage', { name: speaker.speaker_name ?? t('admin.thisSheikh') }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.remove'),
          style: 'destructive',
          onPress: () => deleteSpeaker.mutate(speaker.speaker_id),
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
            {t('admin.sheikhs')}
          </Text>
        </View>
        <TouchableOpacity onPress={handleAdd} activeOpacity={0.7} hitSlop={8}>
          <Icon name="add-circle-outline" size={26} color={accentRgb} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={fgRgb} />
        </View>
      ) : speakers.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <Icon name="people-outline" size={48} color={mutedRgb} />
          <Text style={{ color: mutedRgb, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
            {t('admin.noSheikhsAdded')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={speakers}
          keyExtractor={(s) => s.speaker_id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}
          renderItem={({ item }) => (
            <SpeakerCard
              speaker={item}
              fgRgb={fgRgb}
              mutedRgb={mutedRgb}
              borderColor={borderColor}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
        />
      )}

      <SpeakerFormModal
        visible={showForm}
        speaker={editing}
        onClose={() => setShowForm(false)}
      />
    </View>
  );
}

// ── Speaker Card ──────────────────────────────────────────

function SpeakerCard({
  speaker,
  fgRgb,
  mutedRgb,
  borderColor,
  onEdit,
  onDelete,
}: {
  speaker: SpeakerRow;
  fgRgb: string;
  mutedRgb: string;
  borderColor: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
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
          width: 44,
          height: 44,
          borderRadius: 22,
          overflow: 'hidden',
          backgroundColor: borderColor,
          marginEnd: 12,
        }}
      >
        {speaker.speaker_img ? (
          <Image source={{ uri: speaker.speaker_img }} style={{ width: 44, height: 44 }} />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Icon name="person" size={20} color={mutedRgb} />
          </View>
        )}
      </View>

      <View className="flex-1">
        <Text style={{ color: fgRgb, fontSize: 14, fontWeight: '600' }}>
          {speaker.speaker_name ?? t('admin.unnamed')}
        </Text>
        {speaker.speaker_creds && speaker.speaker_creds.length > 0 && (
          <Text style={{ color: mutedRgb, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
            {speaker.speaker_creds.join(' · ')}
          </Text>
        )}
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

// ── Speaker Form Modal ────────────────────────────────────

function SpeakerFormModal({
  visible,
  speaker,
  onClose,
}: {
  visible: boolean;
  speaker: SpeakerRow | null;
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

  const createSpeaker = useCreateSpeaker();
  const updateSpeaker = useUpdateSpeaker();
  const { pickAndUpload, isUploading } = useUploadSpeakerPhoto();

  const isEditing = speaker !== null;
  const mutation = isEditing ? updateSpeaker : createSpeaker;

  const [name, setName] = useState('');
  const [creds, setCreds] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [speakerId, setSpeakerId] = useState<string | null>(null);

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

  // When the keyboard is up, cap the sheet height so the whole thing fits in
  // the space above the keyboard instead of clipping. Content-sized otherwise.
  const sheetMaxHeight = keyboardUp ? SCREEN_H - keyboardHeight - insets.top - 20 : undefined;

  useEffect(() => {
    if (visible) {
      setName(speaker?.speaker_name ?? '');
      setCreds(speaker?.speaker_creds?.join(', ') ?? '');
      setPhotoUrl(speaker?.speaker_img ?? null);
      setSpeakerId(speaker?.speaker_id ?? null);
    }
  }, [visible, speaker]);

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

  const handlePickPhoto = useCallback(async () => {
    const id = speakerId ?? 'temp-' + Date.now();
    try {
      const url = await pickAndUpload(id, 'gallery');
      if (url) setPhotoUrl(url);
    } catch {
      // Permission denied or picker cancelled
    }
  }, [speakerId, pickAndUpload]);

  const handleSave = () => {
    const credsArray = creds
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    if (isEditing && speakerId) {
      updateSpeaker.mutate(
        {
          speaker_id: speakerId,
          speaker_name: name.trim(),
          speaker_creds: credsArray.length > 0 ? credsArray : undefined,
          speaker_img: photoUrl,
        },
        { onSuccess: onClose },
      );
    } else {
      createSpeaker.mutate(
        {
          speaker_name: name.trim(),
          speaker_creds: credsArray.length > 0 ? credsArray : undefined,
          speaker_img: photoUrl,
        },
        { onSuccess: onClose },
      );
    }
  };

  const canSave = name.trim().length > 0 && !mutation.isPending;

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
            maxHeight: sheetMaxHeight,
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
              {isEditing ? t('admin.editSheikh') : t('admin.addSheikh')}
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 8 }}
          >
          {/* Photo */}
          <View className="items-center pb-4">
            <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.7} disabled={isUploading}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: borderColor,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isUploading ? (
                  <ActivityIndicator color={fgRgb} />
                ) : photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={{ width: 72, height: 72 }} />
                ) : (
                  <Icon name="camera-outline" size={24} color={mutedRgb} />
                )}
              </View>
              <Text style={{ color: labelColor, fontSize: 10, textAlign: 'center', marginTop: 4 }}>
                {photoUrl ? t('admin.changePhoto') : t('admin.addPhoto')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Fields */}
          <View className="px-6">
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
                {t('admin.name')}
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t('admin.namePlaceholder')}
                placeholderTextColor={placeholderColor}
                autoCapitalize="words"
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
                {t('admin.credentials')}
              </Text>
              <TextInput
                value={creds}
                onChangeText={setCreds}
                placeholder={t('admin.credentialsPlaceholder')}
                placeholderTextColor={placeholderColor}
                autoCapitalize="sentences"
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
          </View>

          {/* Save */}
          <View className="px-6 pb-8 pt-4">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSave}
              disabled={!canSave}
              className="items-center justify-center rounded-full bg-primary"
              style={{ height: 43, opacity: canSave ? 1 : 0.5 }}
            >
              <Text className="text-[14px] font-semibold text-primary-foreground">
                {mutation.isPending ? t('admin.saving') : isEditing ? t('admin.saveChanges') : t('admin.addSheikh')}
              </Text>
            </TouchableOpacity>
            {mutation.isError && (
              <Text className="mt-2 text-center text-[11px] text-red-500">
                {mutation.error?.message ?? t('admin.failedToSave')}
              </Text>
            )}
          </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
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
import ReorderableList, {
  reorderItems,
  useReorderableDrag,
  type ReorderableListReorderEvent,
} from 'react-native-reorderable-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Icon } from '@/src/components/ui/icon';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import {
  useCreateProgramCategory,
  useDeleteProgramCategory,
  useProgramCategories,
  useReorderProgramCategories,
  useUpdateProgramCategory,
  type AudienceFilter,
  type ProgramCategoryRow,
} from '@/src/hooks/use-program-categories';
import { useUploadContentImage } from '@/src/hooks/use-content-admin';
import {
  DEFAULT_CATEGORIES,
  defaultImageForTitle,
} from '@/src/lib/program-category-defaults';

const SCREEN_H = Dimensions.get('window').height;

const AUDIENCE_FILTERS: AudienceFilter[] = ['All', 'Kids', 'Youth', 'Adults'];

// Deep, on-brand background tones for cards without a cover image.
const BG_SWATCHES = [
  '#16321F',
  '#1E3A5F',
  '#5C1F2B',
  '#3F2A5C',
  '#2E3A47',
  '#7A3B1E',
  '#1E1B4B',
];

// Shown instantly when a mosque has no saved rows yet — also covers the brief
// window before auto-seed persists, so the screen never blanks or hangs.
const VIRTUAL_DEFAULTS: ProgramCategoryRow[] = DEFAULT_CATEGORIES.map((c, i) => ({
  id: `virtual-${c.title}`,
  mosque_id: '',
  title: c.title,
  image_url: null,
  bg_color: null,
  audience_filter: c.audience_filter,
  sort_order: i,
  created_at: '',
  updated_at: null,
}));

const isVirtual = (id: string) => id.startsWith('virtual-');

export default function ProgramCategoriesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useMasjidConfig();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ',')})`;
  const mutedRgb = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.5)`;
  const borderColor = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.1)`;
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;

  const { categories, isLoading } = useProgramCategories();
  const deleteCategory = useDeleteProgramCategory();
  const createCategory = useCreateProgramCategory();
  const reorder = useReorderProgramCategories();

  const [editing, setEditing] = useState<ProgramCategoryRow | null>(null);
  const [prefill, setPrefill] = useState<ProgramCategoryRow | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Local copy that drives the reorderable list; kept in sync with the server
  // list except while a drag is settling.
  const [order, setOrder] = useState<ProgramCategoryRow[]>(categories);
  useEffect(() => {
    setOrder(categories);
  }, [categories]);

  // When nothing is saved yet, show the bundled defaults as placeholder cards
  // so the screen is never blank/loading. Editing one opens a prefilled "create".
  const usingDefaults = order.length === 0;
  const displayData = usingDefaults ? VIRTUAL_DEFAULTS : order;

  const handleAdd = () => {
    setEditing(null);
    setPrefill(null);
    setShowForm(true);
  };

  const handleEdit = (category: ProgramCategoryRow) => {
    if (isVirtual(category.id)) {
      // A placeholder default — save it as a brand-new row, prefilled.
      setEditing(null);
      setPrefill(category);
    } else {
      setEditing(category);
      setPrefill(null);
    }
    setShowForm(true);
  };

  const handleDelete = (category: ProgramCategoryRow) => {
    if (isVirtual(category.id)) return; // unsaved default — nothing to remove
    Alert.alert(
      'Remove Category',
      `Remove the "${category.title}" card from Discover?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => deleteCategory.mutate(category.id),
        },
      ],
    );
  };

  const handleReorder = ({ from, to }: ReorderableListReorderEvent) => {
    if (usingDefaults) return; // defaults aren't saved yet — nothing to persist
    const next = reorderItems(order, from, to);
    setOrder(next);
    reorder.mutate(next.map((c) => c.id));
  };

  // First time a mosque opens this screen it has no rows — materialize the
  // bundled Kids/Youth/Adults defaults so the admin lands on three real,
  // editable, reorderable cards instead of an empty state. Guarded so it runs
  // at most once per mount.
  const seededRef = useRef(false);
  useEffect(() => {
    if (isLoading || categories.length > 0 || seededRef.current) return;
    seededRef.current = true;
    DEFAULT_CATEGORIES.forEach((c, index) => {
      createCategory.mutate({
        title: c.title,
        audience_filter: c.audience_filter,
        sort_order: index,
      });
    });
  }, [isLoading, categories.length, createCategory]);

  return (
    <View className="flex-1 bg-card" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5"
        style={{ height: 52 }}
      >
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Icon name="chevron-back" size={22} color={fgRgb} />
          </Pressable>
          <Text
            style={{
              color: fgRgb,
              fontSize: 16,
              fontWeight: '600',
              marginLeft: 12,
            }}
          >
            Program Categories
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
      ) : (
        <ReorderableList
          data={displayData}
          onReorder={handleReorder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: insets.bottom + 40,
          }}
          ListHeaderComponent={
            <Text
              style={{
                color: mutedRgb,
                fontSize: 11,
                marginBottom: 8,
                marginTop: 4,
              }}
            >
              {usingDefaults
                ? 'Showing the default cards. Tap one to customize it.'
                : 'Long-press the handle to reorder. Tap a card to edit it.'}
            </Text>
          }
          renderItem={({ item }) => (
            <CategoryRow
              category={item}
              fgRgb={fgRgb}
              mutedRgb={mutedRgb}
              borderColor={borderColor}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
        />
      )}

      <CategoryFormModal
        visible={showForm}
        category={editing}
        prefill={prefill}
        nextSortOrder={order.length}
        onClose={() => setShowForm(false)}
      />
    </View>
  );
}

// ── Category Row ──────────────────────────────────────────

function CategoryRow({
  category,
  fgRgb,
  mutedRgb,
  borderColor,
  onEdit,
  onDelete,
}: {
  category: ProgramCategoryRow;
  fgRgb: string;
  mutedRgb: string;
  borderColor: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const drag = useReorderableDrag();
  const cover = category.image_url
    ? { uri: category.image_url }
    : defaultImageForTitle(category.title);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: borderColor,
      }}
    >
      <Pressable onLongPress={drag} hitSlop={8} style={{ marginRight: 10 }}>
        <Icon name="reorder-three-outline" size={20} color={mutedRgb} />
      </Pressable>

      <Pressable
        onPress={onEdit}
        className="flex-1 flex-row items-center"
        style={{ paddingVertical: 2 }}
      >
        <View
          style={{
            width: 46,
            height: 60,
            borderRadius: 10,
            overflow: 'hidden',
            backgroundColor: category.bg_color ?? borderColor,
            marginRight: 12,
          }}
        >
          {cover ? (
            <Image
              source={cover}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : null}
        </View>

        <View className="flex-1">
          <Text style={{ color: fgRgb, fontSize: 14, fontWeight: '600' }}>
            {category.title}
          </Text>
          <Text style={{ color: mutedRgb, fontSize: 11, marginTop: 2 }}>
            Opens {category.audience_filter}
          </Text>
        </View>
      </Pressable>

      <TouchableOpacity
        onPress={onEdit}
        hitSlop={8}
        style={{ marginRight: 12 }}
      >
        <Icon name="pencil-outline" size={18} color={mutedRgb} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} hitSlop={8}>
        <Icon name="trash-outline" size={18} color="rgb(239,68,68)" />
      </TouchableOpacity>
    </View>
  );
}

// ── Category Form Modal ───────────────────────────────────

function CategoryFormModal({
  visible,
  category,
  prefill,
  nextSortOrder,
  onClose,
}: {
  visible: boolean;
  category: ProgramCategoryRow | null;
  prefill: ProgramCategoryRow | null;
  nextSortOrder: number;
  onClose: () => void;
}) {
  const { colors, logoUrl } = useMasjidConfig();
  const insets = useSafeAreaInsets();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ',')})`;
  const bgRgb = `rgb(${colors.card.replace(/ /g, ',')})`;
  const labelColor = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.6)`;
  const borderColor = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.1)`;
  const placeholderColor = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.25)`;
  const mutedRgb = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.5)`;
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;
  const primaryRgb = `rgb(${colors.primary.replace(/ /g, ',')})`;
  const cardBg = `rgb(${colors.muted.replace(/ /g, ',')})`;

  const createCategory = useCreateProgramCategory();
  const updateCategory = useUpdateProgramCategory();
  const { pickAndUpload, isUploading } = useUploadContentImage();

  const isEditing = category !== null;
  const mutation = isEditing ? updateCategory : createCategory;

  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState<string | null>(null);
  const [audience, setAudience] = useState<AudienceFilter>('All');
  // Stable key for uploading a brand-new category's cover before it has an id.
  const draftKey = useRef<string>('draft');

  const [mounted, setMounted] = useState(false);
  const [keyboardUp, setKeyboardUp] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvt =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const animate = (duration?: number) =>
      LayoutAnimation.configureNext({
        duration: duration ?? 250,
        update: {
          type:
            LayoutAnimation.Types.keyboard ??
            LayoutAnimation.Types.easeInEaseOut,
        },
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

  const sheetMaxHeight = keyboardUp
    ? SCREEN_H - keyboardHeight - insets.top - 20
    : SCREEN_H - insets.top - 40;

  useEffect(() => {
    if (visible) {
      // Edit uses the existing row; a prefilled create (from a default card)
      // uses prefill but still saves as a new row.
      const source = category ?? prefill;
      setTitle(source?.title ?? '');
      setImageUrl(source?.image_url ?? null);
      setBgColor(source?.bg_color ?? null);
      setAudience(source?.audience_filter ?? 'All');
      draftKey.current = category?.id ?? `draft-${Date.now()}`;
    }
  }, [visible, category, prefill]);

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

  const handlePickCover = useCallback(
    (source: 'camera' | 'gallery') => {
      pickAndUpload(draftKey.current, source)
        .then((url) => {
          if (url) setImageUrl(url);
        })
        .catch((err) => {
          Alert.alert('Upload failed', err?.message ?? 'Please try again.');
        });
    },
    [pickAndUpload],
  );

  const promptCover = () => {
    Alert.alert('Cover Image', undefined, [
      { text: 'Take Photo', onPress: () => handlePickCover('camera') },
      { text: 'Choose from Library', onPress: () => handlePickCover('gallery') },
      ...(imageUrl
        ? [
            {
              text: 'Remove Cover',
              style: 'destructive' as const,
              onPress: () => setImageUrl(null),
            },
          ]
        : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const handleSave = () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    if (isEditing && category) {
      updateCategory.mutate(
        {
          id: category.id,
          title: trimmed,
          image_url: imageUrl,
          bg_color: bgColor,
          audience_filter: audience,
        },
        { onSuccess: onClose },
      );
    } else {
      createCategory.mutate(
        {
          title: trimmed,
          image_url: imageUrl,
          bg_color: bgColor,
          audience_filter: audience,
          sort_order: nextSortOrder,
        },
        { onSuccess: onClose },
      );
    }
  };

  const canSave = title.trim().length > 0 && !mutation.isPending;
  const previewBg = bgColor ?? cardBg;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
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
            borderRadius: 40,
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
          {/* Cancel / Title / Save bar */}
          <View
            className="flex-row items-center justify-between px-6"
            style={{
              height: 56,
              borderBottomWidth: 0.5,
              borderBottomColor: borderColor,
            }}
          >
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Text style={{ color: mutedRgb, fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ color: fgRgb, fontSize: 16, fontWeight: '700' }}>
              {isEditing ? 'Edit Category' : 'New Category'}
            </Text>
            <TouchableOpacity onPress={handleSave} hitSlop={8} disabled={!canSave}>
              <Text
                style={{
                  color: accentRgb,
                  fontSize: 15,
                  fontWeight: '700',
                  opacity: canSave ? 1 : 0.4,
                }}
              >
                {mutation.isPending ? 'Saving…' : isEditing ? 'Save' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 28, paddingTop: 20 }}
          >
            {/* Cover card */}
            <View className="items-center pb-5">
              <TouchableOpacity
                onPress={promptCover}
                activeOpacity={0.85}
                disabled={isUploading}
              >
                <View
                  style={{
                    width: 150,
                    height: 196,
                    borderRadius: 16,
                    overflow: 'hidden',
                    backgroundColor: previewBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {imageUrl ? (
                    <Image
                      source={{ uri: imageUrl }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  ) : logoUrl ? (
                    // Masjid logo placeholder behind the Add Cover pill.
                    <Image
                      source={{ uri: logoUrl }}
                      style={{ width: '64%', height: '50%' }}
                      contentFit="contain"
                    />
                  ) : null}

                  {/* Add Cover pill overlay — sits lower so the logo shows above it */}
                  <View
                    style={{
                      position: 'absolute',
                      bottom: imageUrl ? undefined : 22,
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'rgba(0,0,0,0.45)',
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 999,
                    }}
                  >
                    {isUploading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Icon name="camera-outline" size={15} color="#fff" />
                        <Text
                          style={{
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: '600',
                            marginLeft: 6,
                          }}
                        >
                          {imageUrl ? 'Change Cover' : 'Add Cover'}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Name */}
            <View className="px-6" style={{ marginBottom: 20 }}>
              <FieldLabel text="Name" color={labelColor} />
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Enter category name"
                placeholderTextColor={placeholderColor}
                autoCapitalize="words"
                style={{
                  fontSize: 15,
                  fontWeight: '500',
                  color: fgRgb,
                  borderBottomWidth: 1,
                  borderBottomColor: borderColor,
                  paddingBottom: 8,
                  paddingTop: 2,
                }}
              />
            </View>

            {/* Opens (audience filter) */}
            <View className="px-6" style={{ marginBottom: 22 }}>
              <FieldLabel text="Opens" color={labelColor} />
              <View className="flex-row" style={{ gap: 8 }}>
                {AUDIENCE_FILTERS.map((f) => {
                  const active = f === audience;
                  return (
                    <Pressable
                      key={f}
                      onPress={() => setAudience(f)}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        paddingVertical: 9,
                        borderRadius: 999,
                        backgroundColor: active ? primaryRgb : 'transparent',
                        borderWidth: 1,
                        borderColor: active ? primaryRgb : borderColor,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: active
                            ? `rgb(${colors.background.replace(/ /g, ',')})`
                            : mutedRgb,
                        }}
                      >
                        {f}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Background color */}
            <View className="px-6">
              <FieldLabel text="Background Color" color={labelColor} />
              <View className="flex-row flex-wrap" style={{ gap: 12 }}>
                {BG_SWATCHES.map((c) => {
                  const active = c === bgColor;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => setBgColor(active ? null : c)}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        backgroundColor: c,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: active ? 3 : 0,
                        borderColor: accentRgb,
                      }}
                    >
                      {active ? (
                        <Icon name="checkmark" size={20} color="#fff" />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {mutation.isError ? (
              <Text className="mt-4 px-6 text-center text-[12px] text-red-500">
                {mutation.error?.message ?? 'Failed to save'}
              </Text>
            ) : null}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FieldLabel({ text, color }: { text: string; color: string }) {
  return (
    <Text
      style={{
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        color,
        marginBottom: 10,
      }}
    >
      {text}
    </Text>
  );
}

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';

import { Icon } from '@/src/components/ui/icon';
import { BackButton } from '@/src/components/ui/back-button';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useAutoStatusBarStyle } from '@/src/hooks/use-status-bar-style';
import {
  isPlausibleUrl,
  normalizeVolunteerUrl,
  useSaveVolunteerUrl,
  useVolunteerUrl,
} from '@/src/hooks/use-volunteer';

export default function VolunteerAdminScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors } = useMasjidConfig();
  useAutoStatusBarStyle(colors.card);
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ',')})`;
  const mutedRgb = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.5)`;
  const borderColor = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.1)`;
  const primaryRgb = `rgb(${colors.primary.replace(/ /g, ',')})`;

  const { volunteerUrl, isLoading } = useVolunteerUrl();
  const save = useSaveVolunteerUrl();

  const [url, setUrl] = useState('');
  const [hydrated, setHydrated] = useState(false);

  // Seed from the saved value once, so typing isn't clobbered by a refetch.
  useEffect(() => {
    if (!isLoading && !hydrated) {
      setUrl(volunteerUrl ?? '');
      setHydrated(true);
    }
  }, [isLoading, hydrated, volunteerUrl]);

  const trimmed = url.trim();
  const dirty = trimmed !== (volunteerUrl ?? '');
  // Empty is valid and meaningful — it removes the tile from Home.
  const valid = trimmed === '' || isPlausibleUrl(trimmed);
  const canSave = dirty && valid && !save.isPending;

  const preview = () => {
    const normalized = normalizeVolunteerUrl(trimmed);
    if (normalized) WebBrowser.openBrowserAsync(normalized).catch(() => {});
  };

  return (
    <View className="flex-1 bg-card" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-5" style={{ height: 52 }}>
        <BackButton color={fgRgb} />
        <Text style={{ color: fgRgb, fontSize: 16, fontWeight: '600', marginStart: 12 }}>
          {t('admin.volunteer')}
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={fgRgb} />
        </View>
      ) : (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={{ color: mutedRgb, fontSize: 13, lineHeight: 20, marginTop: 16 }}>
              {t('admin.volunteerIntro')}
            </Text>

            <Text
              style={{
                color: mutedRgb,
                fontSize: 11,
                fontWeight: '600',
                letterSpacing: 1.8,
                textTransform: 'uppercase',
                marginTop: 24,
                marginBottom: 10,
              }}
            >
              {t('admin.volunteerLink')}
            </Text>

            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder={t('admin.volunteerPlaceholder')}
              placeholderTextColor={mutedRgb}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              inputMode="url"
              style={{
                borderWidth: 1,
                borderColor: valid ? borderColor : '#ef4444',
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 13,
                fontSize: 14,
                color: fgRgb,
              }}
            />

            {!valid ? (
              <Text style={{ color: '#ef4444', fontSize: 11, marginTop: 6 }}>
                {t('admin.volunteerInvalid')}
              </Text>
            ) : (
              <Text style={{ color: mutedRgb, fontSize: 11, marginTop: 6 }}>
                {trimmed === '' ? t('admin.volunteerEmptyHint') : t('admin.volunteerSavedHint')}
              </Text>
            )}

            {trimmed !== '' && valid ? (
              <TouchableOpacity
                onPress={preview}
                activeOpacity={0.7}
                className="mt-3 flex-row items-center gap-2"
              >
                <Icon name="globe" size={14} color={primaryRgb} />
                <Text style={{ color: primaryRgb, fontSize: 13, fontWeight: '600' }}>
                  {t('admin.volunteerPreview')}
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => save.mutate(url)}
              disabled={!canSave}
              className="items-center justify-center rounded-full bg-primary"
              style={{ height: 48, marginTop: 28, opacity: canSave ? 1 : 0.5 }}
            >
              <Text className="text-[15px] font-semibold text-primary-foreground">
                {save.isPending
                  ? t('admin.saving')
                  : save.isSuccess && !dirty
                    ? t('admin.saved')
                    : t('common.save')}
              </Text>
            </TouchableOpacity>

            {save.isError ? (
              <Text className="mt-2 text-center text-[11px] text-red-500">
                {save.error?.message ?? t('admin.failedToSave')}
              </Text>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

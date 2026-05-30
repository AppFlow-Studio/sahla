import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { TimePicker, formatTimePreview } from '@/src/components/admin/time-picker';
import {
  IQAMAH_PRAYERS,
  useIqamahConfig,
  useSaveIqamahConfig,
  type IqamahMode,
  type IqamahRuleInput,
} from '@/src/hooks/use-iqamah';

type PrayerForm = { mode: IqamahMode; fixedTime: string; offsetMinutes: number };

// Sensible starting points before the admin has configured anything.
const DEFAULTS: Record<string, PrayerForm> = {
  fajr: { mode: 'offset', fixedTime: '06:00', offsetMinutes: 20 },
  dhuhr: { mode: 'fixed', fixedTime: '13:30', offsetMinutes: 10 },
  asr: { mode: 'offset', fixedTime: '17:00', offsetMinutes: 15 },
  maghrib: { mode: 'offset', fixedTime: '19:00', offsetMinutes: 5 },
  isha: { mode: 'offset', fixedTime: '21:00', offsetMinutes: 15 },
};

const OFFSET_MIN = 0;
const OFFSET_MAX = 90;
const OFFSET_STEP = 5;

export default function IqamahScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useMasjidConfig();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ',')})`;
  const mutedRgb = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.5)`;
  const labelColor = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.6)`;
  const borderColor = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.1)`;
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;

  const { rules, isLoading } = useIqamahConfig();
  const save = useSaveIqamahConfig();

  const [forms, setForms] = useState<Record<string, PrayerForm>>(() => ({ ...DEFAULTS }));
  const [hydrated, setHydrated] = useState(false);

  // Seed the form from saved rules once they load (only the first time, so we
  // don't clobber in-progress edits on a background refetch).
  useEffect(() => {
    if (isLoading || hydrated) return;
    const next: Record<string, PrayerForm> = {};
    for (const { key } of IQAMAH_PRAYERS) {
      const rule = rules.find((r) => r.prayer_name.toLowerCase() === key);
      const base = DEFAULTS[key];
      next[key] = rule
        ? {
            mode: rule.mode === 'fixed' ? 'fixed' : 'offset',
            fixedTime: rule.fixed_time?.slice(0, 5) ?? base.fixedTime,
            offsetMinutes: rule.offset_minutes ?? base.offsetMinutes,
          }
        : { ...base };
    }
    setForms(next);
    setHydrated(true);
  }, [isLoading, hydrated, rules]);

  const update = (key: string, patch: Partial<PrayerForm>) =>
    setForms((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const dirty = useMemo(() => {
    // Compare against saved rules to enable/disable Save.
    return IQAMAH_PRAYERS.some(({ key }) => {
      const f = forms[key];
      const rule = rules.find((r) => r.prayer_name.toLowerCase() === key);
      if (!rule) return true;
      if (rule.mode !== f.mode) return true;
      if (f.mode === 'fixed') return (rule.fixed_time?.slice(0, 5) ?? '') !== f.fixedTime;
      return (rule.offset_minutes ?? null) !== f.offsetMinutes;
    });
  }, [forms, rules]);

  const handleSave = () => {
    const payload: IqamahRuleInput[] = IQAMAH_PRAYERS.map(({ key }) => {
      const f = forms[key];
      return {
        prayer_name: key,
        mode: f.mode,
        fixed_time: f.mode === 'fixed' ? f.fixedTime : null,
        offset_minutes: f.mode === 'offset' ? f.offsetMinutes : null,
      };
    });
    save.mutate(payload);
  };

  return (
    <View className="flex-1 bg-card" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-5" style={{ height: 52 }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={fgRgb} />
        </Pressable>
        <Text style={{ color: fgRgb, fontSize: 16, fontWeight: '600', marginLeft: 12 }}>
          Iqamah Times
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={fgRgb} />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + 140 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ color: mutedRgb, fontSize: 12, lineHeight: 18, marginBottom: 16 }}>
            Set each prayer to a fixed time or a number of minutes after the athan.
            Offsets adjust automatically as athan times shift through the year.
          </Text>

          {IQAMAH_PRAYERS.map(({ key, label }) => {
            const f = forms[key] ?? DEFAULTS[key];
            return (
              <View
                key={key}
                style={{
                  borderWidth: 1,
                  borderColor,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                <View className="flex-row items-center justify-between" style={{ marginBottom: 12 }}>
                  <Text style={{ color: fgRgb, fontSize: 15, fontWeight: '700' }}>{label}</Text>
                  <Text style={{ color: accentRgb, fontSize: 12, fontWeight: '600' }}>
                    {f.mode === 'fixed'
                      ? formatTimePreview(f.fixedTime, '24h')
                      : `Athan + ${f.offsetMinutes} min`}
                  </Text>
                </View>

                {/* Mode toggle */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                  {(
                    [
                      { label: 'After athan', value: 'offset' },
                      { label: 'Fixed time', value: 'fixed' },
                    ] as { label: string; value: IqamahMode }[]
                  ).map((opt) => {
                    const active = f.mode === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => update(key, { mode: opt.value })}
                        activeOpacity={0.8}
                        style={{
                          flex: 1,
                          paddingVertical: 9,
                          borderRadius: 10,
                          alignItems: 'center',
                          backgroundColor: active ? accentRgb : 'transparent',
                          borderWidth: 1,
                          borderColor: active ? accentRgb : borderColor,
                        }}
                      >
                        <Text
                          style={{ fontSize: 13, fontWeight: '600', color: active ? '#fff' : fgRgb }}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {f.mode === 'fixed' ? (
                  <View className="flex-row items-center justify-between">
                    <Text style={{ color: labelColor, fontSize: 13 }}>Iqamah at</Text>
                    <TimePicker
                      value={f.fixedTime}
                      onChange={(v) => update(key, { fixedTime: v })}
                      mode="24h"
                      accentRgb={accentRgb}
                      fgRgb={fgRgb}
                      borderColor={borderColor}
                    />
                  </View>
                ) : (
                  <View className="flex-row items-center justify-between">
                    <Text style={{ color: labelColor, fontSize: 13 }}>Minutes after athan</Text>
                    <View className="flex-row items-center" style={{ gap: 14 }}>
                      <Stepper
                        icon="remove"
                        disabled={f.offsetMinutes <= OFFSET_MIN}
                        onPress={() =>
                          update(key, {
                            offsetMinutes: Math.max(OFFSET_MIN, f.offsetMinutes - OFFSET_STEP),
                          })
                        }
                        fgRgb={fgRgb}
                        borderColor={borderColor}
                      />
                      <Text
                        style={{ color: fgRgb, fontSize: 16, fontWeight: '700', minWidth: 28, textAlign: 'center' }}
                      >
                        {f.offsetMinutes}
                      </Text>
                      <Stepper
                        icon="add"
                        disabled={f.offsetMinutes >= OFFSET_MAX}
                        onPress={() =>
                          update(key, {
                            offsetMinutes: Math.min(OFFSET_MAX, f.offsetMinutes + OFFSET_STEP),
                          })
                        }
                        fgRgb={fgRgb}
                        borderColor={borderColor}
                      />
                    </View>
                  </View>
                )}
              </View>
            );
          })}

          {/* Save */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSave}
            disabled={!dirty || save.isPending}
            className="items-center justify-center rounded-full bg-primary"
            style={{ height: 48, marginTop: 8, opacity: !dirty || save.isPending ? 0.5 : 1 }}
          >
            <Text className="text-[15px] font-semibold text-primary-foreground">
              {save.isPending ? 'Saving...' : save.isSuccess && !dirty ? 'Saved' : 'Save'}
            </Text>
          </TouchableOpacity>
          {save.isError && (
            <Text className="mt-2 text-center text-[11px] text-red-500">
              {save.error?.message ?? 'Failed to save'}
            </Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function Stepper({
  icon,
  onPress,
  disabled,
  fgRgb,
  borderColor,
}: {
  icon: 'add' | 'remove';
  onPress: () => void;
  disabled: boolean;
  fgRgb: string;
  borderColor: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        borderWidth: 1,
        borderColor,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <Ionicons name={icon} size={18} color={fgRgb} />
    </TouchableOpacity>
  );
}

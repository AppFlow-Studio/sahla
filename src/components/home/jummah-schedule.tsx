import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import { Icon } from '@/src/components/ui/icon';
import type { IconName } from '@/src/components/ui/icon';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useJummahSchedule, type JummahSlot } from '@/src/hooks/use-jummah-schedule';
import { JummahDetailSheet } from './jummah-detail-sheet';

export function JummahScheduleCard() {
  const { colors } = useMasjidConfig();
  const { slots, date } = useJummahSchedule();
  const accent = colors.accent.replace(/ /g, ',');
  const fg = colors.primaryForeground.replace(/ /g, ',');
  const accentRgb = `rgb(${accent})`;
  const textRgb = `rgb(${fg})`;
  const [selected, setSelected] = useState<JummahSlot | null>(null);

  if (slots.length === 0) return null;

  return (
    <View className="px-5 pb-5 pt-2">
      <View
        className="self-start"
        style={{
          borderWidth: 0.5,
          borderColor: `rgba(${accent},0.5)`,
          paddingHorizontal: 10,
          paddingVertical: 3,
          borderRadius: 100,
        }}
      >
        <Text style={{ color: accentRgb, fontSize: 10 }}>{date}</Text>
      </View>

      <Text
        style={{
          color: textRgb,
          fontSize: 20,
          fontFamily: 'PlayfairDisplay_400Regular',
          marginTop: 10,
          marginBottom: 14,
        }}
      >
        Jummah Schedule
      </Text>

      <View style={{ gap: 8 }}>
        {slots.map((slot) => (
          <TouchableOpacity
            key={slot.id}
            activeOpacity={0.7}
            onPress={() => setSelected(slot)}
            className="flex-row items-center"
            style={{
              borderRadius: 14,
              backgroundColor: slot.isCurrent ? `rgba(${accent},0.18)` : 'transparent',
              borderWidth: slot.isCurrent ? 0.5 : 0,
              borderColor: `rgba(${accent},0.5)`,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <View
              className="items-center justify-center"
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: `rgba(${accent},0.18)`,
                marginRight: 12,
              }}
            >
              <Icon
                name={slot.icon as IconName}
                size={18}
                color={accentRgb}
              />
            </View>
            <View className="flex-1">
              <Text style={{ color: textRgb, fontSize: 13, fontWeight: '600' }}>
                {slot.title}
              </Text>
              <Text style={{ color: `rgba(${fg},0.55)`, fontSize: 10, marginTop: 2 }}>
                {slot.speaker}
              </Text>
            </View>
            <Text style={{ color: textRgb, fontSize: 13, fontWeight: '600' }}>
              {slot.time}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <JummahDetailSheet slot={selected} onClose={() => setSelected(null)} />
    </View>
  );
}

import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

/**
 * Native date picker (wraps @react-native-community/datetimepicker) that reads
 * and writes a "YYYY-MM-DD" string (the format stored in free-text date
 * columns). iOS renders the inline compact control; Android opens the dialog.
 */

const pad = (n: number) => String(n).padStart(2, '0');
const formatYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function parseYMD(value: string | null | undefined): Date {
  const m = (value ?? '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function DatePicker({
  value,
  onChange,
  accentRgb,
  fgRgb,
  labelColor,
  borderColor,
  allowClear = false,
}: {
  value: string;
  onChange: (next: string) => void;
  accentRgb: string;
  fgRgb: string;
  labelColor: string;
  borderColor: string;
  /** Show a "Clear" action (for optional dates like an end date). */
  allowClear?: boolean;
}) {
  const [show, setShow] = useState(false);
  const date = parseYMD(value);

  const handleChange = (event: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (event.type === 'set' && picked) onChange(formatYMD(picked));
  };

  const clearButton =
    allowClear && value ? (
      <Pressable
        onPress={() => onChange('')}
        hitSlop={8}
        style={{
          marginLeft: 12,
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 999,
          borderWidth: 1,
          borderColor,
        }}
      >
        <Text style={{ color: labelColor, fontSize: 12, fontWeight: '600' }}>Clear</Text>
      </Pressable>
    ) : null;

  if (Platform.OS === 'ios') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <DateTimePicker
          value={date}
          mode="date"
          display="compact"
          accentColor={accentRgb}
          onChange={handleChange}
        />
        {clearButton}
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Pressable
        onPress={() => setShow(true)}
        style={{
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 10,
          borderWidth: 1,
          borderColor,
        }}
      >
        <Text style={{ color: fgRgb, fontSize: 15, fontWeight: '600' }}>
          {value || 'Select date'}
        </Text>
      </Pressable>
      {clearButton}
      {show ? (
        <DateTimePicker value={date} mode="date" display="default" onChange={handleChange} />
      ) : null}
    </View>
  );
}

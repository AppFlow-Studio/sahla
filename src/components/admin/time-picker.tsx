import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

/**
 * Native time picker (wraps @react-native-community/datetimepicker) that reads
 * and writes the free-text string formats stored in the DB:
 *   - mode '12h' → "4:00 PM"  (e.g. jummah.prayer_time)
 *   - mode '24h' → "16:00"    (e.g. content.start_time)
 *
 * iOS renders the inline compact control; Android opens the native dialog.
 */

type Mode = '12h' | '24h';

const pad = (n: number) => String(n).padStart(2, '0');

function parseToDate(value: string | null | undefined, mode: Mode): Date {
  const d = new Date();
  d.setSeconds(0, 0);
  const raw = (value ?? '').trim();
  if (mode === '24h') {
    const m = raw.match(/^(\d{1,2}):(\d{2})$/);
    if (m) {
      d.setHours(Number(m[1]), Number(m[2]));
      return d;
    }
    d.setHours(16, 0);
    return d;
  }
  const m = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m) {
    let h = Number(m[1]) % 12;
    if (m[3].toUpperCase() === 'PM') h += 12;
    d.setHours(h, Number(m[2]));
    return d;
  }
  d.setHours(12, 15);
  return d;
}

function formatFromDate(d: Date, mode: Mode): string {
  const h24 = d.getHours();
  const mm = pad(d.getMinutes());
  if (mode === '24h') return `${pad(h24)}:${mm}`;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;
  return `${h12}:${mm} ${period}`;
}

/** Human-readable preview ("4:00 PM") regardless of the stored mode. */
export function formatTimePreview(value: string, mode: Mode = '12h'): string {
  return formatFromDate(parseToDate(value, mode), '12h');
}

export function TimePicker({
  value,
  onChange,
  accentRgb,
  fgRgb,
  borderColor,
  mode = '12h',
}: {
  value: string;
  onChange: (next: string) => void;
  accentRgb: string;
  fgRgb: string;
  borderColor: string;
  /** Output string format. '12h' → "4:00 PM", '24h' → "16:00". */
  mode?: Mode;
}) {
  const [show, setShow] = useState(false);
  const date = parseToDate(value, mode);

  const handleChange = (event: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (event.type === 'set' && picked) onChange(formatFromDate(picked, mode));
  };

  if (Platform.OS === 'ios') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <DateTimePicker
          value={date}
          mode="time"
          display="compact"
          accentColor={accentRgb}
          onChange={handleChange}
        />
      </View>
    );
  }

  return (
    <View>
      <Pressable
        onPress={() => setShow(true)}
        style={{
          alignSelf: 'flex-start',
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 10,
          borderWidth: 1,
          borderColor,
        }}
      >
        <Text style={{ color: fgRgb, fontSize: 15, fontWeight: '600' }}>
          {formatFromDate(date, mode)}
        </Text>
      </Pressable>
      {show ? (
        <DateTimePicker
          value={date}
          mode="time"
          display="default"
          is24Hour={mode === '24h'}
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}

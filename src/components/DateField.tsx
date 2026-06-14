import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar, Clock } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { font, radii, spacing } from '../theme';

type Mode = 'date' | 'time';

type Props = {
  mode?: Mode;
  label?: string;
  required?: boolean;
  /** date: "YYYY-MM-DD"  |  time: "HH:MM" */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const pad = (n: number) => String(n).padStart(2, '0');

function formatDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function formatTime(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Parse the stored string back into a Date for the picker's initial value. */
function parseValue(value: string, mode: Mode): Date {
  const now = new Date();
  if (!value) return now;
  if (mode === 'date') {
    const [y, m, d] = value.split('-').map(Number);
    if (y && m && d) return new Date(y, m - 1, d);
    return now;
  }
  const [h, min] = value.split(':').map(Number);
  if (!isNaN(h)) {
    const dt = new Date();
    dt.setHours(h, min || 0, 0, 0);
    return dt;
  }
  return now;
}

export function DateField({ mode = 'date', label, required, value, onChange, placeholder }: Props) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [show, setShow] = useState(false);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const ph = placeholder || (mode === 'date' ? 'YYYY-MM-DD' : 'HH:MM');
  const Icon = mode === 'date' ? Calendar : Clock;

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    // On Android the picker is a dialog that closes itself; dismiss it on any event.
    if (Platform.OS === 'android') setShow(false);
    if (event.type === 'dismissed' || !selected) return;
    onChange(mode === 'date' ? formatDate(selected) : formatTime(selected));
  };

  return (
    <View style={styles.field}>
      {label ? (
        <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>
          {label}{required ? ' *' : ''}
        </Text>
      ) : null}

      <TouchableOpacity
        style={[
          styles.input,
          { backgroundColor: colors.statusBg, borderColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}
        onPress={() => setShow(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.value, { color: value ? colors.ink : colors.textMuted, textAlign: align }]}>
          {value || ph}
        </Text>
        <Icon size={18} color={colors.textMuted} />
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={parseValue(value, mode)}
          mode={mode}
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  input: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  value: { flex: 1, fontSize: font.sizes.sm },
});

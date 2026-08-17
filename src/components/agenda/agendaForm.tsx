import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LanguageContext';
import { font, radii, spacing } from '../../theme';
import { REMINDER_OPTIONS } from './agendaShared';

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
      {children}
    </View>
  );
}

export function Chips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const active = value === o;
        return (
          <TouchableOpacity
            key={o}
            style={[styles.chip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : colors.statusBg }]}
            onPress={() => onChange(o)}
          >
            <Text style={[styles.chipText, { color: active ? '#FFF' : colors.ink }]}>{t(o)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function ReminderChips({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const toggle = (val: string) => {
    onChange(value.includes(val) ? value.filter((r) => r !== val) : [...value, val]);
  };
  return (
    <View style={styles.chips}>
      {REMINDER_OPTIONS.map((opt) => {
        const active = value.includes(opt.value);
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.chip,
              active
                ? { borderColor: colors.warning || '#F59E0B', backgroundColor: '#FEF3C7' }
                : { borderColor: colors.border, backgroundColor: colors.statusBg },
            ]}
            onPress={() => toggle(opt.value)}
          >
            <Text style={[styles.chipText, { color: active ? '#B45309' : colors.ink }]}>{t(opt.key)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export const PRESET_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#0EA5E9', '#22C55E'];

export function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.chips}>
      {PRESET_COLORS.map((c) => (
        <TouchableOpacity
          key={c}
          style={[styles.swatch, { backgroundColor: c, borderColor: value === c ? colors.primary : colors.border }]}
          onPress={() => onChange(c)}
        >
          {value === c ? <Text style={styles.swatchCheck}>✓</Text> : null}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { borderRadius: radii.full, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  chipText: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  field: { gap: spacing.xs },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  swatch: {
    alignItems: 'center',
    borderRadius: radii.full,
    borderWidth: 2,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  swatchCheck: { color: '#FFF', fontSize: font.sizes.sm, fontWeight: font.weights.bold },
});

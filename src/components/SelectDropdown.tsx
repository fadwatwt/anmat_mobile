import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { font, radii, spacing } from '../theme';

type Option = { label: string; value: string };

type SelectDropdownProps = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  hasError?: boolean;
  /** Translate option labels via i18n (use for static enum options, not real data). */
  translateLabels?: boolean;
};

export function SelectDropdown({ options, value, onChange, placeholder, label, required, hasError, translateLabels }: SelectDropdownProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const lbl = (s: string) => (translateLabels ? t(s) : s);
  const selected = options.find(o => o.value === value);
  const filtered = options.filter(o => lbl(o.label).toLowerCase().includes(search.toLowerCase()));
  const align = isRTL ? 'right' as const : 'left' as const;

  return (
    <View>
      {label && (
        <Text style={[s.label, { color: colors.textMuted, textAlign: align }]}>
          {label}{required ? ' *' : ''}
        </Text>
      )}
      <TouchableOpacity
        style={[s.trigger, { backgroundColor: colors.surface, borderColor: hasError ? colors.danger : colors.border }]}
        onPress={() => { setOpen(true); setSearch(''); }}
        activeOpacity={0.7}
      >
        <Text style={[s.triggerText, { color: selected ? colors.ink : colors.textMuted, textAlign: align, flex: 1 }]}>
          {selected ? lbl(selected.label) : (placeholder || t('Select...'))}
        </Text>
        <ChevronDown size={16} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.overlay} onPress={() => setOpen(false)}>
          <Pressable style={[s.sheet, { backgroundColor: colors.surface }]}>
            <TextInput
              style={[s.search, { backgroundColor: colors.background, color: colors.ink, borderColor: colors.border }]}
              placeholder={t('Search...')}
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            <FlatList
              data={filtered}
              keyExtractor={o => o.value}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <TouchableOpacity
                    style={[s.option, { borderBottomColor: colors.border }, isSelected && { backgroundColor: colors.primary + '15' }]}
                    onPress={() => { onChange(item.value); setOpen(false); }}
                  >
                    <Text style={[s.optionText, { color: colors.ink, textAlign: align, flex: 1 }]}>{lbl(item.label)}</Text>
                    {isSelected && <Check size={16} color={colors.primary} />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={[s.empty, { color: colors.textMuted }]}>{t('No results')}</Text>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

type MultiSelectDropdownProps = {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  hasError?: boolean;
  /** Translate option labels via i18n (use for static enum options, not real data). */
  translateLabels?: boolean;
};

export function MultiSelectDropdown({ options, value, onChange, placeholder, label, required, hasError, translateLabels }: MultiSelectDropdownProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const lbl = (s: string) => (translateLabels ? t(s) : s);
  const selectedLabels = options.filter(o => value.includes(o.value)).map(o => lbl(o.label)).join(', ');
  const filtered = options.filter(o => lbl(o.label).toLowerCase().includes(search.toLowerCase()));
  const align = isRTL ? 'right' as const : 'left' as const;

  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);
  };

  return (
    <View>
      {label && (
        <Text style={[s.label, { color: colors.textMuted, textAlign: align }]}>
          {label}{required ? ' *' : ''}
        </Text>
      )}
      <TouchableOpacity
        style={[s.trigger, { backgroundColor: colors.surface, borderColor: hasError ? colors.danger : colors.border }]}
        onPress={() => { setOpen(true); setSearch(''); }}
        activeOpacity={0.7}
      >
        <Text style={[s.triggerText, { color: selectedLabels ? colors.ink : colors.textMuted, textAlign: align, flex: 1 }]} numberOfLines={1}>
          {selectedLabels || (placeholder || t('Select...'))}
        </Text>
        <ChevronDown size={16} color={colors.textMuted} />
      </TouchableOpacity>
      {value.length > 0 && (
        <Text style={[s.count, { color: colors.primary }]}>{value.length} {t('selected')}</Text>
      )}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.overlay} onPress={() => setOpen(false)}>
          <Pressable style={[s.sheet, { backgroundColor: colors.surface }]}>
            <TextInput
              style={[s.search, { backgroundColor: colors.background, color: colors.ink, borderColor: colors.border }]}
              placeholder={t('Search...')}
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            <FlatList
              data={filtered}
              keyExtractor={o => o.value}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => {
                const isSelected = value.includes(item.value);
                return (
                  <TouchableOpacity
                    style={[s.option, { borderBottomColor: colors.border }, isSelected && { backgroundColor: colors.primary + '15' }]}
                    onPress={() => toggle(item.value)}
                  >
                    <View style={[s.checkbox, { borderColor: isSelected ? colors.primary : colors.border, backgroundColor: isSelected ? colors.primary : 'transparent' }]}>
                      {isSelected && <Check size={12} color="#FFF" />}
                    </View>
                    <Text style={[s.optionText, { color: colors.ink, textAlign: align, flex: 1 }]}>{lbl(item.label)}</Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={[s.empty, { color: colors.textMuted }]}>{t('No results')}</Text>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium, marginBottom: 4 },
  trigger: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: radii.lg,
    paddingHorizontal: spacing.md, height: 44,
    gap: spacing.xs,
  },
  triggerText: { fontSize: font.sizes.sm },
  count: { fontSize: font.sizes.xs, marginTop: 2 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.md },
  sheet: { borderRadius: radii.xxl, padding: spacing.md, maxHeight: 440 },
  search: {
    borderWidth: 1, borderRadius: radii.lg,
    paddingHorizontal: spacing.md, height: 44,
    fontSize: font.sizes.sm, marginBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
  },
  optionText: { fontSize: font.sizes.base },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  empty: { textAlign: 'center', padding: spacing.lg, fontSize: font.sizes.sm },
});

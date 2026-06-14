import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronDown, Search, X, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { fetchEmployees } from '../services/employees';
import { font, radii, spacing } from '../theme';
import type { EmployeeDetailItem } from '../types';

type Props = {
  value: string;
  onChange: (userId: string, name: string) => void;
  label?: string;
  required?: boolean;
};

export function EmployeePicker({ value, onChange, label, required }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<EmployeeDetailItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedName, setSelectedName] = useState('');

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setLoadingList(true);
    fetchEmployees()
      .then(setEmployees)
      .catch(() => setEmployees([]))
      .finally(() => setLoadingList(false));
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.toLowerCase();
    return employees.filter(
      (e) =>
        (e.user?.name || '').toLowerCase().includes(q) ||
        (e.user?.email || '').toLowerCase().includes(q),
    );
  }, [employees, search]);

  const handleSelect = (emp: EmployeeDetailItem) => {
    const name = emp.user?.name || '--';
    onChange(emp.user_id, name);
    setSelectedName(name);
    setOpen(false);
  };

  return (
    <>
      {/* Trigger button */}
      <View style={{ gap: spacing.xs }}>
        {label && (
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>
            {label}{required ? ' *' : ''}
          </Text>
        )}
        <TouchableOpacity
          style={[
            styles.trigger,
            {
              backgroundColor: colors.statusBg,
              borderColor: value ? colors.primary : colors.border,
            },
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
          onPress={() => setOpen(true)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.triggerText,
              { color: value ? colors.ink : colors.textMuted, textAlign: align, flex: 1 },
            ]}
            numberOfLines={1}
          >
            {selectedName || (value ? value : t('Select Employee'))}
          </Text>
          <ChevronDown size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Picker modal */}
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            {/* Header */}
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.sheetTitle, { color: colors.ink }]}>{t('Select Employee')}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Search size={16} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: colors.ink, textAlign: align }]}
                placeholder={t('Search employees...')}
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <X size={14} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* List */}
            {loadingList ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(e) => e.user_id}
                renderItem={({ item: emp }) => {
                  const name = emp.user?.name || '--';
                  const email = emp.user?.email || '';
                  const sel = value === emp.user_id;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.empRow,
                        { borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' },
                        sel && { backgroundColor: colors.primary + '14' },
                      ]}
                      onPress={() => handleSelect(emp)}
                      activeOpacity={0.6}
                    >
                      <View style={[styles.avatar, { backgroundColor: colors.primary + '22' }]}>
                        <Text style={[styles.avatarLetter, { color: colors.primary }]}>
                          {name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.empName, { color: sel ? colors.primary : colors.ink, textAlign: align }]} numberOfLines={1}>
                          {name}
                        </Text>
                        {!!email && (
                          <Text style={[styles.empEmail, { color: colors.textMuted, textAlign: align }]} numberOfLines={1}>
                            {email}
                          </Text>
                        )}
                      </View>
                      {sel && <Check size={18} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    {t('No employees found')}
                  </Text>
                }
                keyboardShouldPersistTaps="handled"
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  trigger: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  triggerText: { fontSize: font.sizes.sm },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingBottom: spacing.xl,
  },
  sheetHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sheetTitle: { fontSize: font.sizes.base, fontWeight: font.weights.semibold },
  searchBar: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: font.sizes.sm, padding: 0 },
  empRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  avatarLetter: { fontSize: font.sizes.base, fontWeight: font.weights.bold },
  empName: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  empEmail: { fontSize: font.sizes.xs },
  emptyText: { fontSize: font.sizes.sm, padding: spacing.xl, textAlign: 'center' },
});

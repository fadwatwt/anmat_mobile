import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal as RNModal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, Search, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LanguageContext';
import { fetchEmployees } from '../../services/employees';
import { font, radii, spacing } from '../../theme';
import type { EmployeeDetailItem } from '../../types';

type Props = {
  visible: boolean;
  title?: string;
  /** User ids already part of the project/team (pre-checked). */
  existingIds?: string[];
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (ids: string[]) => void;
};

export function AddMemberModal({ visible, title, existingIds = [], submitting, onClose, onSubmit }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [employees, setEmployees] = useState<EmployeeDetailItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  useEffect(() => {
    if (!visible) return;
    setSearch('');
    setSelected([...existingIds]);
    setLoadingList(true);
    fetchEmployees()
      .then(setEmployees)
      .catch(() => setEmployees([]))
      .finally(() => setLoadingList(false));
  }, [visible, existingIds]);

  const filtered = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.toLowerCase();
    return employees.filter(
      (e) =>
        (e.user?.name || '').toLowerCase().includes(q) ||
        (e.user?.email || '').toLowerCase().includes(q),
    );
  }, [employees, search]);

  const toggle = (emp: EmployeeDetailItem) => {
    const id = emp.user_id;
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleSubmit = () => onSubmit(selected);

  return (
    <RNModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={[styles.sheetHeader, { borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.sheetTitle, { color: colors.ink }]}>{title || t('Add Members')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

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

          {loadingList ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(e) => e.user_id}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              renderItem={({ item: emp }) => {
                const name = emp.user?.name || '--';
                const email = emp.user?.email || '';
                const sel = selected.includes(emp.user_id);
                return (
                  <TouchableOpacity
                    style={[
                      styles.empRow,
                      { borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' },
                      sel && { backgroundColor: colors.primary + '14' },
                    ]}
                    onPress={() => toggle(emp)}
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
            />
          )}

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Text style={[styles.countText, { color: colors.textMuted, textAlign: align }]}>
              {selected.length > 0 ? `${t('Selected')}: ${selected.length}` : ' '}
            </Text>
            <View style={styles.footerBtns}>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.footerBtn, { borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.footerBtnText, { color: colors.ink }]}>{t('Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting}
                style={[styles.footerBtn, { backgroundColor: colors.primary, opacity: submitting ? 0.6 : 1 }]}
                activeOpacity={0.7}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Check size={16} color="#FFF" />
                    <Text style={[styles.footerBtnText, { color: '#FFF' }]}>{t('Save')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '78%',
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
  list: { flexShrink: 1 },
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
  footer: {
    borderTopWidth: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  countText: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  footerBtns: { flexDirection: 'row', gap: spacing.sm },
  footerBtn: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    height: 44,
    justifyContent: 'center',
  },
  footerBtnText: { fontSize: font.sizes.base, fontWeight: font.weights.semibold },
});

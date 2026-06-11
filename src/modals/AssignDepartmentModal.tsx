import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { fetchDepartments, fetchEmployees, assignEmployeesToDepartment } from '../services/employees';
import { font, radii, spacing } from '../theme';
import type { Department, EmployeeDetailItem } from '../types';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialEmployee?: EmployeeDetailItem | null;
};

export function AssignDepartmentModal({ visible, onClose, onSuccess, initialEmployee }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isRTL } = useLocale();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<EmployeeDetailItem[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedEmps, setSelectedEmps] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchDepartments().then(setDepartments).catch(() => {});
      fetchEmployees().then(setEmployees).catch(() => {});
      if (initialEmployee) {
        setSelectedEmps([initialEmployee._id]);
        const deptId = typeof initialEmployee.department_id === 'object'
          ? initialEmployee.department_id?._id
          : initialEmployee.department_id;
        if (deptId) setSelectedDept(deptId);
      } else {
        setSelectedEmps([]);
        setSelectedDept('');
      }
    }
  }, [visible, initialEmployee]);

  const employeesWithoutDept = useMemo(() => {
    return employees.filter(emp => !emp.department && !emp.department_id);
  }, [employees]);

  const toggleEmployee = (id: string) => {
    setSelectedEmps(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!selectedDept) { Alert.alert(t('Error'), t('Please select a department')); return; }
    if (selectedEmps.length === 0) { Alert.alert(t('Error'), t('Please select at least one employee')); return; }
    setSaving(true);
    try {
      await assignEmployeesToDepartment(selectedDept, selectedEmps);
      onSuccess?.();
      onClose();
    } catch (e: any) {
      Alert.alert(t('Error'), e?.data?.message || t('Failed to assign employees'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title={initialEmployee ? t('Assign Department') : t('Assign Department to Employees')} size="md">
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[s.label, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{t('Select Department')} <Text style={s.required}>*</Text></Text>
        <View style={s.chips}>
          {departments.map(d => {
            const active = selectedDept === d._id;
            return (
              <TouchableOpacity
                key={d._id}
                onPress={() => setSelectedDept(d._id)}
                style={[s.chip, active && { backgroundColor: colors.primary }, { borderColor: colors.border }]}
              >
                <Text style={[s.chipText, active && { color: '#FFF' }, { color: active ? '#FFF' : colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{d.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {!initialEmployee && (
          <>
            <Text style={[s.label, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{t('Select Employees')} <Text style={s.required}>*</Text></Text>
            <Text style={[s.hint, { textAlign: isRTL ? 'right' : 'left' }]}>{t('(Only employees without department)')}</Text>
            <View style={[s.empList, { borderColor: colors.border }]}>
              {employeesWithoutDept.length === 0 ? (
                <Text style={[s.empty, { textAlign: 'center' }]}>{t('No employees without department')}</Text>
              ) : (
                employeesWithoutDept.map(emp => (
                  <TouchableOpacity key={emp._id} onPress={() => toggleEmployee(emp._id)} style={s.empRow}>
                    <View style={[s.checkbox, selectedEmps.includes(emp._id) && { backgroundColor: colors.primary, borderColor: colors.primary }]} />
                    <Text style={[s.empName, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{emp.user?.name || t('Unknown')}</Text>
                    <Text style={[s.empEmail, { textAlign: isRTL ? 'right' : 'left' }]}>{emp.user?.email}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
            {selectedEmps.length > 0 && (
              <Text style={[s.selectedCount, { textAlign: isRTL ? 'right' : 'left' }]}>{t('Selected')}: {selectedEmps.length} {t('employee(s)')}</Text>
            )}
          </>
        )}

        <TouchableOpacity onPress={handleSave} disabled={saving} style={[s.btn, { backgroundColor: colors.primary }, saving && s.btnDisabled]}>
          <Text style={[s.btnText, { textAlign: isRTL ? 'right' : 'left' }]}>{saving ? t('Assigning...') : t('Assign Department')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
}

const s = StyleSheet.create({
  scroll: { gap: spacing.md, paddingBottom: spacing.lg },
  label: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  required: { color: '#EF4444' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.full,
    borderWidth: 1,
  },
  chipText: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  hint: { fontSize: font.sizes.xs, color: '#9CA3AF', marginTop: -spacing.sm },
  empList: { maxHeight: 250, borderWidth: 1, borderRadius: radii.lg, overflow: 'hidden' },
  empRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: '#D1D5DB' },
  empName: { fontSize: font.sizes.sm, fontWeight: font.weights.medium, flex: 1 },
  empEmail: { fontSize: font.sizes.xs, color: '#9CA3AF' },
  empty: { padding: spacing.md, textAlign: 'center', color: '#9CA3AF', fontSize: font.sizes.sm },
  selectedCount: { fontSize: font.sizes.xs, color: '#6B7280', textAlign: 'center' },
  btn: { paddingVertical: 12, borderRadius: radii.lg, alignItems: 'center', marginTop: spacing.sm },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#FFF', fontSize: font.sizes.sm, fontWeight: font.weights.bold },
});

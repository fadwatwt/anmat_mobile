import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { DateField } from '../components/DateField';
import { SelectDropdown, MultiSelectDropdown } from '../components/SelectDropdown';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { font, radii, spacing } from '../theme';
import { createEmployee, fetchDepartments } from '../services/employees';
import type { Department } from '../types';

const COUNTRIES = [
  { id: 'Egypt', label: 'Egypt' },
  { id: 'Palestine', label: 'Palestine' },
  { id: 'Jordan', label: 'Jordan' },
  { id: 'Saudi Arabia', label: 'Saudi Arabia' },
];

const CITIES = [
  { id: 'Cairo', label: 'Cairo' },
  { id: 'Alexandria', label: 'Alexandria' },
  { id: 'Gaza', label: 'Gaza' },
  { id: 'Amman', label: 'Amman' },
  { id: 'Riyadh', label: 'Riyadh' },
];

const WEEKEND_DAYS = [
  { id: 'Monday', label: 'Monday' },
  { id: 'Tuesday', label: 'Tuesday' },
  { id: 'Wednesday', label: 'Wednesday' },
  { id: 'Thursday', label: 'Thursday' },
  { id: 'Friday', label: 'Friday' },
  { id: 'Saturday', label: 'Saturday' },
  { id: 'Sunday', label: 'Sunday' },
];

const SHIFT_TYPES = [
  { id: 'HOURS', label: 'Flexible Hours' },
  { id: 'FIXED_SHIFT', label: 'Fixed Shift' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function CreateEmployeeModal({ visible, onClose, onSuccess }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isRTL } = useLocale();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [form, setForm] = useState({
    email: '', name: '', phone: '', password: '', password_confirmation: '',
    date_of_birth: '', country: '', city: '',
    department_id: null as string | null,
    position_id: null as string | null,
    salary: 0, work_hours: 8, shift_type: 'HOURS',
    shift_start_time: '', shift_end_time: '',
    yearly_day_offs: 14, weekend_days: [] as string[],
    storage_quota: null as number | null,
    roles_ids: [] as string[],
  });

  useEffect(() => {
    if (visible) {
      fetchDepartments().then(setDepartments).catch(() => {});
    }
  }, [visible]);

  const deptOptions = useMemo(() => {
    const opts = departments.map(d => ({ id: d._id, label: d.name }));
    return [{ id: 'none', label: t('No Department') }, ...opts];
  }, [departments, t]);

  const positionOptions = useMemo(() => {
    if (!form.department_id || form.department_id === 'none') return [];
    const dept = departments.find(d => d._id === form.department_id);
    return (dept as any)?.positions_ids?.map((p: any) => ({ id: p._id, label: p.title || p.name })) || [];
  }, [departments, form.department_id]);

  const updateField = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        email: form.email,
        name: form.name,
        phone: form.phone,
        password: form.password,
        password_confirmation: form.password_confirmation,
        employee_detail: {
          country: form.country,
          city: form.city,
          work_hours: form.work_hours,
          salary: form.salary,
          yearly_day_offs: form.yearly_day_offs,
          weekend_days: form.weekend_days,
          date_of_birth: form.date_of_birth || undefined,
          roles_ids: form.roles_ids,
          shift_type: form.shift_type,
        },
      };
      if (form.department_id && form.department_id !== 'none') payload.employee_detail.department_id = form.department_id;
      if (form.position_id) payload.employee_detail.position_id = form.position_id;
      if (form.shift_type === 'HOURS') {
        payload.employee_detail.work_hours = form.work_hours;
      } else {
        payload.employee_detail.shift_start_time = form.shift_start_time;
        payload.employee_detail.shift_end_time = form.shift_end_time;
      }
      if (form.storage_quota !== null) payload.employee_detail.storage_quota = form.storage_quota;
      await createEmployee(payload);
      onSuccess?.();
      onClose();
    } catch (e: any) {
      Alert.alert(t('Error'), e?.message || t('Failed to create employee'));
    } finally {
      setSaving(false);
    }
  };

  const renderSelect = (options: { id: string; label: string }[], value: string | null, onChange: (v: string) => void, placeholder: string) => (
    <SelectDropdown
      options={options.map(o => ({ label: o.label, value: o.id }))}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      label={placeholder}
    />
  );

  const renderMultiSelect = (options: { id: string; label: string }[], value: string[], onChange: (v: string[]) => void, placeholder: string) => (
    <MultiSelectDropdown
      options={options.map(o => ({ label: o.label, value: o.id }))}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      label={placeholder}
    />
  );

  const inputStyle = (focused: boolean) => ({
    ...styles.input,
    backgroundColor: colors.background,
    borderColor: focused ? colors.primary : colors.border,
    color: colors.ink,
  });

  return (
    <Modal visible={visible} onClose={onClose} title={t('Add New Employee')} size="full" noScroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {step === 1 && (
            <View style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, { color: colors.primary, borderLeftColor: colors.primary, textAlign: isRTL ? 'right' : 'left' }]}>{t('Personal Information')}</Text>
              <InputField label={t('Full Name')} required value={form.name} onChangeText={v => updateField('name', v)} colors={colors} inputStyle={inputStyle} isRTL={isRTL} />
              <View style={styles.row}>
                <InputField label={t('Email')} required={!false} value={form.email} onChangeText={v => updateField('email', v)} colors={colors} inputStyle={inputStyle} containerStyle={{ flex: 1 }} keyboardType="email-address" isRTL={isRTL} />
                <InputField label={t('Phone')} required value={form.phone} onChangeText={v => updateField('phone', v)} colors={colors} inputStyle={inputStyle} containerStyle={{ flex: 1 }} keyboardType="phone-pad" isRTL={isRTL} />
              </View>
              <View style={styles.row}>
                <InputField label={t('Password')} required value={form.password} onChangeText={v => updateField('password', v)} colors={colors} inputStyle={inputStyle} containerStyle={{ flex: 1 }} secureTextEntry isRTL={isRTL} />
                <InputField label={t('Confirm Password')} required value={form.password_confirmation} onChangeText={v => updateField('password_confirmation', v)} colors={colors} inputStyle={inputStyle} containerStyle={{ flex: 1 }} secureTextEntry isRTL={isRTL} />
              </View>
              <DateField mode="date" label={t('Date of Birth')} value={form.date_of_birth} onChange={v => updateField('date_of_birth', v)} />
              <Text style={[styles.subSectionTitle, { color: colors.ink, borderLeftColor: colors.primary, textAlign: isRTL ? 'right' : 'left' }]}>{t('Location')}</Text>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>{renderSelect(COUNTRIES, form.country, v => updateField('country', v), t('Country'))}</View>
                <View style={{ flex: 1 }}>{renderSelect(CITIES, form.city, v => updateField('city', v), t('City'))}</View>
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, { color: colors.primary, borderLeftColor: colors.primary, textAlign: isRTL ? 'right' : 'left' }]}>{t('Employment Details')}</Text>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>{renderSelect(deptOptions, form.department_id, v => { updateField('department_id', v === 'none' ? null : v); updateField('position_id', null); }, t('Department'))}</View>
                <View style={{ flex: 1 }}>{renderSelect(positionOptions, form.position_id, v => updateField('position_id', v), t('Position'))}</View>
              </View>

              <Text style={[styles.subSectionTitle, { color: colors.ink, borderLeftColor: colors.primary, textAlign: isRTL ? 'right' : 'left' }]}>{t('Financial & Schedule')}</Text>
              <View style={styles.row}>
                <InputField label={t('Salary')} required value={String(form.salary)} onChangeText={v => updateField('salary', Number(v) || 0)} colors={colors} inputStyle={inputStyle} containerStyle={{ flex: 1 }} keyboardType="numeric" isRTL={isRTL} />
                <View style={{ flex: 1 }}>{renderSelect(SHIFT_TYPES, form.shift_type, v => updateField('shift_type', v), t('Shift Type'))}</View>
              </View>

              {form.shift_type === 'HOURS' ? (
                <InputField label={t('Work Hours')} required value={String(form.work_hours)} onChangeText={v => updateField('work_hours', Number(v) || 0)} colors={colors} inputStyle={inputStyle} keyboardType="numeric" isRTL={isRTL} />
              ) : (
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <DateField mode="time" label={t('Shift Start')} value={form.shift_start_time} onChange={v => updateField('shift_start_time', v)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <DateField mode="time" label={t('Shift End')} value={form.shift_end_time} onChange={v => updateField('shift_end_time', v)} />
                  </View>
                </View>
              )}

              <View style={styles.row}>
                <InputField label={t('Yearly Days-Off')} required value={String(form.yearly_day_offs)} onChangeText={v => updateField('yearly_day_offs', Number(v) || 0)} colors={colors} inputStyle={inputStyle} containerStyle={{ flex: 1 }} keyboardType="numeric" isRTL={isRTL} />
                <InputField label={t('Storage Quota (MB)')} value={form.storage_quota === null ? '' : String(form.storage_quota)} onChangeText={v => updateField('storage_quota', v === '' ? null : Number(v))} colors={colors} inputStyle={inputStyle} containerStyle={{ flex: 1 }} keyboardType="numeric" placeholder={t('Leave empty for unlimited')} isRTL={isRTL} />
              </View>

              {renderMultiSelect(WEEKEND_DAYS, form.weekend_days, v => updateField('weekend_days', v), t('Weekend Days'))}
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step > 1 && (
            <TouchableOpacity style={[styles.footerBtn, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={() => setStep(step - 1)}>
              <Text style={[styles.footerBtnText, { color: colors.primary, textAlign: isRTL ? 'right' : 'left' }]}>{t('Back')}</Text>
            </TouchableOpacity>
          )}
          {step < 2 ? (
            <TouchableOpacity style={[styles.footerBtn, { backgroundColor: colors.primary }]} onPress={() => setStep(step + 1)}>
              <Text style={[styles.footerBtnText, { color: '#FFF', textAlign: isRTL ? 'right' : 'left' }]}>{t('Next')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.footerBtn, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={saving}>
              <Text style={[styles.footerBtnText, { color: '#FFF', textAlign: isRTL ? 'right' : 'left' }]}>{saving ? t('Saving...') : t('Save')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function InputField({ label, value, onChangeText, colors, inputStyle, containerStyle, placeholder, keyboardType, secureTextEntry, required, isRTL }: {
  label: string; value: string; onChangeText: (v: string) => void; colors: any; inputStyle: (f: boolean) => any; containerStyle?: any; placeholder?: string; keyboardType?: any; secureTextEntry?: boolean; required?: boolean; isRTL: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[{ marginBottom: spacing.sm }, containerStyle]}>
      <Text style={[styles.label, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{label}{required ? ' *' : ''}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={inputStyle(focused)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { paddingBottom: spacing.lg },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: font.sizes.sm,
    fontWeight: font.weights.bold,
    borderLeftWidth: 4,
    paddingLeft: spacing.sm,
    marginBottom: spacing.md,
  },
  subSectionTitle: {
    fontSize: font.sizes.sm,
    fontWeight: font.weights.bold,
    borderLeftWidth: 4,
    paddingLeft: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: font.sizes.sm,
  },
  footer: { flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.sm },
  footerBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  footerBtnText: { fontSize: font.sizes.sm, fontWeight: font.weights.bold },
});

const selectStyles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  placeholder: { fontSize: font.sizes.xs, fontWeight: font.weights.medium, marginBottom: 4 },
  scroll: { maxHeight: 48 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  chipText: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
});

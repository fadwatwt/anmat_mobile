import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Check, User, Briefcase } from 'lucide-react-native';
import { createEmployee, fetchDepartments, fetchPositions } from '../services/employees';
import { Department, Position } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { font, radii, spacing } from '../theme';
import { useLocale } from '../context/LanguageContext';

const employmentTypes = [
  { label: 'Full Time', value: 'full_time' },
  { label: 'Part Time', value: 'part_time' },
  { label: 'Contract', value: 'contract' },
  { label: 'Intern', value: 'intern' },
] as const;

const genders = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
] as const;

type StepProps = {
  form: Partial<any>;
  setForm: (updater: (prev: Partial<any>) => Partial<any>) => void;
  colors: ReturnType<typeof useTheme>['colors'];
};

function PersonalInfoStep({ form, setForm, colors }: StepProps) {
  const { t } = useTranslation();
  const { isRTL } = useLocale();
  return (
    <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
      <Text style={[styles.stepTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{t('Personal Information')}</Text>

      <Text style={[styles.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('First Name *')}</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.first_name || ''} onChangeText={v => setForm(p => ({ ...p, first_name: v }))} placeholder={t('First Name')} placeholderTextColor={colors.textMuted} />

      <Text style={[styles.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('Last Name *')}</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.last_name || ''} onChangeText={v => setForm(p => ({ ...p, last_name: v }))} placeholder={t('Last Name')} placeholderTextColor={colors.textMuted} />

      <Text style={[styles.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('Email *')}</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.email || ''} onChangeText={v => setForm(p => ({ ...p, email: v }))} placeholder={t('email@example.com')} keyboardType="email-address" placeholderTextColor={colors.textMuted} />

      <Text style={[styles.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('Phone Number')}</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.phone || ''} onChangeText={v => setForm(p => ({ ...p, phone: v }))} placeholder={t('05xxxxxxxx')} keyboardType="phone-pad" placeholderTextColor={colors.textMuted} />

      <Text style={[styles.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('Gender')}</Text>
      <View style={styles.optionsRow}>
        {genders.map(g => (
          <TouchableOpacity key={g.value} style={[styles.optionBtn, { borderColor: colors.border }, form.gender === g.value && { borderColor: colors.primary, backgroundColor: colors.primaryLight }]} onPress={() => setForm(p => ({ ...p, gender: g.value }))}>
            <Text style={[styles.optionText, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }, form.gender === g.value && { color: colors.primary }]}>{t(g.label)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('Nationality')}</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.nationality || ''} onChangeText={v => setForm(p => ({ ...p, nationality: v }))} placeholder={t('Nationality')} placeholderTextColor={colors.textMuted} />

      <Text style={[styles.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('Country')}</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.country || ''} onChangeText={v => setForm(p => ({ ...p, country: v }))} placeholder={t('Country')} placeholderTextColor={colors.textMuted} />

      <Text style={[styles.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('City')}</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.city || ''} onChangeText={v => setForm(p => ({ ...p, city: v }))} placeholder={t('City')} placeholderTextColor={colors.textMuted} />

      <Text style={[styles.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('Address')}</Text>
      <TextInput style={[styles.inputMultiline, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.address || ''} onChangeText={v => setForm(p => ({ ...p, address: v }))} placeholder={t('Full Address')} multiline numberOfLines={3} placeholderTextColor={colors.textMuted} />

      <Text style={[styles.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('Date of Birth')}</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.date_of_birth || ''} onChangeText={v => setForm(p => ({ ...p, date_of_birth: v }))} placeholder={t('YYYY-MM-DD')} placeholderTextColor={colors.textMuted} />

      <Text style={[styles.sectionLabel, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{t('Emergency Contact')}</Text>

      <Text style={[styles.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('Name')}</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.emergency_contact_name || ''} onChangeText={v => setForm(p => ({ ...p, emergency_contact_name: v }))} placeholder={t('Name')} placeholderTextColor={colors.textMuted} />

      <Text style={[styles.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('Phone Number')}</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.emergency_contact_phone || ''} onChangeText={v => setForm(p => ({ ...p, emergency_contact_phone: v }))} placeholder={t('Phone Number')} keyboardType="phone-pad" placeholderTextColor={colors.textMuted} />

      <Text style={[styles.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('Relationship')}</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.emergency_contact_relation || ''} onChangeText={v => setForm(p => ({ ...p, emergency_contact_relation: v }))} placeholder={t('Relationship')} placeholderTextColor={colors.textMuted} />
    </ScrollView>
  );
}

function WorkInfoStep({ form, setForm, colors }: StepProps) {
  const { t } = useTranslation();
  const { isRTL } = useLocale();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    fetchDepartments().then(setDepartments).catch(() => {});
    fetchPositions().then(setPositions).catch(() => {});
  }, []);

  return (
    <ScrollView style={styles.stepScroll} showsVerticalScrollIndicator={false}>
      <Text style={[styles.stepTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{t('Work Information')}</Text>

      <Text style={[styles.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('Department')}</Text>
      <View style={styles.optionsRow}>
        {departments.map(d => (
          <TouchableOpacity key={d._id} style={[styles.optionBtn, { borderColor: colors.border }, form.department_id === d._id && { borderColor: colors.primary, backgroundColor: colors.primaryLight }]} onPress={() => setForm(p => ({ ...p, department_id: d._id }))}>
            <Text style={[styles.optionText, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }, form.department_id === d._id && { color: colors.primary }]}>{d.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('Position')}</Text>
      <View style={styles.optionsRow}>
        {positions.map(p => (
          <TouchableOpacity key={p._id} style={[styles.optionBtn, { borderColor: colors.border }, form.position_id === p._id && { borderColor: colors.primary, backgroundColor: colors.primaryLight }]} onPress={() => setForm(prev => ({ ...prev, position_id: p._id }))}>
            <Text style={[styles.optionText, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }, form.position_id === p._id && { color: colors.primary }]}>{p.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('Employee ID')}</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.employee_id || ''} onChangeText={v => setForm(p => ({ ...p, employee_id: v }))} placeholder={t('EMP-001')} placeholderTextColor={colors.textMuted} />

      <Text style={[styles.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('Hire Date')}</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.hire_date || ''} onChangeText={v => setForm(p => ({ ...p, hire_date: v }))} placeholder={t('YYYY-MM-DD')} placeholderTextColor={colors.textMuted} />

      <Text style={[styles.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('Employment Type')}</Text>
      <View style={styles.optionsRow}>
        {employmentTypes.map(et => (
          <TouchableOpacity key={et.value} style={[styles.optionBtn, { borderColor: colors.border }, form.employment_type === et.value && { borderColor: colors.primary, backgroundColor: colors.primaryLight }]} onPress={() => setForm(p => ({ ...p, employment_type: et.value }))}>
            <Text style={[styles.optionText, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }, form.employment_type === et.value && { color: colors.primary }]}>{t(et.label)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('Salary')}</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.salary != null ? String(form.salary) : ''} onChangeText={v => setForm(p => ({ ...p, salary: v ? Number(v) : undefined }))} placeholder={t('0')} keyboardType="numeric" placeholderTextColor={colors.textMuted} />

      <Text style={[styles.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('Work Schedule')}</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.work_schedule || ''} onChangeText={v => setForm(p => ({ ...p, work_schedule: v }))} placeholder={t('9:00 AM - 5:00 PM')} placeholderTextColor={colors.textMuted} />

      <Text style={[styles.sectionLabel, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{t('Bank Information')}</Text>

      <Text style={[styles.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('Bank Name')}</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.bank_name || ''} onChangeText={v => setForm(p => ({ ...p, bank_name: v }))} placeholder={t('Bank Name')} placeholderTextColor={colors.textMuted} />

      <Text style={[styles.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('Bank Account Number')}</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.bank_account || ''} onChangeText={v => setForm(p => ({ ...p, bank_account: v }))} placeholder={t('Account Number')} placeholderTextColor={colors.textMuted} />

      <Text style={[styles.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('Tax Number')}</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.tax_number || ''} onChangeText={v => setForm(p => ({ ...p, tax_number: v }))} placeholder={t('Tax Number')} placeholderTextColor={colors.textMuted} />
    </ScrollView>
  );
}

export function CreateEmployeeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Partial<any>>({});
  const { isRTL } = useLocale();

  const updateForm = (updater: (prev: Partial<any>) => Partial<any>) => {
    setForm(prev => ({ ...prev, ...updater(prev) }));
  };

  const validateStep1 = () => {
    if (!form.first_name?.trim()) { Alert.alert(t('Error'), t('Please enter first name')); return false; }
    if (!form.last_name?.trim()) { Alert.alert(t('Error'), t('Please enter last name')); return false; }
    if (!form.email?.trim()) { Alert.alert(t('Error'), t('Please enter email')); return false; }
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await createEmployee(form as any);
      Alert.alert(t('Success'), t('Employee added successfully'));
      navigation.goBack();
    } catch (e: any) {
      Alert.alert(t('Error'), e?.response?.data?.message || t('Failed to add employee'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{t('Add New Employee')}</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={[styles.stepIndicator, { backgroundColor: colors.surface }]}>
        <View style={[styles.stepDot, step >= 1 && { backgroundColor: colors.primary }]}>
          <User size={16} color="#FFF" />
        </View>
        <View style={[styles.stepLine, { backgroundColor: colors.border }, step > 1 && { backgroundColor: colors.primary }]} />
        <View style={[styles.stepDot, step >= 2 && { backgroundColor: colors.primary }]}>
          <Briefcase size={16} color="#FFF" />
        </View>
      </View>

      <View style={styles.formContainer}>
        {step === 1 ? (
          <PersonalInfoStep form={form} setForm={updateForm} colors={colors} />
        ) : (
          <WorkInfoStep form={form} setForm={updateForm} colors={colors} />
        )}
      </View>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {step === 1 ? (
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => { if (validateStep1()) setStep(2); }}>
            <Text style={[styles.primaryBtnText, { textAlign: isRTL ? 'right' : 'left' }]}>{t('Next')}</Text>
            <ArrowRight size={20} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.footerRow}>
            <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={() => setStep(1)}>
              <ArrowRight size={20} color={colors.ink} />
              <Text style={[styles.secondaryBtnText, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{t('Previous')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#FFF" /> : <Check size={20} color="#FFF" />}
              <Text style={[styles.primaryBtnText, { textAlign: isRTL ? 'right' : 'left' }]}>{submitting ? t('Saving...') : t('Save')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1 },
  headerTitle: { fontSize: font.sizes.lg, fontWeight: font.weights.semibold },
  backBtn: { width: 40 },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg, gap: spacing.sm },
  stepDot: { width: 36, height: 36, borderRadius: radii.full, backgroundColor: '#F0F1F3', alignItems: 'center', justifyContent: 'center' },
  stepLine: { height: 3, width: 60, borderRadius: 2 },
  formContainer: { flex: 1 },
  stepScroll: { flex: 1, padding: spacing.md },
  stepTitle: { fontSize: font.sizes.xl, fontWeight: font.weights.bold, marginBottom: spacing.lg },
  sectionLabel: { fontSize: font.sizes.lg, fontWeight: font.weights.semibold, marginTop: spacing.lg, marginBottom: spacing.md },
  label: { fontSize: font.sizes.sm, fontWeight: font.weights.medium, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: { height: 48, borderWidth: 1, borderRadius: radii.lg, paddingHorizontal: spacing.md, fontSize: font.sizes.base, marginBottom: spacing.sm },
  inputMultiline: { borderWidth: 1, borderRadius: radii.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: font.sizes.base, marginBottom: spacing.sm, textAlignVertical: 'top', minHeight: 80 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  optionBtn: { borderWidth: 1, borderRadius: radii.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  optionText: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  footer: { padding: spacing.md, borderTopWidth: 1 },
  footerRow: { flexDirection: 'row', gap: spacing.sm },
  primaryBtn: { flex: 1, height: 48, borderRadius: radii.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  primaryBtnText: { color: '#FFFFFF', fontSize: font.sizes.base, fontWeight: font.weights.semibold },
  secondaryBtn: { flex: 1, height: 48, borderRadius: radii.lg, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  secondaryBtnText: { fontSize: font.sizes.base, fontWeight: font.weights.semibold },
});

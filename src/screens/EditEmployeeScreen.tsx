import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { ArrowLeft, ArrowRight, Check, User, Briefcase } from 'lucide-react-native';
import { updateEmployee } from '../services/employees';
import { EmployeeDetailItem } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAppNavigation } from '../context/NavigationContext';
import { font, radii, spacing } from '../theme';

const employmentTypes = [
  { label: 'دوام كامل', value: 'full_time' },
  { label: 'دوام جزئي', value: 'part_time' },
  { label: 'عقد', value: 'contract' },
  { label: 'متدرب', value: 'intern' },
] as const;

const genders = [
  { label: 'ذكر', value: 'male' },
  { label: 'أنثى', value: 'female' },
] as const;

export function EditEmployeeScreen() {
  const { routeParams, goBack } = useAppNavigation();
  const employee = routeParams?.employee as any;
  const { colors } = useTheme();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Partial<any>>({});

  useEffect(() => {
    if (employee) {
      const nameParts = employee.name?.split(' ') || [];
      setForm({
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        email: employee.email || '',
        phone: employee.phone || '',
        employee_id: employee.employee_id || '',
        hire_date: employee.hire_date || '',
        salary: employee.salary || undefined,
        department_id: employee.department?._id || undefined,
        position_id: employee.position?._id || undefined,
        employment_type: employee.employment_type || undefined,
      });
    }
  }, [employee]);

  const updateForm = (updater: (prev: Partial<any>) => Partial<any>) => {
    setForm(prev => ({ ...prev, ...updater(prev) }));
  };

  const validateStep1 = () => {
    if (!form.first_name?.trim()) { Alert.alert('خطأ', 'الرجاء إدخال الاسم الأول'); return false; }
    if (!form.last_name?.trim()) { Alert.alert('خطأ', 'الرجاء إدخال الاسم الأخير'); return false; }
    if (!form.email?.trim()) { Alert.alert('خطأ', 'الرجاء إدخال البريد الإلكتروني'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!employee) return;
    setSubmitting(true);
    try {
      await updateEmployee({ id: employee._id, ...form });
      Alert.alert('تم', 'تم تحديث بيانات الموظف بنجاح');
      goBack();
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.message || 'فشل في تحديث البيانات');
    } finally {
      setSubmitting(false);
    }
  };

  if (!employee) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.danger }]}>لم يتم العثور على الموظف</Text>
        <TouchableOpacity onPress={goBack}>
          <Text style={[styles.backLink, { color: colors.primary }]}>العودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.ink }]}>تعديل بيانات الموظف</Text>
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

      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        {step === 1 ? (
          <>
            <Text style={[styles.stepTitle, { color: colors.ink }]}>المعلومات الشخصية</Text>

            <Text style={[styles.label, { color: colors.textMuted }]}>الاسم الأول *</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.first_name || ''} onChangeText={v => setForm(p => ({ ...p, first_name: v }))} placeholder="الاسم الأول" placeholderTextColor={colors.textMuted} />

            <Text style={[styles.label, { color: colors.textMuted }]}>الاسم الأخير *</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.last_name || ''} onChangeText={v => setForm(p => ({ ...p, last_name: v }))} placeholder="الاسم الأخير" placeholderTextColor={colors.textMuted} />

            <Text style={[styles.label, { color: colors.textMuted }]}>البريد الإلكتروني *</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.email || ''} onChangeText={v => setForm(p => ({ ...p, email: v }))} placeholder="email@example.com" keyboardType="email-address" placeholderTextColor={colors.textMuted} />

            <Text style={[styles.label, { color: colors.textMuted }]}>رقم الهاتف</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.phone || ''} onChangeText={v => setForm(p => ({ ...p, phone: v }))} placeholder="05xxxxxxxx" keyboardType="phone-pad" placeholderTextColor={colors.textMuted} />

            <Text style={[styles.label, { color: colors.textMuted }]}>الجنس</Text>
            <View style={styles.optionsRow}>
              {genders.map(g => (
                <TouchableOpacity key={g.value} style={[styles.optionBtn, { borderColor: colors.border }, form.gender === g.value && { borderColor: colors.primary, backgroundColor: colors.primaryLight }]} onPress={() => setForm(p => ({ ...p, gender: g.value }))}>
                  <Text style={[styles.optionText, { color: colors.textMuted }, form.gender === g.value && { color: colors.primary }]}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.textMuted }]}>الجنسية</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.nationality || ''} onChangeText={v => setForm(p => ({ ...p, nationality: v }))} placeholder="الجنسية" placeholderTextColor={colors.textMuted} />

            <Text style={[styles.label, { color: colors.textMuted }]}>البلد</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.country || ''} onChangeText={v => setForm(p => ({ ...p, country: v }))} placeholder="البلد" placeholderTextColor={colors.textMuted} />

            <Text style={[styles.label, { color: colors.textMuted }]}>المدينة</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.city || ''} onChangeText={v => setForm(p => ({ ...p, city: v }))} placeholder="المدينة" placeholderTextColor={colors.textMuted} />

            <Text style={[styles.label, { color: colors.textMuted }]}>العنوان</Text>
            <TextInput style={[styles.inputMultiline, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.address || ''} onChangeText={v => setForm(p => ({ ...p, address: v }))} placeholder="العنوان الكامل" multiline numberOfLines={3} placeholderTextColor={colors.textMuted} />
          </>
        ) : (
          <>
            <Text style={[styles.stepTitle, { color: colors.ink }]}>معلومات العمل</Text>

            <Text style={[styles.label, { color: colors.textMuted }]}>الرقم الوظيفي</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.employee_id || ''} onChangeText={v => setForm(p => ({ ...p, employee_id: v }))} placeholder="EMP-001" placeholderTextColor={colors.textMuted} />

            <Text style={[styles.label, { color: colors.textMuted }]}>تاريخ التعيين</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.hire_date || ''} onChangeText={v => setForm(p => ({ ...p, hire_date: v }))} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} />

            <Text style={[styles.label, { color: colors.textMuted }]}>نوع التوظيف</Text>
            <View style={styles.optionsRow}>
              {employmentTypes.map(et => (
                <TouchableOpacity key={et.value} style={[styles.optionBtn, { borderColor: colors.border }, form.employment_type === et.value && { borderColor: colors.primary, backgroundColor: colors.primaryLight }]} onPress={() => setForm(p => ({ ...p, employment_type: et.value }))}>
                  <Text style={[styles.optionText, { color: colors.textMuted }, form.employment_type === et.value && { color: colors.primary }]}>{et.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.textMuted }]}>الراتب</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.salary != null ? String(form.salary) : ''} onChangeText={v => setForm(p => ({ ...p, salary: v ? Number(v) : undefined }))} placeholder="0" keyboardType="numeric" placeholderTextColor={colors.textMuted} />

            <Text style={[styles.label, { color: colors.textMuted }]}>جدول العمل</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.work_schedule || ''} onChangeText={v => setForm(p => ({ ...p, work_schedule: v }))} placeholder="9:00 AM - 5:00 PM" placeholderTextColor={colors.textMuted} />

            <Text style={[styles.sectionLabel, { color: colors.ink }]}>معلومات بنكية</Text>

            <Text style={[styles.label, { color: colors.textMuted }]}>اسم البنك</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.bank_name || ''} onChangeText={v => setForm(p => ({ ...p, bank_name: v }))} placeholder="اسم البنك" placeholderTextColor={colors.textMuted} />

            <Text style={[styles.label, { color: colors.textMuted }]}>رقم الحساب البنكي</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.bank_account || ''} onChangeText={v => setForm(p => ({ ...p, bank_account: v }))} placeholder="رقم الحساب" placeholderTextColor={colors.textMuted} />

            <Text style={[styles.label, { color: colors.textMuted }]}>الرقم الضريبي</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]} value={form.tax_number || ''} onChangeText={v => setForm(p => ({ ...p, tax_number: v }))} placeholder="الرقم الضريبي" placeholderTextColor={colors.textMuted} />
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {step === 1 ? (
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => { if (validateStep1()) setStep(2); }}>
            <Text style={styles.primaryBtnText}>التالي</Text>
            <ArrowRight size={20} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.footerRow}>
            <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={() => setStep(1)}>
              <ArrowRight size={20} color={colors.ink} />
              <Text style={[styles.secondaryBtnText, { color: colors.ink }]}>السابق</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#FFF" /> : <Check size={20} color="#FFF" />}
              <Text style={styles.primaryBtnText}>{submitting ? 'جاري الحفظ...' : 'حفظ التغييرات'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: font.sizes.base, marginBottom: spacing.md },
  backLink: { fontSize: font.sizes.base, fontWeight: font.weights.semibold },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1 },
  headerTitle: { fontSize: font.sizes.lg, fontWeight: font.weights.semibold },
  backBtn: { width: 40 },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg, gap: spacing.sm },
  stepDot: { width: 36, height: 36, borderRadius: radii.full, backgroundColor: '#F0F1F3', alignItems: 'center', justifyContent: 'center' },
  stepLine: { height: 3, width: 60, borderRadius: 2 },
  formContainer: { flex: 1, padding: spacing.md },
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

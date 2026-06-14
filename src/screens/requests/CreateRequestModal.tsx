import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { DateField } from '../../components/DateField';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { createRequest, CreateRequestPayload, EmployeeAuthRequestType } from '../../services/requests';
import { extractErrorMessage } from '../../lib/http';
import { font, radii, spacing } from '../../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const TYPES: { id: EmployeeAuthRequestType; labelKey: string }[] = [
  { id: 'DAY_OFF', labelKey: 'Day Off' },
  { id: 'SALARY_ADVANCE', labelKey: 'Salary Advance' },
  { id: 'WORK_DELAY', labelKey: 'Work Delay' },
];

export function CreateRequestModal({ visible, onClose, onCreated }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { user } = useAuth();

  const [type, setType] = useState<EmployeeAuthRequestType>('DAY_OFF');
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [vacationDate, setVacationDate] = useState('');
  const [vacationEndDate, setVacationEndDate] = useState('');
  const [advanceBy, setAdvanceBy] = useState('');
  const [oldSalary, setOldSalary] = useState('');
  const [workDueAt, setWorkDueAt] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setType('DAY_OFF'); setReason(''); setComment('');
    setVacationDate(''); setVacationEndDate('');
    setAdvanceBy(''); setOldSalary(''); setWorkDueAt('');
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert(t('Required'), t('Reason is required'));
      return;
    }
    if (!user?._id) {
      Alert.alert(t('Error'), t('Something went wrong'));
      return;
    }
    const payload: CreateRequestPayload = {
      employee_id: user._id,
      type,
      reason: reason.trim(),
      comment: comment.trim() || undefined,
    };
    if (type === 'DAY_OFF') {
      if (!vacationDate) { Alert.alert(t('Required'), t('Vacation start date is required')); return; }
      payload.vacation_date = vacationDate;
      payload.vacation_end_date = vacationEndDate || undefined;
    } else if (type === 'SALARY_ADVANCE') {
      if (!advanceBy || !oldSalary) { Alert.alert(t('Required'), t('Please fill all fields')); return; }
      payload.advance_salary_by = advanceBy;
      payload.old_salary_amount = oldSalary;
    } else {
      if (!workDueAt) { Alert.alert(t('Required'), t('Work due at is required')); return; }
      payload.work_due_at = workDueAt;
    }

    setLoading(true);
    try {
      await createRequest(payload);
      Alert.alert(t('Success'), t('Request submitted successfully'));
      reset();
      onCreated();
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to submit request'));
    } finally {
      setLoading(false);
    }
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const inputStyle = [styles.input, { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: align }];

  return (
    <Modal visible={visible} onClose={onClose} title={t('New Request')} size="full">
      <View style={styles.form}>
        {/* Type selector */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Request Type')}</Text>
          <View style={[styles.typeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {TYPES.map((ty) => {
              const active = ty.id === type;
              return (
                <TouchableOpacity
                  key={ty.id}
                  style={[
                    styles.typeChip,
                    { borderColor: colors.border },
                    active && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setType(ty.id)}
                >
                  <Text style={[styles.typeChipText, { color: active ? '#FFF' : colors.textMuted }]}>{t(ty.labelKey)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {type === 'DAY_OFF' && (
          <>
            <DateField mode="date" label={t('Vacation Date')} value={vacationDate} onChange={setVacationDate} />
            <DateField mode="date" label={t('Vacation End Date')} value={vacationEndDate} onChange={setVacationEndDate} />
          </>
        )}

        {type === 'SALARY_ADVANCE' && (
          <>
            <Field label={t('Advance By')}>
              <TextInput style={inputStyle} keyboardType="numeric" placeholderTextColor={colors.textMuted} value={advanceBy} onChangeText={setAdvanceBy} />
            </Field>
            <Field label={t('Old Salary')}>
              <TextInput style={inputStyle} keyboardType="numeric" placeholderTextColor={colors.textMuted} value={oldSalary} onChangeText={setOldSalary} />
            </Field>
          </>
        )}

        {type === 'WORK_DELAY' && (
          <Field label={t('Work Due At')}>
            <TextInput style={inputStyle} placeholder="YYYY-MM-DD HH:MM" placeholderTextColor={colors.textMuted} value={workDueAt} onChangeText={setWorkDueAt} />
          </Field>
        )}

        <Field label={t('Reason')}>
          <TextInput style={[...inputStyle, styles.multiline]} multiline placeholderTextColor={colors.textMuted} value={reason} onChangeText={setReason} />
        </Field>
        <Field label={t('Comment')}>
          <TextInput style={[...inputStyle, styles.multiline]} multiline placeholderTextColor={colors.textMuted} value={comment} onChangeText={setComment} />
        </Field>

        <Button label={t('Submit')} onPress={handleSubmit} loading={loading} />
      </View>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  form: { gap: spacing.md },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  multiline: { minHeight: 64, textAlignVertical: 'top' },
  typeChip: { borderRadius: radii.md, borderWidth: 1, flex: 1, minWidth: 80, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  typeChipText: { fontSize: font.sizes.xs, fontWeight: font.weights.medium, textAlign: 'center' },
  typeRow: { flexWrap: 'wrap', gap: spacing.xs },
});

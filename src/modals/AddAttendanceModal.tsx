import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { EmployeePicker } from '../components/EmployeePicker';
import { DateField } from '../components/DateField';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { createOrgAttendance, CreateAttendancePayload } from '../services/hr';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function AddAttendanceModal({ visible, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [lateMinutes, setLateMinutes] = useState('0');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setEmployeeId(''); setDate(''); setStartTime(''); setEndTime(''); setLateMinutes('0');
  }, [visible]);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const inputStyle = [styles.input, { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: align }];

  const handleSave = async () => {
    if (!employeeId) { Alert.alert(t('Required'), t('Please select an employee')); return; }
    if (!date) { Alert.alert(t('Required'), t('Date is required')); return; }
    if (!startTime) { Alert.alert(t('Required'), t('Start time is required')); return; }
    if (!endTime) { Alert.alert(t('Required'), t('End time is required')); return; }
    if (endTime <= startTime) { Alert.alert(t('Validation'), t('End time must be after start time')); return; }

    const payload: CreateAttendancePayload = {
      employee_id: employeeId,
      date,
      start_time: startTime,
      end_time: endTime,
      late_in_minutes: parseInt(lateMinutes, 10) || 0,
    };
    setSaving(true);
    try {
      await createOrgAttendance(payload);
      onSaved();
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title={t('Add an employee attendance')} size="md">
      <EmployeePicker
        value={employeeId}
        onChange={(id) => setEmployeeId(id)}
        label={t('Employee')}
        required
      />

      <DateField mode="date" label={t('Date')} required value={date} onChange={setDate} />

      <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={{ flex: 1 }}>
          <DateField mode="time" label={t('Start Time')} required value={startTime} onChange={setStartTime} />
        </View>
        <View style={{ flex: 1 }}>
          <DateField mode="time" label={t('End Time')} required value={endTime} onChange={setEndTime} />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Late Minutes')}</Text>
        <TextInput style={inputStyle} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textMuted} value={lateMinutes} onChangeText={setLateMinutes} />
      </View>

      <Button label={t('Save')} onPress={handleSave} loading={saving} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  row: { gap: spacing.sm },
});

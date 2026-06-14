import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { EmployeePicker } from '../components/EmployeePicker';
import { DateField } from '../components/DateField';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { createOrgLeave, CreateOrgLeavePayload } from '../services/hr';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Pre-fills employee when opened from EmployeeDetail */
  presetEmployeeId?: string;
};

export function AddShortLeaveModal({ visible, onClose, onSaved, presetEmployeeId }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDate(''); setStartTime(''); setEndTime('');
    setEmployeeId(presetEmployeeId || '');
  }, [visible, presetEmployeeId]);

  const handleSave = async () => {
    if (!employeeId) { Alert.alert(t('Required'), t('Please select an employee')); return; }
    if (!date) { Alert.alert(t('Required'), t('Date is required')); return; }
    if (!startTime) { Alert.alert(t('Required'), t('Start time is required')); return; }
    if (!endTime) { Alert.alert(t('Required'), t('End time is required')); return; }
    if (endTime <= startTime) { Alert.alert(t('Validation'), t('End time must be after start time')); return; }

    const payload: CreateOrgLeavePayload = { employee_id: employeeId, date, start_time: startTime, end_time: endTime };
    setSaving(true);
    try {
      await createOrgLeave(payload);
      onSaved();
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title={t('Add a Short Leave')} size="md">
      {!presetEmployeeId && (
        <EmployeePicker
          value={employeeId}
          onChange={(id) => setEmployeeId(id)}
          label={t('Employee')}
          required
        />
      )}

      <DateField mode="date" label={t('Date')} required value={date} onChange={setDate} />

      <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={{ flex: 1 }}>
          <DateField mode="time" label={t('Start Time')} required value={startTime} onChange={setStartTime} />
        </View>
        <View style={{ flex: 1 }}>
          <DateField mode="time" label={t('End Time')} required value={endTime} onChange={setEndTime} />
        </View>
      </View>

      <Button label={t('Save')} onPress={handleSave} loading={saving} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm },
});

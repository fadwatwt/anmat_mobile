import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { DateField } from '../components/DateField';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { createMyLeave, updateMyLeave, LeaveRow } from '../services/leaves';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** When set, the modal edits this leave record instead of creating a new one. */
  leave?: LeaveRow | null;
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function nowDate() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function timeFrom(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AddLeaveModal({ visible, onClose, onSaved, leave }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const isEdit = !!leave;
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (leave) {
      setDate(leave.date || '');
      setStartTime(leave.start_time || '');
      setEndTime(leave.end_time || '');
      setReason(leave.reason || '');
    } else {
      const now = new Date();
      const later = new Date(now.getTime() + 60 * 60 * 1000);
      setDate(nowDate());
      setStartTime(timeFrom(now));
      setEndTime(timeFrom(later));
      setReason('');
    }
  }, [visible, leave]);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  const handleSave = async () => {
    if (!date) { Alert.alert(t('Required'), t('Date is required')); return; }
    if (!startTime) { Alert.alert(t('Required'), t('Start time is required')); return; }
    if (!endTime) { Alert.alert(t('Required'), t('End time is required')); return; }
    if (endTime <= startTime) { Alert.alert(t('Validation'), t('End time must be after start time')); return; }
    if (!reason.trim()) { Alert.alert(t('Required'), t('Reason is required')); return; }

    const payload = { date, start_time: startTime, end_time: endTime, reason: reason.trim() };
    setSaving(true);
    try {
      if (isEdit && leave) await updateMyLeave(leave._id, payload);
      else await createMyLeave(payload);
      onSaved();
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title={isEdit ? t('Edit Leave Request') : t('Request a Short Leave')} size="md">
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
        <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Reason')} *</Text>
        <TextInput
          style={[
            styles.input,
            styles.multiline,
            { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: align },
          ]}
          placeholderTextColor={colors.textMuted}
          placeholder={t('Explain the reason for your request')}
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={3}
        />
      </View>

      <Button label={t('Save')} onPress={handleSave} loading={saving} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  input: {
    borderRadius: radii.lg,
    borderWidth: 1,
    fontSize: font.sizes.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  multiline: { minHeight: 64, paddingTop: spacing.sm, textAlignVertical: 'top' },
  row: { gap: spacing.sm },
});

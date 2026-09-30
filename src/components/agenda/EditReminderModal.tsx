import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { DateField } from '../DateField';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LanguageContext';
import { font, radii, spacing } from '../../theme';
import { Appointment, deleteAppointment, updateAppointment } from '../../services/appointments';
import { extractErrorMessage } from '../../lib/http';
import { UserType } from '../../types';
import { todayISO } from './agendaShared';
import { Field, ReminderChips } from './agendaForm';

type Props = {
  visible: boolean;
  reminder: Appointment | null;
  onClose: () => void;
  onSaved: () => void;
  onDeleted?: () => void;
  role: UserType | undefined;
};

export function EditReminderModal({ visible, reminder, onClose, onSaved, onDeleted, role }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayISO());
  const [startTime, setStartTime] = useState('09:00');
  const [reminderTypes, setReminderTypes] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && reminder) {
      setTitle(reminder.title || '');
      setDate((reminder.date || '').slice(0, 10) || todayISO());
      setStartTime(reminder.start_time || '09:00');
      setReminderTypes(reminder.reminder_types || []);
      setNotes(reminder.description || reminder.notes || '');
    }
  }, [visible, reminder]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('Required'), t('Title is required'));
      return;
    }
    setLoading(true);
    try {
      await updateAppointment(role, reminder!._id, {
        title: title.trim(),
        date,
        start_time: startTime,
        reminder_types: reminderTypes,
        notes,
      });
      onSaved();
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to update. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!reminder) return;
    Alert.alert(t('Delete Reminder?'), t('Are you sure?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await deleteAppointment(role, reminder._id);
            onDeleted?.();
            onClose();
          } catch (e) {
            Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to delete. Please try again.'));
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const inputStyle = [styles.input, { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: (isRTL ? 'right' : 'left') as 'right' | 'left' }];

  return (
    <Modal visible={visible} onClose={onClose} title={t('Edit Reminder')} size="md">
      <View style={styles.form}>
        <Field label={t('Title')}>
          <TextInput style={inputStyle} value={title} onChangeText={setTitle} placeholder={t('Enter title')} placeholderTextColor={colors.textMuted} />
        </Field>

        <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.half}>
            <DateField mode="date" label={t('Date')} value={date} onChange={setDate} required />
          </View>
          <View style={styles.half}>
            <DateField mode="time" label={t('Time')} value={startTime} onChange={setStartTime} required />
          </View>
        </View>

        <Field label={t('Notify me')}>
          <ReminderChips value={reminderTypes} onChange={setReminderTypes} />
        </Field>

        <Field label={t('Notes')}>
          <TextInput style={[inputStyle, styles.textarea]} value={notes} onChangeText={setNotes} multiline placeholder={t('Add any notes...')} placeholderTextColor={colors.textMuted} />
        </Field>

        <Button label={t('Save')} onPress={handleSave} loading={loading} />
        {onDeleted && (
          <Button label={t('Delete')} onPress={handleDelete} loading={loading} variant="danger" />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  half: { flex: 1 },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  row: { gap: spacing.sm },
  textarea: { minHeight: 60, textAlignVertical: 'top' },
});

import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { DateField } from '../DateField';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LanguageContext';
import { createAppointment } from '../../services/appointments';
import { extractErrorMessage } from '../../lib/http';
import { UserType } from '../../types';
import { font, radii, spacing } from '../../theme';
import { ColorField, Field, ReminderChips } from './agendaForm';

type Props = {
  visible: boolean;
  onClose: () => void;
  task: { _id: string; title?: string; name?: string; description?: string; priority?: string; due_date?: string } | null;
  onCreated: () => void;
  role: UserType | undefined;
};

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dueDateISO(dateStr?: string): string {
  if (!dateStr) return tomorrowISO();
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return tomorrowISO();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function CreateAppointmentFromTaskModal({ visible, onClose, task, onCreated, role }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(tomorrowISO());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('');
  const [color, setColor] = useState('#8B5CF6');
  const [reminderTypes, setReminderTypes] = useState<string[]>(['1_day']);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && task) {
      setTitle(task.title || task.name || '');
      setDescription(task.description || '');
      setLocation('');
      setDate(dueDateISO(task.due_date));
      setStartTime('09:00');
      setEndTime('');
      setColor('#8B5CF6');
      setReminderTypes(['1_day']);
    }
  }, [visible, task]);

  const handleSubmit = async () => {
    if (!task) return;
    if (!title.trim()) {
      Alert.alert(t('Required'), t('Title is required'));
      return;
    }
    setLoading(true);
    try {
      await createAppointment(role, {
        title: title.trim(),
        description,
        location,
        date,
        start_time: startTime,
        end_time: endTime || undefined,
        category: 'task',
        color,
        reminder_types: reminderTypes,
        enable_reminders: true,
        task_id: task._id,
      });
      onCreated();
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to create. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = [styles.input, { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: (isRTL ? 'right' : 'left') as 'right' | 'left' }];

  return (
    <Modal visible={visible} onClose={onClose} title={t('Create Appointment from Task')} size="lg">
      <View style={styles.form}>
        <View style={[styles.taskPreview, { backgroundColor: colors.statusBg, borderColor: colors.border }]}>
          <View style={styles.taskInfo}>
            <Text style={[styles.taskTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
              📋 {t('Linked Task')}: {task?.title || task?.name || '--'}
            </Text>
            {!!task?.priority && (
              <Text style={[styles.taskDesc, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
                {t('Priority')}: {t(task.priority)}
              </Text>
            )}
          </View>
        </View>

        <Field label={t('Title')}>
          <TextInput style={inputStyle} value={title} onChangeText={setTitle} placeholder={t('Enter appointment title')} placeholderTextColor={colors.textMuted} />
        </Field>
        <Field label={t('Description')}>
          <TextInput style={[inputStyle, styles.textarea]} value={description} onChangeText={setDescription} multiline placeholder={t('Enter description')} placeholderTextColor={colors.textMuted} />
        </Field>
        <Field label={t('Location')}>
          <TextInput style={inputStyle} value={location} onChangeText={setLocation} placeholder={t('Enter location')} placeholderTextColor={colors.textMuted} />
        </Field>

        <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.half}>
            <DateField mode="date" label={t('Date')} value={date} onChange={setDate} required />
          </View>
          <View style={styles.half}>
            <DateField mode="time" label={t('Start Time')} value={startTime} onChange={setStartTime} required />
          </View>
        </View>

        <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.half}>
            <DateField mode="time" label={t('End Time')} value={endTime} onChange={setEndTime} />
          </View>
          <View style={styles.half}>
            <Field label={t('Color')}>
              <ColorField value={color} onChange={setColor} />
            </Field>
          </View>
        </View>

        <Field label={t('Reminders')}>
          <ReminderChips value={reminderTypes} onChange={setReminderTypes} />
        </Field>

        <Button label={t('Create Appointment')} onPress={handleSubmit} loading={loading} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  half: { flex: 1 },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  row: { gap: spacing.sm },
  taskDesc: { fontSize: font.sizes.xs },
  taskInfo: { flex: 1, gap: 2 },
  taskPreview: { alignItems: 'center', borderRadius: radii.lg, borderWidth: 1, padding: spacing.md },
  taskTitle: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  textarea: { minHeight: 60, textAlignVertical: 'top' },
});

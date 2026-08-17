import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { DateField } from '../DateField';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LanguageContext';
import { font, radii, spacing } from '../../theme';
import { Appointment, updateAppointment } from '../../services/appointments';
import { extractErrorMessage } from '../../lib/http';
import { UserType } from '../../types';
import { CATEGORY_OPTIONS, PRIORITY_OPTIONS, todayISO } from './agendaShared';
import { Chips, ColorField, Field, ReminderChips } from './agendaForm';

type Props = {
  visible: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onSaved: () => void;
  role: UserType | undefined;
};

export function EditAppointmentModal({ visible, appointment, onClose, onSaved, role }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(todayISO());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('');
  const [category, setCategory] = useState('task');
  const [priority, setPriority] = useState('medium');
  const [color, setColor] = useState('#3B82F6');
  const [reminderTypes, setReminderTypes] = useState<string[]>([]);
  const [enableReminders, setEnableReminders] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && appointment) {
      setTitle(appointment.title || '');
      setDescription(appointment.description || '');
      setLocation(appointment.location || '');
      setDate((appointment.date || '').slice(0, 10) || todayISO());
      setStartTime(appointment.start_time || '09:00');
      setEndTime(appointment.end_time || '');
      setCategory(appointment.category || 'task');
      setPriority(appointment.priority || 'medium');
      setColor(appointment.color || '#3B82F6');
      setReminderTypes(appointment.reminder_types || []);
      setEnableReminders(appointment.enable_reminders ?? true);
    }
  }, [visible, appointment]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('Required'), t('Title is required'));
      return;
    }
    setLoading(true);
    try {
      await updateAppointment(role, appointment!._id, {
        title: title.trim(),
        description,
        location,
        date,
        start_time: startTime,
        end_time: endTime || undefined,
        category,
        priority: priority as any,
        color,
        reminder_types: reminderTypes,
        enable_reminders: enableReminders,
      });
      onSaved();
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to update. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = [styles.input, { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: (isRTL ? 'right' : 'left') as 'right' | 'left' }];

  return (
    <Modal visible={visible} onClose={onClose} title={t('Edit Appointment')} size="lg">
      <View style={styles.form}>
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
            <Field label={t('Priority')}>
              <Chips options={PRIORITY_OPTIONS} value={priority} onChange={setPriority} />
            </Field>
          </View>
        </View>

        <Field label={t('Category')}>
          <Chips options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
        </Field>

        <Field label={t('Color')}>
          <ColorField value={color} onChange={setColor} />
        </Field>

        <Field label={t('Reminders')}>
          <ReminderChips value={reminderTypes} onChange={setReminderTypes} />
        </Field>

        <ToggleRow
          label={t('Enable reminders')}
          value={enableReminders}
          onChange={setEnableReminders}
        />

        <Button label={t('Save Changes')} onPress={handleSave} loading={loading} />
      </View>
    </Modal>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  return (
    <TouchableOpacity
      style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: spacing.sm }]}
      onPress={() => onChange(!value)}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, { borderColor: value ? colors.primary : colors.border, backgroundColor: value ? colors.primary : 'transparent' }]}>
        {value ? <Text style={styles.checkboxText}>✓</Text> : null}
      </View>
      <Text style={[styles.toggleLabel, { color: colors.ink }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  checkbox: { alignItems: 'center', borderRadius: 4, borderWidth: 1.5, height: 20, justifyContent: 'center', width: 20 },
  checkboxText: { color: '#FFF', fontSize: font.sizes.xs, fontWeight: 'bold' },
  form: { gap: spacing.md },
  half: { flex: 1 },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  row: { gap: spacing.sm },
  textarea: { minHeight: 60, textAlignVertical: 'top' },
  toggleLabel: { fontSize: font.sizes.sm },
});

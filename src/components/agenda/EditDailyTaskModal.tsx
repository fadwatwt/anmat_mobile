import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { DateField } from '../DateField';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LanguageContext';
import { font, radii, spacing } from '../../theme';
import { DailyTask, updateDailyTask } from '../../services/appointments';
import { extractErrorMessage } from '../../lib/http';
import { UserType } from '../../types';
import { PRIORITY_OPTIONS, todayISO } from './agendaShared';
import { Chips, Field } from './agendaForm';

type Props = {
  visible: boolean;
  task: DailyTask | null;
  onClose: () => void;
  onSaved: () => void;
  role: UserType | undefined;
};

export function EditDailyTaskModal({ visible, task, onClose, onSaved, role }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayISO());
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setDate((task.date || '').slice(0, 10) || todayISO());
      setPriority(task.priority || 'medium');
    }
  }, [visible, task]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('Required'), t('Title is required'));
      return;
    }
    setLoading(true);
    try {
      await updateDailyTask(role, task!._id, {
        title: title.trim(),
        description,
        date,
        priority: priority as any,
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
    <Modal visible={visible} onClose={onClose} title={t('Edit Task')} size="md">
      <View style={styles.form}>
        <Field label={t('Title')}>
          <TextInput style={inputStyle} value={title} onChangeText={setTitle} placeholder={t('Enter title')} placeholderTextColor={colors.textMuted} />
        </Field>
        <Field label={t('Description')}>
          <TextInput style={[inputStyle, styles.textarea]} value={description} onChangeText={setDescription} multiline placeholder={t('Enter description')} placeholderTextColor={colors.textMuted} />
        </Field>

        <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.half}>
            <DateField mode="date" label={t('Date')} value={date} onChange={setDate} required />
          </View>
          <View style={styles.half}>
            <Field label={t('Priority')}>
              <Chips options={PRIORITY_OPTIONS} value={priority} onChange={setPriority} />
            </Field>
          </View>
        </View>

        <Button label={t('Save Changes')} onPress={handleSave} loading={loading} />
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

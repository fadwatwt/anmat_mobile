import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CalendarCheck2 } from 'lucide-react-native';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { DateField } from '../DateField';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LanguageContext';
import { createDailyTask } from '../../services/appointments';
import { extractErrorMessage } from '../../lib/http';
import { UserType } from '../../types';
import { font, radii, spacing } from '../../theme';
import { PRIORITY_OPTIONS, todayISO } from './agendaShared';
import { Chips, Field } from './agendaForm';

type Props = {
  visible: boolean;
  onClose: () => void;
  task: { _id: string; title?: string; name?: string; description?: string; priority?: string; due_date?: string } | null;
  onCreated: () => void;
  role: UserType | undefined;
};

export function AddToAgendaModal({ visible, onClose, task, onCreated, role }: Props) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const isArabic = i18n.language === 'ar';

  const [date, setDate] = useState(todayISO());
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setDate(todayISO());
      setPriority(task?.priority || 'medium');
    }
  }, [visible, task]);

  const handleSubmit = async () => {
    if (!task) return;
    setLoading(true);
    try {
      await createDailyTask(role, {
        title: task.title || task.name || '',
        description: task.description || '',
        date,
        priority: priority as any,
        category: 'other',
        is_personal: true,
        notes: t('Linked to task: {{name}}', { name: task.title || task.name }),
      });
      Alert.alert(t('Success'), t('Added to agenda'));
      onCreated();
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to add, please try again'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title={t('Add to Agenda')} size="sm">
      <View style={styles.form}>
        <View style={[styles.taskPreview, { backgroundColor: colors.statusBg, borderColor: colors.border }]}>
          <CalendarCheck2 size={18} color={colors.primary} />
          <View style={styles.taskInfo}>
            <Text style={[styles.taskTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
              {task?.title || task?.name || '--'}
            </Text>
            {!!task?.description && (
              <Text style={[styles.taskDesc, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
                {task.description}
              </Text>
            )}
          </View>
        </View>

        <DateField mode="date" label={t('Date')} value={date} onChange={setDate} />

        <Field label={t('Priority')}>
          <Chips options={PRIORITY_OPTIONS} value={priority} onChange={setPriority} />
        </Field>

        <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.half}>
            <Button label={t('Cancel')} onPress={onClose} variant="ghost" />
          </View>
          <View style={styles.half}>
            <Button label={t('Add to Agenda')} onPress={handleSubmit} loading={loading} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.sm },
  form: { gap: spacing.md },
  half: { flex: 1 },
  taskDesc: { fontSize: font.sizes.xs },
  taskInfo: { flex: 1, gap: 2 },
  taskPreview: { alignItems: 'center', borderRadius: radii.lg, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  taskTitle: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
});

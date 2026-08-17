import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { DateField } from '../DateField';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { createAppointment, createDailyTask } from '../../services/appointments';
import { extractErrorMessage } from '../../lib/http';
import { font, radii, spacing } from '../../theme';
import { CATEGORY_OPTIONS, PRIORITY_OPTIONS, todayISO } from './agendaShared';
import { Chips, ColorField, Field, ReminderChips } from './agendaForm';

type Tab = 'appointment' | 'task' | 'reminder';

type Props = {
  visible: boolean;
  onClose: () => void;
  initialTab?: Tab;
  initialDate?: string | null;
  onCreated: () => void;
};

export function CreateAgendaModal({ visible, onClose, initialTab = 'appointment', initialDate, onCreated }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { user } = useAuth();
  const role = user?.type;

  const [tab, setTab] = useState<Tab>(initialTab);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(initialDate || todayISO());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('task');
  const [priority, setPriority] = useState('medium');
  const [color, setColor] = useState('#3B82F6');
  const [reminderTypes, setReminderTypes] = useState<string[]>([]);
  const [enableReminders, setEnableReminders] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setTab(initialTab);
      setTitle(''); setDescription(''); setLocation(''); setStartTime('09:00'); setEndTime('');
      setCategory('task'); setPriority('medium'); setDate(initialDate || todayISO());
      setColor('#3B82F6'); setReminderTypes([]); setEnableReminders(true);
    }
  }, [visible, initialTab, initialDate]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('Required'), t('Title is required'));
      return;
    }
    setLoading(true);
    try {
      if (tab === 'appointment') {
        await createAppointment(role, {
          title: title.trim(), description, location, date, start_time: startTime,
          end_time: endTime || undefined, category, priority: priority as any,
          color, reminder_types: reminderTypes, enable_reminders: enableReminders,
        });
      } else if (tab === 'reminder') {
        await createAppointment(role, {
          title: title.trim(), description, date, start_time: startTime,
          category: 'reminder', reminder_types: reminderTypes, enable_reminders: true,
        });
      } else {
        await createDailyTask(role, {
          title: title.trim(), description, date, priority: priority as any, category: 'other',
        });
      }
      onCreated();
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = [styles.input, { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: (isRTL ? 'right' : 'left') as 'right' | 'left' }];

  return (
    <Modal visible={visible} onClose={onClose} title={t('Add to Agenda')} size="lg">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.tabsContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            style={[styles.tabs, { backgroundColor: colors.statusBg }]}
          >
            {(['appointment', 'task', 'reminder'] as Tab[]).map((tb) => (
              <TouchableOpacity
                key={tb}
                style={[styles.tab, tab === tb && { backgroundColor: colors.surface }]}
                onPress={() => setTab(tb)}
              >
                <Text numberOfLines={1} style={[styles.tabText, { color: tab === tb ? colors.primary : colors.textMuted }]}>
                  {tb === 'appointment' ? t('Appointment') : tb === 'task' ? t('Task') : t('Reminder')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Field label={t('Title')}>
            <TextInput style={inputStyle} value={title} onChangeText={setTitle} placeholder={t('Enter title')} placeholderTextColor={colors.textMuted} />
          </Field>

          {tab !== 'reminder' && (
            <Field label={t('Description')}>
              <TextInput style={[inputStyle, styles.textarea]} value={description} onChangeText={setDescription} multiline placeholder={t('Enter description')} placeholderTextColor={colors.textMuted} />
            </Field>
          )}

          <DateField mode="date" label={t('Date')} value={date} onChange={setDate} />

          {tab === 'appointment' && (
            <>
              <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={styles.half}>
                  <DateField mode="time" label={t('Start Time')} value={startTime} onChange={setStartTime} />
                </View>
                <View style={styles.half}>
                  <DateField mode="time" label={t('End Time')} value={endTime} onChange={setEndTime} />
                </View>
              </View>
              <Field label={t('Location')}>
                <TextInput style={inputStyle} value={location} onChangeText={setLocation} placeholderTextColor={colors.textMuted} />
              </Field>
              <Field label={t('Category')}>
                <Chips options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
              </Field>
            </>
          )}

          {tab !== 'appointment' && (
            <Field label={t('Time')}>
              <DateField mode="time" label="" value={startTime} onChange={setStartTime} />
            </Field>
          )}

          {tab === 'task' && (
            <Field label={t('Priority')}>
              <Chips options={PRIORITY_OPTIONS} value={priority} onChange={setPriority} />
            </Field>
          )}

          {tab !== 'task' && (
            <>
              <Field label={t('Color')}>
                <ColorField value={color} onChange={setColor} />
              </Field>
              <Field label={tab === 'appointment' ? t('Reminders') : t('Notify me')}>
                <ReminderChips value={reminderTypes} onChange={setReminderTypes} />
              </Field>
              {tab === 'appointment' && (
                <ToggleRow
                  label={t('Enable reminders')}
                  value={enableReminders}
                  onChange={setEnableReminders}
                />
              )}
            </>
          )}

          <Button label={t('Save')} onPress={handleSave} loading={loading} />
        </View>
      </ScrollView>
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
  form: { gap: spacing.md, paddingBottom: spacing.md },
  half: { flex: 1 },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  row: { gap: spacing.sm },
  tab: { alignItems: 'center', borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  tabText: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  tabs: { borderRadius: radii.lg, padding: 3 },
  tabsContent: { gap: spacing.xs },
  textarea: { minHeight: 60, textAlignVertical: 'top' },
  toggleLabel: { fontSize: font.sizes.sm },
});

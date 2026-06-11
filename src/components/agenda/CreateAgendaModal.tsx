import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { createAppointment, createDailyTask } from '../../services/appointments';
import { extractErrorMessage } from '../../lib/http';
import { font, radii, spacing } from '../../theme';
import { CATEGORY_OPTIONS, PRIORITY_OPTIONS, todayISO } from './agendaShared';

type Tab = 'appointment' | 'task';

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
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setTitle(''); setDescription(''); setLocation(''); setStartTime('09:00'); setEndTime('');
    setCategory('task'); setPriority('medium'); setDate(initialDate || todayISO());
  };

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
        });
      } else {
        await createDailyTask(role, {
          title: title.trim(), description, date, priority: priority as any, category: 'other',
        });
      }
      reset();
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
          {/* Tab switch */}
          <View style={[styles.tabs, { backgroundColor: colors.statusBg }]}>
            {(['appointment', 'task'] as Tab[]).map((tb) => (
              <TouchableOpacity
                key={tb}
                style={[styles.tab, tab === tb && { backgroundColor: colors.surface }]}
                onPress={() => setTab(tb)}
              >
                <Text style={[styles.tabText, { color: tab === tb ? colors.primary : colors.textMuted }]}>
                  {tb === 'appointment' ? t('Appointment') : t('Task')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Field label={t('Title')}>
            <TextInput style={inputStyle} value={title} onChangeText={setTitle} placeholder={t('Enter title')} placeholderTextColor={colors.textMuted} />
          </Field>
          <Field label={t('Description')}>
            <TextInput style={[inputStyle, styles.textarea]} value={description} onChangeText={setDescription} multiline placeholder={t('Enter description')} placeholderTextColor={colors.textMuted} />
          </Field>
          <Field label={t('Date')}>
            <TextInput style={inputStyle} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} />
          </Field>

          {tab === 'appointment' && (
            <>
              <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={styles.half}>
                  <Field label={t('Start Time')}>
                    <TextInput style={inputStyle} value={startTime} onChangeText={setStartTime} placeholder="HH:MM" placeholderTextColor={colors.textMuted} />
                  </Field>
                </View>
                <View style={styles.half}>
                  <Field label={t('End Time')}>
                    <TextInput style={inputStyle} value={endTime} onChangeText={setEndTime} placeholder="HH:MM" placeholderTextColor={colors.textMuted} />
                  </Field>
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

          <Field label={t('Priority')}>
            <Chips options={PRIORITY_OPTIONS} value={priority} onChange={setPriority} />
          </Field>

          <Button label={t('Save')} onPress={handleSave} loading={loading} />
        </View>
      </ScrollView>
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

function Chips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={styles.chips}>
      {options.map((o) => (
        <TouchableOpacity
          key={o}
          style={[styles.chip, { borderColor: colors.border }, value === o && { backgroundColor: colors.primary, borderColor: colors.primary }]}
          onPress={() => onChange(o)}
        >
          <Text style={[styles.chipText, { color: value === o ? '#FFF' : colors.textMuted }]}>{t(o)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { borderRadius: radii.full, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  chipText: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  field: { gap: spacing.xs },
  form: { gap: spacing.md, paddingBottom: spacing.md },
  half: { flex: 1 },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  row: { gap: spacing.sm },
  tab: { alignItems: 'center', borderRadius: radii.md, flex: 1, paddingVertical: spacing.sm },
  tabText: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  tabs: { borderRadius: radii.lg, flexDirection: 'row', padding: 3 },
  textarea: { minHeight: 60, textAlignVertical: 'top' },
});

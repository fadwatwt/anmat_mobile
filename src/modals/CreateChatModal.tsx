import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { SelectDropdown, MultiSelectDropdown } from '../components/SelectDropdown';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { fetchEmployees } from '../services/employees';
import { createChat } from '../services/conversations';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

const MODEL_TYPE_OPTIONS = [
  { label: 'Project', value: 'Project' },
  { label: 'Team', value: 'Team' },
  { label: 'Department', value: 'Department' },
  { label: 'Issue', value: 'Issue' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export function CreateChatModal({ visible, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [title, setTitle] = useState('');
  const [modelType, setModelType] = useState('');
  const [modelRecord, setModelRecord] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [employees, setEmployees] = useState<{ label: string; value: string }[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTitle('');
    setModelType('');
    setModelRecord('');
    setParticipants([]);
    setLoadingEmployees(true);
    fetchEmployees({ limit: 200 })
      .then((emps) =>
        setEmployees(
          emps
            .map((e) => ({ label: e.user?.name || t('Unknown Employee'), value: e.user_id || e._id }))
            .filter((e) => e.value),
        ),
      )
      .catch(() => setEmployees([]))
      .finally(() => setLoadingEmployees(false));
  }, [visible, t]);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const inputStyle = [styles.input, { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: align }];

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert(t('Required'), t('Chat Group Title is required'));
      return;
    }
    if (participants.length === 0) {
      Alert.alert(t('Required'), t('Please select at least one member'));
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        title: title.trim(),
        participants_ids: participants,
        is_group: true,
      };
      if (modelType) payload.model_type = modelType;
      if (modelRecord.trim()) payload.model_id = modelRecord.trim();
      await createChat(payload);
      onSaved?.();
      onClose();
      Alert.alert(t('Success'), t('Chat group created successfully'));
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to save chat group'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title={t('Creating a Chat Group')} size="md">
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Chat Group Title')}</Text>
          <TextInput style={inputStyle} placeholder={t('Chat Group Title')} placeholderTextColor={colors.textMuted} value={title} onChangeText={setTitle} />
        </View>

        <View style={styles.field}>
          <SelectDropdown
            label={t('Model Type')}
            options={MODEL_TYPE_OPTIONS}
            value={modelType}
            onChange={setModelType}
            placeholder={t('Select Type')}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Model Record')}</Text>
          <TextInput style={inputStyle} placeholder={t('Model Record ID')} placeholderTextColor={colors.textMuted} value={modelRecord} onChangeText={setModelRecord} />
        </View>

        <View style={styles.field}>
          <MultiSelectDropdown
            label={t('Participants')}
            options={employees}
            value={participants}
            onChange={setParticipants}
            placeholder={loadingEmployees ? t('Loading employees...') : t('Select Participants')}
          />
        </View>

        <View style={[styles.note, { backgroundColor: colors.infoBg }]}>
          <View style={styles.noteDot} />
          <Text style={[styles.noteText, { color: colors.infoText }]}>
            {t('The creator becomes the group admin automatically. You can manage participants after creation.')}
          </Text>
        </View>

        <Button label={t('Save')} onPress={handleCreate} loading={saving} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  form: { gap: spacing.md },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  note: { borderRadius: radii.lg, flexDirection: 'row', gap: spacing.sm, padding: spacing.sm },
  noteDot: { backgroundColor: '#375DFB', borderRadius: radii.full, height: 8, marginTop: 4, width: 8 },
  noteText: { flex: 1, fontSize: font.sizes.xs, lineHeight: 18 },
});

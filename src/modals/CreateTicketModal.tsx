import React, { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { SelectDropdown } from '../components/SelectDropdown';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { createSupportTicket } from '../services/supportTickets';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Priority = 'low' | 'medium' | 'high' | 'urgent';

const PRIORITIES: Array<{ value: Priority; labelKey: string; color: string }> = [
  { value: 'low', labelKey: 'Low', color: '#64748B' },
  { value: 'medium', labelKey: 'Medium', color: '#3B82F6' },
  { value: 'high', labelKey: 'High', color: '#F59E0B' },
  { value: 'urgent', labelKey: 'Urgent', color: '#EF4444' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function CreateTicketModal({ visible, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('low');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) { setTitle(''); setDescription(''); setPriority('low'); }
  }, [visible]);

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert(t('Required'), t('Please fill all fields'));
      return;
    }
    setSaving(true);
    try {
      await createSupportTicket({ title: title.trim(), description: description.trim(), priority });
      onSaved();
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const inputStyle = [
    styles.input,
    { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: align },
  ];

  return (
    <Modal visible={visible} onClose={onClose} title={t('New Ticket')} size="md">
      <View style={styles.form}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Title')}</Text>
              <TextInput
                style={inputStyle}
                placeholder={t('Brief description of the issue')}
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
                maxLength={255}
              />
            </View>

            <View style={styles.field}>
              <SelectDropdown
                label={t('Priority')}
                options={PRIORITIES.map(p => ({ label: t(p.labelKey), value: p.value }))}
                value={priority}
                onChange={v => setPriority(v as Priority)}
                placeholder={t('Select priority...')}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Description')}</Text>
              <TextInput
                style={[inputStyle, styles.multiline]}
                placeholder={t('Detailed description of the issue')}
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
              />
            </View>

            <Button label={t('Save')} onPress={handleSave} loading={saving} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  chip: { borderRadius: radii.full, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: 6 },
  chipText: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  chips: { flexWrap: 'wrap', gap: spacing.xs },
  field: { gap: spacing.xs },
  form: { gap: spacing.md, paddingBottom: spacing.lg },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  multiline: { minHeight: 110, paddingTop: spacing.sm, textAlignVertical: 'top' },
});

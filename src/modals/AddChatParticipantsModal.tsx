import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { MultiSelectDropdown } from '../components/SelectDropdown';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { fetchEmployees } from '../services/employees';
import { addChatParticipants } from '../services/conversations';
import { extractErrorMessage } from '../lib/http';
import { font, spacing } from '../theme';
import type { ChatItem } from '../services/conversations';

type Props = {
  visible: boolean;
  onClose: () => void;
  chat: ChatItem | null;
  onSaved?: () => void;
};

export function AddChatParticipantsModal({ visible, onClose, chat, onSaved }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [selected, setSelected] = useState<string[]>([]);
  const [employees, setEmployees] = useState<{ label: string; value: string }[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible || !chat) return;
    const existing = new Set((chat.participants || []).map((p) => p._id?.toString()).filter(Boolean));
    setSelected([]);
    setLoadingEmployees(true);
    fetchEmployees({ limit: 200 })
      .then((emps) =>
        setEmployees(
          emps
            .map((e) => ({ label: e.user?.name || t('Unknown Employee'), value: e.user_id || e._id }))
            .filter((e) => e.value && !existing.has(e.value)),
        ),
      )
      .catch(() => setEmployees([]))
      .finally(() => setLoadingEmployees(false));
  }, [visible, chat, t]);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  const handleAdd = async () => {
    if (!chat) return;
    if (selected.length === 0) {
      Alert.alert(t('Required'), t('Please select at least one member'));
      return;
    }
    setSaving(true);
    try {
      await addChatParticipants(chat._id, selected);
      onSaved?.();
      onClose();
      Alert.alert(t('Success'), t('Chat group updated successfully'));
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to save chat group'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title={t('Add Participants')} size="md">
      <View style={styles.form}>
        <Text style={[styles.hint, { color: colors.textMuted, textAlign: align }]}>
          {t('Add members to the group')} «{chat?.title || ''}»
        </Text>
        <MultiSelectDropdown
          label={t('Participants')}
          options={employees}
          value={selected}
          onChange={setSelected}
          placeholder={loadingEmployees ? t('Loading employees...') : t('Select Participants')}
        />
        <Button label={t('Add')} onPress={handleAdd} loading={saving} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  hint: { fontSize: font.sizes.sm },
});

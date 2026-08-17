import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { MultiSelectDropdown } from '../components/SelectDropdown';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { createChat, fetchChatCandidates } from '../services/conversations';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated: (chatId: string) => void;
};

export function NewConversationModal({ visible, onClose, onCreated }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [candidates, setCandidates] = useState<{ label: string; value: string }[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [groupTitle, setGroupTitle] = useState('');
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [saving, setSaving] = useState(false);

  const isGroup = selected.length > 1;

  useEffect(() => {
    if (!visible) return;
    setSelected([]);
    setGroupTitle('');
    setLoadingCandidates(true);
    fetchChatCandidates()
      .then((list) =>
        setCandidates(list.map((c) => ({ label: c.name || t('Unknown'), value: c._id }))),
      )
      .catch(() => setCandidates([]))
      .finally(() => setLoadingCandidates(false));
  }, [visible, t]);

  useEffect(() => {
    if (isGroup) {
      const names = candidates
        .filter((c) => selected.includes(c.value))
        .map((c) => c.label)
        .join(', ');
      setGroupTitle(names);
    }
  }, [isGroup, selected, candidates]);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  const handleCreate = async () => {
    if (selected.length === 0) {
      Alert.alert(t('Required'), t('Please select at least one participant'));
      return;
    }
    if (isGroup && !groupTitle.trim()) {
      Alert.alert(t('Required'), t('Please enter a group title'));
      return;
    }
    setSaving(true);
    try {
      const direct = !isGroup;
      const chat = await createChat({
        title: isGroup ? groupTitle.trim() : candidates.find((c) => c.value === selected[0])?.label,
        participants_ids: selected,
        is_group: isGroup,
      });
      onClose();
      if (chat?._id) onCreated(chat._id);
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to create conversation'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title={t('New Conversation')} size="md">
      <View style={styles.form}>
        <MultiSelectDropdown
          label={t('Participants')}
          options={candidates}
          value={selected}
          onChange={setSelected}
          placeholder={loadingCandidates ? t('Loading...') : t('Select Participants')}
        />

        {isGroup && (
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Group Title')} *</Text>
            <TextInput
              style={[styles.input, { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: align }]}
              placeholder={t('Enter group title')}
              placeholderTextColor={colors.textMuted}
              value={groupTitle}
              onChangeText={setGroupTitle}
            />
          </View>
        )}

        <View style={[styles.note, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>
          <View style={styles.noteDot} />
          <Text style={[styles.noteText, { color: colors.textMuted, textAlign: align }]}>
            {t('Select one member for a direct chat or multiple members to start a group conversation.')}
          </Text>
        </View>

        <Button
          label={saving ? t('Creating...') : t('Start Conversation')}
          onPress={handleCreate}
          loading={saving}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  form: { gap: spacing.md },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  note: { borderRadius: radii.lg, borderWidth: 1, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md },
  noteDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#375DFB', marginTop: 4 },
  noteText: { fontSize: font.sizes.xs, flex: 1 },
});

import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Plus, X } from 'lucide-react-native';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { createPoll } from '../services/conversations';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  chatId: string | null;
  onCreated: () => void;
};

export function CreatePollModal({ visible, onClose, chatId, onCreated }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [saving, setSaving] = useState(false);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const inputStyle = [styles.input, { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: align }];

  const updateOption = (index: number, text: string) => {
    setOptions(prev => prev.map((o, i) => (i === index ? text : o)));
  };

  const addOption = () => {
    if (options.length >= 10) return;
    setOptions(prev => [...prev, '']);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!chatId) return;
    if (!question.trim()) {
      Alert.alert(t('Required'), t('Poll question is required'));
      return;
    }
    const filled = options.map(o => o.trim()).filter(Boolean);
    if (filled.length < 2) {
      Alert.alert(t('Required'), t('Poll must have at least 2 options'));
      return;
    }
    setSaving(true);
    try {
      await createPoll(chatId, {
        question: question.trim(),
        options: filled,
        allow_multiple_choice: multipleChoice,
      });
      onCreated();
      onClose();
      setQuestion('');
      setOptions(['', '']);
      setMultipleChoice(false);
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to create poll'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title={t('Create Poll')} size="md">
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Question')}</Text>
          <TextInput style={inputStyle} placeholder={t('Enter poll question')} placeholderTextColor={colors.textMuted} value={question} onChangeText={setQuestion} />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Options')}</Text>
          {options.map((opt, i) => (
            <View key={i} style={[styles.optionRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TextInput
                style={inputStyle}
                placeholder={`${t('Option')} ${i + 1}`}
                placeholderTextColor={colors.textMuted}
                value={opt}
                onChangeText={(text) => updateOption(i, text)}
              />
              {options.length > 2 && (
                <TouchableOpacity onPress={() => removeOption(i)} style={styles.removeBtn}>
                  <X size={16} color={colors.danger} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {options.length < 10 && (
            <TouchableOpacity
              onPress={addOption}
              style={[styles.addBtn, { borderColor: colors.border }]}
            >
              <Plus size={16} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: font.sizes.sm, fontWeight: font.weights.semibold }}>{t('Add Option')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setMultipleChoice(v => !v)}
          style={[styles.checkRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        >
          <View
            style={[
              styles.checkbox,
              { borderColor: multipleChoice ? colors.primary : colors.border, backgroundColor: multipleChoice ? colors.primary : 'transparent' },
            ]}
          >
            {multipleChoice && <Text style={styles.checkMark}>✓</Text>}
          </View>
          <Text style={[styles.checkLabel, { color: colors.ink, textAlign: align }]}>{t('Allow multiple choices')}</Text>
        </TouchableOpacity>

        <Button label={t('Create Poll')} onPress={handleCreate} loading={saving} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  addBtn: { alignItems: 'center', borderRadius: radii.lg, borderWidth: 1, borderStyle: 'dashed', flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', paddingVertical: spacing.sm },
  checkLabel: { flex: 1, fontSize: font.sizes.sm },
  checkMark: { color: '#FFF', fontSize: font.sizes.xs, fontWeight: font.weights.bold },
  checkRow: { alignItems: 'center', gap: spacing.sm },
  checkbox: { borderRadius: radii.sm, borderWidth: 2, height: 20, width: 20, alignItems: 'center', justifyContent: 'center' },
  field: { gap: spacing.xs },
  form: { gap: spacing.md },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  optionRow: { alignItems: 'center', gap: spacing.sm },
  removeBtn: { padding: spacing.sm },
});

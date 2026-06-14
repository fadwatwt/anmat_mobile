import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { createPosition, updatePosition } from '../services/hr';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  position?: any | null;
};

export function CreatePositionModal({ visible, onClose, onSaved, position }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const isEdit = !!position;

  useEffect(() => {
    if (visible) {
      setTitle(position?.title || position?.name || '');
      setDescription(position?.description || '');
    }
  }, [visible, position]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('Required'), t('Please fill all fields'));
      return;
    }
    setLoading(true);
    try {
      const payload: any = { title: title.trim(), description: description.trim() || undefined };
      if (isEdit && position) await updatePosition(position._id, payload);
      else await createPosition(payload);
      onSaved();
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const inputStyle = [styles.input, { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: align }];

  return (
    <Modal visible={visible} onClose={onClose} title={isEdit ? t('Edit Position') : t('Create a Position')} size="md">
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Position Name')}</Text>
          <TextInput style={inputStyle} placeholder={t('Enter position name')} placeholderTextColor={colors.textMuted} value={title} onChangeText={setTitle} />
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Description')}</Text>
          <TextInput
            style={[...inputStyle, styles.multiline]}
            placeholder={t('Enter Description')}
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>
        <Button label={t('Save')} onPress={handleSave} loading={loading} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  form: { gap: spacing.md },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  multiline: { height: 90, textAlignVertical: 'top' },
});

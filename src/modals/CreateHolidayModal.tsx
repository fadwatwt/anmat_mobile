import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { DateField } from '../components/DateField';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { createHoliday, updateHoliday, Holiday } from '../services/hr';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  holiday?: Holiday | null;
};

const toDateInput = (value?: string) => {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

export function CreateHolidayModal({ visible, onClose, onSaved, holiday }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const isEdit = !!holiday;

  useEffect(() => {
    if (visible) {
      setName(holiday?.name || '');
      setDate(toDateInput(holiday?.date));
      setDescription(holiday?.description || '');
    }
  }, [visible, holiday]);

  const handleSave = async () => {
    if (!name.trim() || !date.trim()) {
      Alert.alert(t('Required'), t('Please fill all fields'));
      return;
    }
    setLoading(true);
    try {
      const payload = { name: name.trim(), date, description: description.trim() || undefined };
      if (isEdit && holiday) await updateHoliday(holiday._id, payload);
      else await createHoliday(payload);
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
    <Modal visible={visible} onClose={onClose} title={isEdit ? t('Edit Holiday') : t('Add a Holiday')} size="md">
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Holiday Name')}</Text>
          <TextInput style={inputStyle} placeholder={t('Enter holiday name')} placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
        </View>
        <DateField mode="date" label={t('Date')} value={date} onChange={setDate} />

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

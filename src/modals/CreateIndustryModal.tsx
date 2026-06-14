import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { createIndustry, updateIndustry, Industry } from '../services/industries';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  industry?: Industry | null;
};

export function CreateIndustryModal({ visible, onClose, onSaved, industry }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [name, setName] = useState('');
  const [iconName, setIconName] = useState('');
  const [isAllowed, setIsAllowed] = useState(true);
  const [loading, setLoading] = useState(false);

  const isEdit = !!industry;

  useEffect(() => {
    if (visible) {
      setName(industry?.name || '');
      setIconName(industry?.icon_name || '');
      setIsAllowed(industry?.is_allowed ?? true);
    }
  }, [visible, industry]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('Required'), t('Please fill all fields'));
      return;
    }
    setLoading(true);
    try {
      const payload = { name: name.trim(), icon_name: iconName.trim() || undefined, is_allowed: isAllowed };
      if (isEdit && industry) await updateIndustry(industry._id, payload);
      else await createIndustry(payload);
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
    <Modal visible={visible} onClose={onClose} title={isEdit ? t('Edit Industry') : t('Add Industry')} size="md">
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Name')}</Text>
          <TextInput style={inputStyle} placeholder={t('Enter name')} placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Icon')}</Text>
          <TextInput style={inputStyle} placeholderTextColor={colors.textMuted} value={iconName} onChangeText={setIconName} />
        </View>
        <View style={[styles.switchRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.label, { color: colors.ink }]}>{t('Allowed')}</Text>
          <Switch value={isAllowed} onValueChange={setIsAllowed} trackColor={{ true: colors.primary }} />
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
  switchRow: { alignItems: 'center', justifyContent: 'space-between' },
});

import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LanguageContext';
import { updateProfile, ProfileUser } from '../../services/profile';
import { extractErrorMessage } from '../../lib/http';
import { font, radii, spacing } from '../../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  user: ProfileUser | null;
  isAdmin: boolean;
  onSaved: () => void;
};

export function EditProfileModal({ visible, onClose, user, isAdmin, onSaved }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('Required'), t('Name is required'));
      return;
    }
    setLoading(true);
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim() }, isAdmin);
      Alert.alert(t('Success'), t('Profile updated successfully'));
      onSaved();
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to update profile'));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = [styles.input, { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: (isRTL ? 'right' : 'left') as 'right' | 'left' }];

  return (
    <Modal visible={visible} onClose={onClose} title={t('Edit profile')} size="md">
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('Name')}</Text>
          <TextInput style={inputStyle} value={name} onChangeText={setName} placeholderTextColor={colors.textMuted} />
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('Phone')}</Text>
          <TextInput style={inputStyle} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={colors.textMuted} />
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
});

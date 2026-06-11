import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LanguageContext';
import { changePassword } from '../../services/profile';
import { extractErrorMessage } from '../../lib/http';
import { font, radii, spacing } from '../../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  isAdmin: boolean;
};

export function ChangePasswordModal({ visible, onClose, isAdmin }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirm('');
  };

  const handleSave = async () => {
    if (!oldPassword || !newPassword || !confirm) {
      Alert.alert(t('Required'), t('Please fill all fields'));
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert(t('Error'), t('Password must be at least 8 characters'));
      return;
    }
    if (newPassword !== confirm) {
      Alert.alert(t('Error'), t('Passwords must match'));
      return;
    }
    setLoading(true);
    try {
      await changePassword(
        { old_password: oldPassword, new_password: newPassword, new_password_confirmation: confirm },
        isAdmin,
      );
      Alert.alert(t('Success'), t('Password updated successfully'));
      reset();
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to update password'));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = [styles.input, { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: (isRTL ? 'right' : 'left') as 'right' | 'left' }];

  return (
    <Modal visible={visible} onClose={onClose} title={t('Change Password')} size="md">
      <View style={styles.form}>
        <Field label={t('Current Password')}>
          <TextInput style={inputStyle} secureTextEntry value={oldPassword} onChangeText={setOldPassword} placeholderTextColor={colors.textMuted} />
        </Field>
        <Field label={t('New Password')}>
          <TextInput style={inputStyle} secureTextEntry value={newPassword} onChangeText={setNewPassword} placeholderTextColor={colors.textMuted} />
        </Field>
        <Field label={t('Confirm Password')}>
          <TextInput style={inputStyle} secureTextEntry value={confirm} onChangeText={setConfirm} placeholderTextColor={colors.textMuted} />
        </Field>
        <Button label={t('Save')} onPress={handleSave} loading={loading} />
      </View>
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

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  form: { gap: spacing.md },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
});

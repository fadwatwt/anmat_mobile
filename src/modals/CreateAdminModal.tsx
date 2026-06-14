import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { createSystemAdmin, fetchAdminRoles, AdminRole } from '../services/systemAdmins';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function CreateAdminModal({ visible, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(''); setEmail(''); setPassword(''); setConfirm(''); setSelectedRoles([]);
      fetchAdminRoles().then(setRoles).catch(() => setRoles([]));
    }
  }, [visible]);

  const toggleRole = (id: string) =>
    setSelectedRoles((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert(t('Required'), t('Please fill all fields'));
      return;
    }
    if (password !== confirm) {
      Alert.alert(t('Error'), t('Passwords do not match!'));
      return;
    }
    setLoading(true);
    try {
      await createSystemAdmin({ name: name.trim(), email: email.trim(), password, admin_system_roles: selectedRoles });
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
    <Modal visible={visible} onClose={onClose} title={t('Create Admin')} size="md">
      <View style={styles.form}>
        <Field label={t('Name')}>
          <TextInput style={inputStyle} placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
        </Field>
        <Field label={t('Email')}>
          <TextInput style={inputStyle} autoCapitalize="none" keyboardType="email-address" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} />
        </Field>
        <Field label={t('Password')}>
          <TextInput style={inputStyle} secureTextEntry placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} />
        </Field>
        <Field label={t('Confirm Password')}>
          <TextInput style={inputStyle} secureTextEntry placeholderTextColor={colors.textMuted} value={confirm} onChangeText={setConfirm} />
        </Field>

        <Field label={t('Roles')}>
          <ScrollView style={[styles.rolesBox, { borderColor: colors.border }]} nestedScrollEnabled>
            {roles.length === 0 ? (
              <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, padding: spacing.sm }}>{t('No roles')}</Text>
            ) : (
              roles.map((role) => {
                const selected = selectedRoles.includes(role._id);
                return (
                  <TouchableOpacity
                    key={role._id}
                    style={[styles.roleRow, { borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                    onPress={() => toggleRole(role._id)}
                  >
                    <View style={[styles.checkbox, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : 'transparent' }]}>
                      {selected && <Check size={12} color="#FFF" />}
                    </View>
                    <Text style={[styles.roleText, { color: colors.ink, textAlign: align }]}>{role.name}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
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
  checkbox: { alignItems: 'center', borderRadius: radii.sm, borderWidth: 1.5, height: 18, justifyContent: 'center', width: 18 },
  field: { gap: spacing.xs },
  form: { gap: spacing.md },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  roleRow: { alignItems: 'center', borderBottomWidth: 1, gap: spacing.sm, paddingVertical: spacing.sm },
  roleText: { flex: 1, fontSize: font.sizes.sm },
  rolesBox: { borderRadius: radii.lg, borderWidth: 1, maxHeight: 160, paddingHorizontal: spacing.sm },
});

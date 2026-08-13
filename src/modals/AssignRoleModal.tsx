import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { assignAdminRole, fetchAdminRoles, AdminRole, SystemAdmin } from '../services/systemAdmins';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  admin: SystemAdmin | null;
  onClose: () => void;
  onAssigned: () => void;
};

export function AssignRoleModal({ visible, admin, onClose, onAssigned }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedRoleId('');
      fetchAdminRoles()
        .then((data) => {
          const assigned = new Set((admin?.admin_system_roles || []).map((r) => r._id));
          setRoles(data.filter((role) => !assigned.has(role._id)));
        })
        .catch(() => setRoles([]));
    }
  }, [visible, admin]);

  const handleAssign = async () => {
    if (!selectedRoleId || !admin) return;
    setLoading(true);
    try {
      await assignAdminRole(admin._id, selectedRoleId);
      onAssigned();
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  return (
    <Modal visible={visible} onClose={onClose} title={t('Assign Role')} size="sm">
      <View style={styles.form}>
        {roles.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('No available roles')}</Text>
        ) : (
          <ScrollView style={[styles.rolesBox, { borderColor: colors.border }]} nestedScrollEnabled>
            {roles.map((role) => {
              const selected = selectedRoleId === role._id;
              return (
                <TouchableOpacity
                  key={role._id}
                  style={[
                    styles.roleRow,
                    { borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' },
                    selected && { backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => setSelectedRoleId(role._id)}
                >
                  <View
                    style={[
                      styles.radio,
                      { borderColor: selected ? colors.primary : colors.border },
                      selected && { borderWidth: 6 },
                    ]}
                  />
                  <Text style={[styles.roleText, { color: colors.ink, textAlign: align }]}>{role.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <Button label={t('Assign')} onPress={handleAssign} loading={loading} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  emptyText: { fontSize: font.sizes.sm, paddingVertical: spacing.lg, textAlign: 'center' },
  form: { gap: spacing.md },
  radio: {
    borderRadius: radii.full,
    borderWidth: 1.5,
    height: 18,
    width: 18,
  },
  roleRow: {
    alignItems: 'center',
    borderRadius: radii.sm,
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  roleText: { flex: 1, fontSize: font.sizes.sm },
  rolesBox: {
    borderRadius: radii.lg,
    borderWidth: 1,
    maxHeight: 240,
    paddingHorizontal: spacing.sm,
  },
});

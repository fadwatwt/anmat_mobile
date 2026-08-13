import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { fetchAdminPermissions, AdminPermission } from '../services/adminPermissions';
import { createAdminRole, syncAdminRolePermissions, AdminRole } from '../services/adminRoles';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  mode: 'create' | 'sync';
  role?: AdminRole | null;
  onClose: () => void;
  onSaved: () => void;
};

export function AdminRoleModal({ visible, mode, role, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(role?.name || '');
      const current = new Set((role?.admin_permissions_ids || []).map((p) => p._id));
      fetchAdminPermissions()
        .then((data) => {
          setPermissions(data);
          setSelected(data.map((p) => p._id).filter((id) => current.has(id)));
        })
        .catch(() => {
          setPermissions([]);
          setSelected([]);
        });
    }
  }, [visible, role]);

  const allSelected = permissions.length > 0 && selected.length === permissions.length;
  const someSelected = selected.length > 0 && !allSelected;

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleAll = () => {
    setSelected((prev) => (prev.length === permissions.length ? [] : permissions.map((p) => p._id)));
  };

  const handleSubmit = async () => {
    if (mode === 'create' && !name.trim()) {
      Alert.alert(t('Required'), t('Role name is required'));
      return;
    }
    setLoading(true);
    try {
      if (mode === 'create') {
        await createAdminRole({ name: name.trim(), admin_permissions_ids: selected });
      } else if (role) {
        await syncAdminRolePermissions(role._id, selected);
      }
      onSaved();
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const inputStyle = [
    styles.input,
    { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: align },
  ];

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={mode === 'create' ? t('Add Role') : `${t('Sync Permissions')}${role?.name ? ` - ${role.name}` : ''}`}
      size="md"
    >
      <View style={styles.form}>
        {mode === 'create' && (
          <View>
            <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Role Name')} *</Text>
            <TextInput
              style={inputStyle}
              placeholderTextColor={colors.textMuted}
              placeholder={t('Enter Role Name...')}
              value={name}
              onChangeText={setName}
            />
          </View>
        )}

        <View>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Permissions')}</Text>
          <ScrollView style={[styles.permsBox, { borderColor: colors.border }]} nestedScrollEnabled>
            <TouchableOpacity
              style={[styles.permRow, styles.selectAllRow, { borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={toggleAll}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: allSelected ? colors.primary : colors.border,
                    backgroundColor: allSelected ? colors.primary : 'transparent',
                  },
                ]}
              >
                {(allSelected || someSelected) && <Check size={12} color="#FFF" />}
              </View>
              <Text style={[styles.permText, styles.selectAllText, { color: colors.ink, textAlign: align }]}>
                {t('Select All')}
              </Text>
            </TouchableOpacity>

            {permissions.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('No permissions available.')}</Text>
            ) : (
              permissions.map((permission) => {
                const isSelected = selected.includes(permission._id);
                return (
                  <TouchableOpacity
                    key={permission._id}
                    style={[styles.permRow, { borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                    onPress={() => toggle(permission._id)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: isSelected ? colors.primary : colors.border,
                          backgroundColor: isSelected ? colors.primary : 'transparent',
                        },
                      ]}
                    >
                      {isSelected && <Check size={12} color="#FFF" />}
                    </View>
                    <Text style={[styles.permText, { color: colors.ink, textAlign: align }]}>
                      {permission.name}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>

        <Button
          label={mode === 'create' ? t('Save') : t('Sync Permissions')}
          onPress={handleSubmit}
          loading={loading}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    alignItems: 'center',
    borderRadius: radii.sm,
    borderWidth: 1.5,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  emptyText: { fontSize: font.sizes.sm, padding: spacing.md, textAlign: 'center' },
  form: { gap: spacing.md },
  input: {
    borderRadius: radii.lg,
    borderWidth: 1,
    fontSize: font.sizes.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium, marginBottom: spacing.xs },
  permRow: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  permText: { flex: 1, fontSize: font.sizes.sm },
  permsBox: {
    borderRadius: radii.lg,
    borderWidth: 1,
    maxHeight: 280,
    paddingHorizontal: spacing.sm,
  },
  selectAllRow: { marginBottom: spacing.xs },
  selectAllText: { fontWeight: font.weights.semibold },
});
